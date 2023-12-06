import configure from '@jimp/custom';
import png from '@jimp/png';
import { Buffer } from 'buffer/index.js';

const Jimp = configure({ types: [png] });

/**
 * A class to convert between a string and a PNG image.
 */
export class Image {
  private _dataBuffer: Buffer | null = null;
  private _imageBuffer: Buffer | null = null;

  /**
   * Create an Image instance from a string or PNG buffer
   * @param data - used to create the image from
   * @throws when the data is not a string or buffer
   */
  public constructor(data: string | Buffer) {
    if (typeof data === 'string') {
      this._dataBuffer = Buffer.from(data);
    } else if (
      data instanceof Uint8Array &&
      // Check the first 4 bytes of the buffer to see if it's a PNG
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47
    ) {
      this._imageBuffer = data;
    } else {
      throw new Error(
        'Invalid data type or format, must be a string or PNG buffer',
      );
    }
  }

  /**
   * Uses the data buffer to create a PNG buffer
   * @returns the PNG buffer
   * @throws when the cached data buffer is not found
   */
  public async getBuffer() {
    if (this._imageBuffer) return this._imageBuffer;
    if (!this._dataBuffer) throw new Error('Data buffer does not exist');

    // Break the data buffer into chunks of 4, one for each of RGBA
    type Chunk = number[] & { length: 4 };
    const chunks: Chunk[] = [];
    for (let i = 0; i < this._dataBuffer.length; i += 4)
      chunks.push(this._dataBuffer.subarray(i, i + 4) as unknown as Chunk);

    // Create a square image with the width of the square root of the number of chunks
    const width = Math.ceil(Math.sqrt(chunks.length));
    const image = new Jimp(width, width);

    // Loop over each pixel and assign the colour based on the respective chunk
    let progress = 0;
    for (let y = 0; y < width; y++) {
      for (let x = 0; x < width; x++) {
        if (progress < chunks.length) {
          // Each chunk of 4 is a single pixel
          const [r, g, b, a] = chunks[progress] ?? [];
          const colour = Jimp.rgbaToInt(r ?? 0, g ?? 0, b ?? 0, a ?? 0);
          image.setPixelColour(colour, x, y);
          progress++;
        }
      }
    }

    // @ts-ignore - Node.js buffer vs browser buffer
    this._imageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    return this._imageBuffer;
  }

  /**
   * Extracts the data from the image buffer
   * @returns the data
   * @throws when the cached image buffer is not found
   */
  public async getData() {
    if (this._dataBuffer) return new TextDecoder().decode(this._dataBuffer);
    if (!this._imageBuffer) throw new Error('Image buffer does not exist');

    // @ts-ignore - Jimp buffer overload not working
    const image = await Jimp.read(this._imageBuffer);

    const buffer = [];
    for (let y = 0; y < image.bitmap.height; y++) {
      for (let x = 0; x < image.bitmap.width; x++) {
        // Extract the RGBA colour from the pixel
        const colour = Jimp.intToRGBA(image.getPixelColour(x, y));

        // If any value is 0, we've reached the end of the data
        // Checking the red value is enough as if it's 0, the rest will be too
        if (colour.r === 0) break;

        // TODO: Don't push 0 values to the buffer, can replace the trimming below
        buffer.push(colour.r, colour.g ?? 0, colour.b ?? 0, colour.a ?? 0);
      }
    }

    // Find the last non-zero element
    let lastIndex = buffer.length - 1;
    while (lastIndex >= 0 && buffer[lastIndex] === 0) lastIndex--;
    // Slice the array up to the last non-zero element
    buffer.length = lastIndex + 1;

    this._dataBuffer = Buffer.from(buffer);
    return (
      this._dataBuffer
        .toString()
        // Unsure why, but the bee movie script has whitespace at the end
        // Don't think it will really affect anything, but time will tell
        .trimEnd()
    );
  }
}
