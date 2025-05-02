import { DataImportResult } from './types';
import { BaseDataParser, ParserRegistry } from './parser';

/**
 * Interface representing a row in the Flatex CSV file
 */
export interface FlatexCsvRow {
  nummer: string;
  buchtag: string;
  valuta: string;
  isin: string;
  bezeichnung: string;
  nominal: string;
  einheit: string;
  buchungsinformationen: string;
  taNr: string;
  kurs: string;
  waehrung: string;
  depot: string;
}

/**
 * Flatex CSV parser implementation
 */
export class FlatexParser extends BaseDataParser {
  constructor() {
    super(
      'Flatex CSV',
      'Parser für Flatex CSV-Dateien (Depotumsätze)',
      ['csv']
    );
  }

  /**
   * Parses a CSV string in Flatex format
   * @param content - The CSV content as a string
   * @returns The parsed data, including investments, movements, errors, and warnings
   */
  parse(content: string): DataImportResult {
    const result: DataImportResult = {
      investments: [],
      movements: [],
      errors: [],
      warnings: []
    };

    try {
      // Split the content into lines and parse each line
      const lines = content.split('\n');
      
      // Skip empty lines
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      
      if (nonEmptyLines.length === 0) {
        result.errors.push('Die Datei enthält keine Daten');
        return result;
      }

      // Check if the first line is a header
      const firstLine = nonEmptyLines[0];
      const isHeader = firstLine.toLowerCase().includes('nummer') || 
                       firstLine.toLowerCase().includes('buchtag') || 
                       firstLine.toLowerCase().includes('isin');
      
      // Start processing from the appropriate line (skip header if present)
      const startIndex = isHeader ? 1 : 0;

      // Process each line
      for (let i = startIndex; i < nonEmptyLines.length; i++) {
        const line = nonEmptyLines[i];
        
        // Split the line by semicolon
        const fields = line.split(';');
        
        // Check if we have enough fields
        if (fields.length < 12) {
          result.errors.push(`Zeile ${i + 1}: Nicht genügend Felder (${fields.length} von 12 erwartet)`);
          continue;
        }

        try {
          // Extract the data from the fields
          const row: FlatexCsvRow = {
            nummer: fields[0].trim(),
            buchtag: fields[1].trim(),
            valuta: fields[2].trim(),
            isin: fields[3].trim(),
            bezeichnung: fields[4].trim(),
            nominal: fields[5].trim(),
            einheit: fields[6].trim(),
            buchungsinformationen: fields[7].trim(),
            taNr: fields[8].trim(),
            kurs: fields[9].trim(),
            waehrung: fields[10].trim(),
            depot: fields[11].trim()
          };

          // Process the row
          this.processRow(row, result, i + 1);
        } catch (err) {
          result.errors.push(`Zeile ${i + 1}: Fehler bei der Verarbeitung: ${err}`);
        }
      }

      // Check if we found any investments or movements
      if (result.investments.length === 0 && result.movements.length === 0 && result.errors.length === 0) {
        result.warnings.push('Keine Investments oder Bewegungen gefunden');
      }

      return result;
    } catch (err) {
      result.errors.push(`Fehler beim Parsen der CSV-Datei: ${err}`);
      return result;
    }
  }

  /**
   * Processes a single row from the Flatex CSV file
   * @param row - The row data
   * @param result - The result object to update
   * @param lineNumber - The line number for error reporting
   */
  private processRow(row: FlatexCsvRow, result: DataImportResult, lineNumber: number): void {
    // Validate required fields
    if (!row.buchtag || !row.isin || !row.bezeichnung || !row.nominal) {
      result.errors.push(`Zeile ${lineNumber}: Fehlende Pflichtfelder`);
      return;
    }

    // Check if we need to create a new investment
    const existingInvestmentIndex = result.investments.findIndex(inv => inv.isin === row.isin);
    if (existingInvestmentIndex === -1) {
      // Create a new investment
      const shortname = this.extractShortname(row.bezeichnung);
      result.investments.push({
        name: row.bezeichnung,
        isin: row.isin,
        shortname: shortname
      });
    }

    // Parse the date
    const dateObj = this.parseGermanDate(row.buchtag);
    if (!dateObj) {
      result.errors.push(`Zeile ${lineNumber}: Ungültiges Datumsformat: ${row.buchtag}`);
      return;
    }

    // Parse nominal (quantity)
    const quantity = this.parseGermanNumber(row.nominal);
    if (isNaN(quantity)) {
      result.errors.push(`Zeile ${lineNumber}: Ungültiger Wert für Nominal: ${row.nominal}`);
      return;
    }

    // Parse kurs (price)
    const price = this.parseGermanNumber(row.kurs);
    if (isNaN(price)) {
      result.errors.push(`Zeile ${lineNumber}: Ungültiger Wert für Kurs: ${row.kurs}`);
      return;
    }

    // Determine action type based on buchungsinformationen and nominal
    const actionType = this.determineActionType(row.buchungsinformationen, quantity);
    if (actionType === 0) {
      result.warnings.push(`Zeile ${lineNumber}: Konnte Aktionstyp nicht bestimmen: ${row.buchungsinformationen}`);
      return; // Skip this row if we can't determine the action type
    }

    // Calculate amount (price * quantity)
    const amount = Math.abs(price * Math.abs(quantity));

    // Create the movement
    result.movements.push({
      date: dateObj,
      action: actionType,
      investment: -1, // Will be updated after investments are created
      quantity: Math.abs(quantity), // Always store positive quantity
      amount: amount,
      fee: 0 // Flatex CSV doesn't include fee information directly
    });
  }

