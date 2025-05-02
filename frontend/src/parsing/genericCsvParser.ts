import { DataImportResult } from './types';
import { BaseDataParser, ParserRegistry } from './parser';

/**
 * Interface representing a row in a generic CSV file
 * This is a common format that might be used by various brokers
 */
export interface GenericCsvRow {
  date: string;
  isin: string;
  name: string;
  type: string;
  quantity: string;
  price: string;
  amount: string;
  fee: string;
}

/**
 * Generic CSV parser implementation
 * This parser handles a simple CSV format with the following columns:
 * date, isin, name, type, quantity, price, amount, fee
 */
export class GenericCsvParser extends BaseDataParser {
  constructor() {
    super(
      'Generic CSV',
      'Parser für einfache CSV-Dateien mit Spalten: Datum, ISIN, Name, Typ, Anzahl, Preis, Betrag, Gebühr',
      ['csv']
    );
  }

  /**
   * Parses a CSV string in generic format
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
      const isHeader = firstLine.toLowerCase().includes('date') || 
                       firstLine.toLowerCase().includes('datum') || 
                       firstLine.toLowerCase().includes('isin');
      
      // Start processing from the appropriate line (skip header if present)
      const startIndex = isHeader ? 1 : 0;

      // Process each line
      for (let i = startIndex; i < nonEmptyLines.length; i++) {
        const line = nonEmptyLines[i];
        
        // Split the line by comma
        const fields = line.split(',');
        
        // Check if we have enough fields
        if (fields.length < 8) {
          result.errors.push(`Zeile ${i + 1}: Nicht genügend Felder (${fields.length} von 8 erwartet)`);
          continue;
        }

        try {
          // Extract the data from the fields
          const row: GenericCsvRow = {
            date: fields[0].trim(),
            isin: fields[1].trim(),
            name: fields[2].trim(),
            type: fields[3].trim().toLowerCase(),
            quantity: fields[4].trim(),
            price: fields[5].trim(),
            amount: fields[6].trim(),
            fee: fields[7].trim()
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
   * Processes a single row from the generic CSV file
   * @param row - The row data
   * @param result - The result object to update
   * @param lineNumber - The line number for error reporting
   */
  private processRow(row: GenericCsvRow, result: DataImportResult, lineNumber: number): void {
    // Validate required fields
    if (!row.date || !row.isin || !row.name || !row.quantity || !row.amount) {
      result.errors.push(`Zeile ${lineNumber}: Fehlende Pflichtfelder`);
      return;
    }

    // Check if we need to create a new investment
    const existingInvestmentIndex = result.investments.findIndex(inv => inv.isin === row.isin);
    let investmentId = -1;
    
    if (existingInvestmentIndex === -1) {
      // Create a new investment
      const shortname = this.extractShortname(row.name);
      const newInvestment = {
        id: result.investments.length + 1, // Temporary ID
        name: row.name,
        isin: row.isin,
        shortname: shortname
      };
      result.investments.push(newInvestment);
      investmentId = newInvestment.id;
    } else {
      investmentId = result.investments[existingInvestmentIndex].id || -1;
    }

    // Parse the date
    const dateObj = this.parseDate(row.date);
    if (!dateObj) {
      result.errors.push(`Zeile ${lineNumber}: Ungültiges Datumsformat: ${row.date}`);
      return;
    }

    // Parse quantity
    const quantity = parseFloat(row.quantity);
    if (isNaN(quantity)) {
      result.errors.push(`Zeile ${lineNumber}: Ungültiger Wert für Anzahl: ${row.quantity}`);
      return;
    }

    // Parse amount
    const amount = parseFloat(row.amount);
    if (isNaN(amount)) {
      result.errors.push(`Zeile ${lineNumber}: Ungültiger Wert für Betrag: ${row.amount}`);
      return;
    }

    // Parse fee (optional)
    let fee = 0;
    if (row.fee) {
      fee = parseFloat(row.fee);
      if (isNaN(fee)) {
        result.warnings.push(`Zeile ${lineNumber}: Ungültiger Wert für Gebühr: ${row.fee}, wird als 0 angenommen`);
        fee = 0;
      }
    }

    // Determine action type
    const actionType = this.determineActionType(row.type);
    if (actionType === 0) {
      result.warnings.push(`Zeile ${lineNumber}: Konnte Aktionstyp nicht bestimmen: ${row.type}`);
      return; // Skip this row if we can't determine the action type
    }

    // Create the movement
    result.movements.push({
      date: dateObj,
      action: actionType,
      investment: investmentId,
      quantity: Math.abs(quantity),
      amount: Math.abs(amount),
      fee: fee
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
    
    // Try to find ETF, UCITS, or similar keywords
    const etfIndex = words.findIndex(word => 
      word.toUpperCase().includes('ETF') || 
      word.toUpperCase().includes('UCITS')
    );
    
    if (etfIndex > 0) {
      return words[etfIndex-1] + ' ' + words[etfIndex];
    }
    
    // Otherwise return first two words
    return words.slice(0, 2).join(' ');
  }

  /**
   * Parses a date in various formats
   * @param dateStr - The date string
   * @returns A Date object or null if invalid
   */
  private parseDate(dateStr: string): Date | null {
    // Try different date formats
    
    // Format: YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Format: DD.MM.YYYY
    if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const parts = dateStr.split('.');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Format: MM/DD/YYYY
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = dateStr.split('/');
      const month = parseInt(parts[0], 10) - 1; // JavaScript months are 0-based
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Could not parse the date
    return null;
  }

  /**
   * Determines the action type based on the type string
   * @param type - The type string
   * @returns The action type ID (1 for buy, 2 for sell, 3 for dividend, 0 for unknown)
   */
  private determineActionType(type: string): number {
    const lowerType = type.toLowerCase();
    
    // Check for buy
    if (lowerType.includes('buy') || lowerType.includes('kauf') || lowerType.includes('purchase')) {
      return 1; // Buy
    }
    
    // Check for sell
    if (lowerType.includes('sell') || lowerType.includes('verkauf') || lowerType.includes('sale')) {
      return 2; // Sell
    }
    
    // Check for dividend
    if (lowerType.includes('div') || lowerType.includes('dividend') || lowerType.includes('ausschüttung')) {
      return 3; // Dividend
    }
    
    // Unknown action type
    return 0;
  }
}

// Create and register the Generic CSV parser
const genericCsvParser = new GenericCsvParser();
ParserRegistry.registerParser(genericCsvParser);

/**
 * Convenience function to parse Generic CSV content
 * @param content - The CSV content as a string
 * @returns The parsed data
 */
export function parseGenericCsv(content: string): DataImportResult {
  return genericCsvParser.parse(content);
}
