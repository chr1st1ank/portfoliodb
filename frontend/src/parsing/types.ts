import { Investment, Movement } from '../types/api';

/**
 * Interface for the result of parsing any import file
 * This is a generic interface that can be used by any parser
 */
export interface DataImportResult {
  investments: Partial<Investment>[];
  movements: Partial<Movement>[];
  errors: string[];
  warnings: string[];
}