  /**
   * Extracts a short name from the full investment name
   * @param fullName - The full name of the investment
   * @returns A shortened version of the name
   */
  private extractShortname(fullName: string): string {
    // Try to extract a meaningful shortname
    const words = fullName.split(' ');
    
    // If it's a short name already, return it
    if (words.length <= 2) return fullName;
    
    // For ISHARES ETFs, use first word + second word
    if (fullName.toUpperCase().includes('ISHARES')) {
      return 'ISHARES ' + words[1];
    }
    
    // Try to find ETF, UCITS, or similar keywords
    const etfIndex = words.findIndex(word => 
      word.toUpperCase().includes('ETF') || 
      word.toUpperCase().includes('UCITS')
    );
    
    if (etfIndex > 0 && etfIndex < words.length - 1) {
      // For JAPAN UCITS pattern
      if (words[etfIndex-1].toUpperCase() === 'MSCI') {
        return words[etfIndex-2] + ' ' + words[etfIndex];
      }
      // Return the word before ETF/UCITS plus the ETF/UCITS word
      return words[etfIndex-1] + ' ' + words[etfIndex];
    }
    
    // Otherwise return first two words
    return words.slice(0, 2).join(' ');
  }

  /**
   * Parses a date in German format (DD.MM.YYYY)
   * @param dateStr - The date string in German format
   * @returns A Date object or null if invalid
   */
  private parseGermanDate(dateStr: string): Date | null {
    // Format: DD.MM.YYYY
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    const date = new Date(year, month, day);
    
    // Validate the date is valid
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }
    
    return date;
  }

  /**
   * Parses a number in German format (using comma as decimal separator)
   * @param numStr - The number string in German format
   * @returns The parsed number or NaN if invalid
   */
  private parseGermanNumber(numStr: string): number {
    // Replace comma with dot for decimal separator
    const normalizedStr = numStr.replace(',', '.');
    return parseFloat(normalizedStr);
  }

  /**
   * Determines the action type based on the booking information and nominal value
   * @param buchungsinformationen - The booking information text
   * @param quantity - The quantity (positive for buy, negative for sell)
   * @returns The action type ID (1 for buy, 2 for sell, 3 for dividend, 0 for unknown)
   */
  private determineActionType(buchungsinformationen: string, quantity: number): number {
    const info = buchungsinformationen.toLowerCase();
    
    // Check for sell
    if (info.includes('verkauf') || (info.includes('ausführung') && quantity < 0)) {
      return 2; // Sell
    }
    
    // Check for buy
    if (info.includes('kauf') || info.includes('eingang') || (info.includes('ausführung') && quantity > 0)) {
      return 1; // Buy
    }
    
    // Check for dividend
    if (info.includes('dividende') || info.includes('ausschüttung') || info.includes('ertrag')) {
      return 3; // Dividend
    }
    
    // Unknown action type
    return 0;
  }
}

// Create and register the Flatex parser
const flatexParser = new FlatexParser();
ParserRegistry.registerParser(flatexParser);

/**
 * Convenience function to parse Flatex CSV content
 * @param content - The CSV content as a string
 * @returns The parsed data
 */
export function parseFlatexCsv(content: string): DataImportResult {
  return flatexParser.parse(content);
}
