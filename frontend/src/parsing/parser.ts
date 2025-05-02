import { DataImportResult } from './types';

/**
 * Interface for a data parser
 * This is a generic interface that can be implemented by any parser
 */
export interface DataParser {
  /**
   * Parse the content of a file
   * @param content - The content of the file as a string
   * @returns The parsed data as a DataImportResult
   */
  parse(content: string): DataImportResult;

  /**
   * Get the name of the parser
   * @returns The name of the parser
   */
  getName(): string;

  /**
   * Get the description of the parser
   * @returns The description of the parser
   */
  getDescription(): string;

  /**
   * Get the file extensions supported by the parser
   * @returns An array of file extensions (without the dot)
   */
  getSupportedExtensions(): string[];
}

/**
 * Abstract base class for data parsers
 * Provides common functionality for all parsers
 */
export abstract class BaseDataParser implements DataParser {
  protected name: string;
  protected description: string;
  protected supportedExtensions: string[];

  constructor(name: string, description: string, supportedExtensions: string[]) {
    this.name = name;
    this.description = description;
    this.supportedExtensions = supportedExtensions;
  }

  /**
   * Parse the content of a file
   * @param content - The content of the file as a string
   * @returns The parsed data as a DataImportResult
   */
  abstract parse(content: string): DataImportResult;

  /**
   * Get the name of the parser
   * @returns The name of the parser
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the description of the parser
   * @returns The description of the parser
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Get the file extensions supported by the parser
   * @returns An array of file extensions (without the dot)
   */
  getSupportedExtensions(): string[] {
    return this.supportedExtensions;
  }
}

/**
 * Registry for data parsers
 * This class manages all available parsers
 */
export class ParserRegistry {
  private static parsers: DataParser[] = [];

  /**
   * Register a parser
   * @param parser - The parser to register
   */
  static registerParser(parser: DataParser): void {
    this.parsers.push(parser);
  }

  /**
   * Get all registered parsers
   * @returns An array of all registered parsers
   */
  static getParsers(): DataParser[] {
    return this.parsers;
  }

  /**
   * Get a parser by name
   * @param name - The name of the parser
   * @returns The parser or undefined if not found
   */
  static getParserByName(name: string): DataParser | undefined {
    return this.parsers.find(parser => parser.getName() === name);
  }

  /**
   * Get parsers that support a specific file extension
   * @param extension - The file extension (without the dot)
   * @returns An array of parsers that support the extension
   */
  static getParsersByExtension(extension: string): DataParser[] {
    return this.parsers.filter(parser => 
      parser.getSupportedExtensions().includes(extension.toLowerCase()));
  }
}
