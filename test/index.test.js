import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { Image } from '../dist';

describe('Image', () => {
  describe('constructor', () => {
    it('should create an instance with a string', () => {
      const image = new Image('Hello, world!');
      expect(image instanceof Image).toBe(true);
    });

    it('should create an instance with a PNG buffer', async () => {
      const data = await readFile(new URL('data.png', import.meta.url));
      const image = new Image(data);
      expect(image instanceof Image).toBe(true);
    });

    it('should throw an error if the data is not a string or PNG buffer', () => {
      const message =
        'Invalid data type or format, must be a string or PNG buffer';

      expect(() => new Image(123)).toThrow(message);
      expect(() => new Image({})).toThrow(message);
      expect(() => new Image([])).toThrow(message);
      expect(() => new Image(null)).toThrow(message);
      expect(() => new Image(undefined)).toThrow(message);
      expect(() => new Image(Buffer.from('Hello, world!'))).toThrow(message);
    });
  });

  describe('getData', () => {
    it('should return the data', async () => {
      const data = 'Hello, world!';
      const image = new Image(data);
      const result = await image.getData();
      expect(result).toEqual(data);
    });
  });

  describe('getBuffer', () => {
    it('should return the buffer', async () => {
      const data = await readFile(new URL('data.png', import.meta.url));
      const image = new Image(data);
      const result = await image.getBuffer();
      expect(result).toEqual(data);
    });
  });

  it('should convert from string to image and back to string correctly', async () => {
    const data = await readFile(new URL('data.txt', import.meta.url), 'utf8');
    const buffer = await readFile(new URL('data.png', import.meta.url));
    const image = new Image(buffer);

    const result = await image.getData();
    expect(result).toEqual(data);
  });
});
