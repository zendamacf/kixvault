import { describe, expect, test } from 'bun:test';
import { CSV_BOM, createCsvWriter } from './csv';

const writer = createCsvWriter(['a', 'b', 'c'] as const);

describe('createCsvWriter', () => {
  test('writes a BOM and the header row, even with no data rows', () => {
    expect(writer.header()).toBe(`${CSV_BOM}a,b,c\r\n`);
  });

  test('writes plain values', () => {
    expect(writer.row({ a: 'Nike', b: 10.5, c: 'x' })).toBe('Nike,10.5,x\r\n');
  });

  test('writes null and undefined as empty cells, never "null"', () => {
    expect(writer.row({ a: null, b: undefined, c: 'x' })).toBe(',,x\r\n');
  });

  test('keeps zero', () => {
    expect(writer.row({ a: 0, b: '', c: null })).toBe('0,,\r\n');
  });

  test('escapes commas, quotes and line breaks', () => {
    expect(writer.row({ a: 'a,b', b: 'say "hi"', c: 'line1\nline2' })).toBe(
      '"a,b","say ""hi""","line1\nline2"\r\n',
    );
  });

  test.each(['=1+1', '+1', '-1', '@SUM(A1)', '\tcmd', '\rcmd'])(
    'prefixes %j so it cannot run as a formula',
    (value) => {
      const row = writer.row({ a: value, b: null, c: null });

      expect(row.startsWith("'") || row.startsWith(`"'`)).toBe(true);
    },
  );

  test('does not prefix text that merely contains a formula character', () => {
    expect(writer.row({ a: 'a=b', b: 'x-y', c: 'me@home' })).toBe('a=b,x-y,me@home\r\n');
  });

  test('keeps non-ASCII text', () => {
    expect(writer.row({ a: 'Nike Dunk 東京', b: 'é', c: null })).toBe('Nike Dunk 東京,é,\r\n');
  });
});
