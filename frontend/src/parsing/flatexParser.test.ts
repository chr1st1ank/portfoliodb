import { describe, it, expect } from 'vitest';
import { parseFlatexCsv, FlatexParser } from './flatexParser';
import { DataImportResult } from './types';
import { ParserRegistry } from './parser';

describe('flatexParser', () => {
  describe('FlatexParser class', () => {
    it('should be registered with the ParserRegistry', () => {
      const parsers = ParserRegistry.getParsers();
      const flatexParser = parsers.find(p => p.getName() === 'Flatex CSV');
      expect(flatexParser).toBeDefined();
      expect(flatexParser instanceof FlatexParser).toBe(true);
    });

    it('should have correct metadata', () => {
      const flatexParser = ParserRegistry.getParserByName('Flatex CSV');
      expect(flatexParser).toBeDefined();
      if (flatexParser) {
        expect(flatexParser.getName()).toBe('Flatex CSV');
        expect(flatexParser.getDescription()).toContain('Flatex CSV');
        expect(flatexParser.getSupportedExtensions()).toContain('csv');
      }
    });
  });

  describe('parseFlatexCsv', () => {
    it('should parse valid Flatex CSV content', () => {
      // Sample CSV content based on the provided example
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;24.05.2023;22.05.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF;2,208;Stk.;WP-Eingang IE00B3VTML14;3292980473;139,452;EUR;***148 Depot
1046585148;24.05.2023;22.05.2023;IE00BG36TC12;XTRACKERS ESG MSCI JAPAN UCITS ETF;3,266;Stk.;WP-Eingang IE00BG36TC12;3292980498;17,453;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);

      // Check that we have the expected investments
      expect(result.investments.length).toBe(2);
      expect(result.investments[0].isin).toBe('IE00B3VTML14');
      expect(result.investments[0].name).toBe('ISHARES GOVT BOND 3-7YR ETF');
      expect(result.investments[1].isin).toBe('IE00BG36TC12');
      expect(result.investments[1].name).toBe('XTRACKERS ESG MSCI JAPAN UCITS ETF');

      // Check that we have the expected movements
      expect(result.movements.length).toBe(2);
      expect(result.movements[0].quantity).toBeCloseTo(2.208);
      expect(result.movements[0].action).toBe(1); // Buy
      expect(result.movements[1].quantity).toBeCloseTo(3.266);
      expect(result.movements[1].action).toBe(1); // Buy

      // Check that we don't have errors or warnings
      expect(result.errors.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });

    it('should handle buy and sell transactions correctly', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;30.05.2023;01.06.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF;-23,000;Stk.;Ausführung ORDER Verkauf IE00B3VTML14 202825836;3298493673;122,905;EUR;***148 Depot
1046585148;30.05.2023;01.06.2023;DE0002635307;ISHARES STOXX EUROPE 600 (DE);274,000;Stk.;Ausführung ORDER Kauf DE0002635307 202826211;3298551283;45,805;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);

      // Check that we have the expected investments
      expect(result.investments.length).toBe(2);
      
      // Check that we have the expected movements
      expect(result.movements.length).toBe(2);
      expect(result.movements[0].action).toBe(2); // Sell
      expect(result.movements[0].quantity).toBeCloseTo(23.0);
      expect(result.movements[1].action).toBe(1); // Buy
      expect(result.movements[1].quantity).toBeCloseTo(274.0);
    });

    it('should handle empty content', () => {
      const result: DataImportResult = parseFlatexCsv('');
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('keine Daten');
    });

    it('should handle invalid date formats', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;invalid-date;22.05.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF;2,208;Stk.;WP-Eingang IE00B3VTML14;3292980473;139,452;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Ungültiges Datumsformat');
    });

    it('should handle invalid number formats', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;24.05.2023;22.05.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF;invalid;Stk.;WP-Eingang IE00B3VTML14;3292980473;139,452;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Ungültiger Wert für Nominal');
    });

    it('should handle missing required fields', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;;;;ISHARES GOVT BOND 3-7YR ETF;2,208;Stk.;WP-Eingang IE00B3VTML14;3292980473;139,452;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Fehlende Pflichtfelder');
    });

    it('should extract reasonable shortnames', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;24.05.2023;22.05.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF;2,208;Stk.;WP-Eingang IE00B3VTML14;3292980473;139,452;EUR;***148 Depot
1046585148;24.05.2023;22.05.2023;IE00BG36TC12;XTRACKERS ESG MSCI JAPAN UCITS ETF;3,266;Stk.;WP-Eingang IE00BG36TC12;3292980498;17,453;EUR;***148 Depot
1046585148;24.05.2023;22.05.2023;DE0002635307;ISHARES STOXX EUROPE 600 (DE);274,000;Stk.;WP-Eingang DE0002635307;3298551283;45,805;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);
      
      expect(result.investments[0].shortname).toBe('ISHARES GOVT');
      expect(result.investments[1].shortname).toBe('JAPAN UCITS');
      expect(result.investments[2].shortname).toBe('ISHARES STOXX');
    });

    it('should handle rows with insufficient fields', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung
1046585148;24.05.2023;22.05.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF`;

      const result: DataImportResult = parseFlatexCsv(csvContent);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Nicht genügend Felder');
    });

    it('should handle fusion transactions correctly', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;15.11.2023;14.11.2023;LU1737653045;AIS-M.NA ESG B.CTB UETFED;-148,478825;Stk.;Fusion in LU1737653045;3488243994;88,063;EUR;***148 Depot
1046585148;15.11.2023;14.11.2023;IE000MJIXFE0;AMUNDI MSCI NA ESG CLMT NT ZR AMBTCTBETF;148,478825;Stk.;Fusion in LU1737653045;3488244009;88,063;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);

      // Check that we have the expected investments
      expect(result.investments.length).toBe(2);
      expect(result.investments[0].isin).toBe('LU1737653045');
      expect(result.investments[1].isin).toBe('IE000MJIXFE0');
      
      // Check that we have the expected movements
      expect(result.movements.length).toBe(2);
      expect(result.movements[0].action).toBe(2); // Sell (negative quantity)
      expect(result.movements[0].quantity).toBeCloseTo(148.478825);
      expect(result.movements[0].investment).toBe(1); // First investment ID
      
      expect(result.movements[1].action).toBe(1); // Buy (positive quantity)
      expect(result.movements[1].quantity).toBeCloseTo(148.478825);
      expect(result.movements[1].investment).toBe(2); // Second investment ID
      
      // Check that we don't have errors
      expect(result.errors.length).toBe(0);
    });

    it('should skip Lagerstellenwechsel transactions', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;17.11.2023;17.11.2023;IE000MJIXFE0;AMUNDI MSCI NA ESG CLMT NT ZR AMBTCTBETF;-148,478825;Stk.;Lagerstellenwechsel in IE000MJIXFE0;3491474014;88,063;EUR;***148 Depot
1046585148;17.11.2023;17.11.2023;IE000MJIXFE0;AMUNDI MSCI NA ESG CLMT NT ZR AMBTCTBETF;148,478825;Stk.;Lagerstellenwechsel in IE000MJIXFE0;3491474015;88,063;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);

      // Check that we have the expected investment
      expect(result.investments.length).toBe(1);
      expect(result.investments[0].isin).toBe('IE000MJIXFE0');
      
      // Check that we have no movements (both should be skipped)
      expect(result.movements.length).toBe(0);
      
      // Check that we have warnings about skipped transactions
      expect(result.warnings.length).toBe(2);
      expect(result.warnings[0]).toContain('Transaktion übersprungen');
      expect(result.warnings[1]).toContain('Transaktion übersprungen');
    });

    it('should correctly link investments to movements', () => {
      const csvContent = `Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Einheit;Buchungsinformationen;TA-Nr.;Kurs;Währung;Depot
1046585148;24.05.2023;22.05.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF;2,208;Stk.;WP-Eingang IE00B3VTML14;3292980473;139,452;EUR;***148 Depot
1046585148;30.05.2023;01.06.2023;IE00B3VTML14;ISHARES GOVT BOND 3-7YR ETF;-23,000;Stk.;Ausführung ORDER Verkauf IE00B3VTML14 202825836;3298493673;122,905;EUR;***148 Depot
1046585148;01.11.2023;03.11.2023;LU1737653045;AIS-M.NA ESG B.CTB UETFED;0,289003;Stk.;Ausführung ORDER Kauf LU1737653045 206043492;3474651931;86,504;EUR;***148 Depot`;

      const result: DataImportResult = parseFlatexCsv(csvContent);

      // Check that we have the expected investments
      expect(result.investments.length).toBe(2);
      
      // Check that movements are linked to the correct investments
      expect(result.movements.length).toBe(3);
      
      // First two movements should be linked to the first investment
      expect(result.movements[0].investment).toBe(1);
      expect(result.movements[1].investment).toBe(1);
      
      // Third movement should be linked to the second investment
      expect(result.movements[2].investment).toBe(2);
    });
  });
});
