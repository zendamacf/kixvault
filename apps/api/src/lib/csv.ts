import { stringify } from 'csv-stringify/sync';

/** Lets Excel detect UTF-8, so non-ASCII text is not garbled. */
export const CSV_BOM = '﻿';

export type CsvCell = string | number | null | undefined;

/**
 * Serializes one CSV record per call so large exports can be written as a stream.
 * Fields are escaped by RFC 4180 (CRLF line endings). Text that starts with `=`, `+`, `-`, `@`,
 * tab or CR is prefixed with `'` so a spreadsheet cannot run it as a formula. Null and undefined
 * become empty cells.
 */
export function createCsvWriter<Column extends string>(columns: readonly Column[]) {
  const options = {
    record_delimiter: '\r\n',
    escape_formulas: true,
    // The library only quotes its own record delimiter, so force quotes around any line break.
    quoted_match: /[\r\n]/,
    cast: { number: (value: number) => String(value) },
  };

  return {
    /** The BOM and the header row. Write this first, even for an empty export. */
    header(): string {
      return CSV_BOM + stringify([columns as Column[]], options);
    },
    row(record: Record<Column, CsvCell>): string {
      return stringify([columns.map((column) => record[column] ?? '')], options);
    },
  };
}
