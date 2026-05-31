/**
 * tgsnake - Telegram MTProto library for javascript or typescript.
 * Copyright (C) 2026 tgsnake <https://github.com/tgsnake>
 *
 * THIS FILE IS PART OF TGSNAKE
 *
 * tgsnake is a free software : you can redistribute it and/or modify
 * it under the terms of the MIT License as published.
 */
import { Buffer } from './deps.js';

/**
 * A versatile in-memory binary stream class utilizing Node.js `Buffer`s.
 * Mimics the behavior of Python's built-in `io.BytesIO` module, providing a stream-like
 * interface for reading and writing binary data in memory.
 *
 * Supports sequential and random-access operations using a seekable internal pointer, and provides
 * convenient helper methods to read and write integers, floats, doubles, and raw buffers.
 *
 * @remarks
 * This class is highly optimized for performance and is particularly useful in environments
 * requiring low-level binary manipulation, such as network protocols, file parsers, and custom serializers.
 *
 * @example
 * **Writing and Reading Data:**
 * ```typescript
 * import { BytesIO } from '@tgsnake/bytesio';
 *
 * // Create a BytesIO instance from existing data
 * const stream = BytesIO.from([0x01, 0x02, 0x03, 0x04]);
 *
 * // Read a 32-bit signed integer in little-endian format
 * const intVal = stream.readInt32LE(); // Reads 4 bytes and advances pointer
 * console.log(intVal); // Output: 67305985
 * ```
 *
 * @example
 * **Seeking the Stream Pointer:**
 * ```typescript
 * const stream = BytesIO.from('Hello, World!', 'utf-8');
 *
 * // Seek to position 7 (from the beginning of the buffer)
 * stream.seek(7, 0);
 *
 * // Read remaining bytes
 * const msg = stream.read().toString('utf-8');
 * console.log(msg); // Output: 'World!'
 * ```
 */
export class BytesIO {
  /**
   * The raw internal Node.js Buffer instance where binary data is stored.
   * @private
   */
  private _buffer!: Buffer;

  /**
   * The current internal read/write pointer position (byte offset).
   * @private
   */
  private _post!: number;

  /**
   * Initializes a new instance of the `BytesIO` class.
   *
   * @param buffer - The initial binary buffer to populate the `BytesIO` instance with. Defaults to an empty buffer.
   */
  constructor(buffer: Buffer = Buffer.alloc(0)) {
    this._post = 0;
    this._buffer = buffer;
    return this;
  }

  /**
   * Adjusts the position of the internal read/write pointer (offset cursor).
   *
   * @param offset - The byte offset relative to the reference point defined by `whence`.
   *                 - If `whence` is `0`, must be 0 or positive.
   *                 - If `whence` is `2`, must be less than 0.
   * @param whence - The reference point for the seek operation:
   *                 - `0` (default): Absolute positioning from the start of the buffer.
   *                 - `1`: Relative positioning from the current pointer position.
   *                 - `2`: Relative positioning from the end of the buffer (expects a negative `offset`).
   * @returns The new pointer position (relative to the start of the buffer).
   * @throws {Error} If `whence` is `0` and `offset` is negative.
   * @throws {Error} If `whence` is `2` and `offset` is non-negative.
   * @throws {Error} If `whence` is `2` and the absolute seek location would be less than 0.
   * @throws {Error} If `whence` is not `0`, `1`, or `2`.
   */
  seek(offset: number, whence: number = 0): number {
    if (whence === 0) {
      if (offset < 0) {
        throw new Error(`offset of BytesIO.seek must be zero or positive value when whence is 0`);
      }
      this._post = whence;
    } else if (whence === 1) {
      this._post += offset;
    } else if (whence === 2) {
      if (offset >= 0) {
        throw new Error(
          `offset of BytesIO.seek must be less than zero or negative value when whence is 2`,
        );
      }
      if (Buffer.byteLength(this._buffer) + offset < 0) {
        throw new Error(
          `offset out of range, offset ${offset} is less than the available buffer length.`,
        );
      }
      this._post = Buffer.byteLength(this._buffer) + offset;
    } else {
      throw new Error(`whence must be 0 or 1 or 2, but receive ${whence}`);
    }
    return this._post;
  }

  /**
   * Returns a new `BytesIO` instance populated with a subarray/slice of the current buffer.
   * The slice is created using the standard `Buffer.subarray` method, meaning it shares the same
   * allocated memory as the original buffer.
   *
   * @param args - Arguments passed directly to the underlying `Buffer.subarray` method.
   *               Typically `[start[, end]]`, where `start` is the starting index (default 0) and
   *               `end` is the ending index (exclusive, default buffer length).
   * @returns A new `BytesIO` instance containing the sliced view of the buffer.
   */
  slice(...args: Array<any>): BytesIO {
    return new BytesIO(this._buffer.subarray(...args));
  }

  /**
   * Returns a JSON representation of the underlying buffer.
   * This is useful for serializing the binary data, representing it as an object
   * containing a `type` property (typically `"Buffer"`) and a `data` array of byte values.
   *
   * @returns An object representing the buffer in JSON format.
   */
  toJSON(): { type: 'Buffer'; data: number[] } {
    return this._buffer.toJSON();
  }

  /**
   * Decodes the underlying buffer to a string according to the specified encoding.
   *
   * @param args - Arguments passed directly to the underlying `Buffer.toString` method.
   *               Typically `[encoding[, start[, end]]]`, where:
   *               - `encoding` is the character encoding to use (e.g., `'utf8'`, `'hex'`, `'base64'`).
   *               - `start` is the byte offset to start decoding (default 0).
   *               - `end` is the byte offset to stop decoding (exclusive, default buffer length).
   * @returns The decoded string representation of the buffer.
   */
  toString(...args: Array<any>): string {
    return this._buffer.toString(...args);
  }

  /**
   * Reads binary data from the current pointer position.
   * Advances the internal pointer by the number of bytes successfully read.
   *
   * @param length - The number of bytes to read.
   *                 - If `undefined` or not provided, reads all remaining bytes from the current pointer to the end of the buffer.
   *                 - If provided, reads at most `length` bytes from the current pointer position.
   * @returns A new `Buffer` containing the read bytes. If the pointer is out of bounds or `length` is less than 1, returns an empty buffer.
   */
  read(length?: number): Buffer {
    if (length === undefined) {
      const results = this._buffer.subarray(this._post);
      this.seek(Buffer.byteLength(results), 1);
      return results;
    }
    if (length >= 1 && this._post <= Buffer.byteLength(this._buffer)) {
      const results = this._buffer.subarray(this._post, this._post + length);
      this.seek(length, 1);
      return results;
    }
    return Buffer.alloc(0);
  }

  /**
   * Reads a signed 32-bit integer in little-endian format (`Int32LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read signed 32-bit integer (value ranges from -2,147,483,648 to 2,147,483,647).
   */
  readInt32LE(size: number = 4): number {
    const results = this._buffer.readInt32LE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads a signed 32-bit integer in big-endian format (`Int32BE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read signed 32-bit integer (value ranges from -2,147,483,648 to 2,147,483,647).
   */
  readInt32BE(size: number = 4): number {
    const results = this._buffer.readInt32BE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads an unsigned 32-bit integer in little-endian format (`UInt32LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read unsigned 32-bit integer (value ranges from 0 to 4,294,967,295).
   */
  readUInt32LE(size: number = 4): number {
    const results = this._buffer.readUInt32LE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads an unsigned 32-bit integer in big-endian format (`UInt32BE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read unsigned 32-bit integer.
   */
  readUInt32BE(size: number = 4): number {
    const results = this._buffer.readInt32BE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads a signed 64-bit BigInt in little-endian format (`BigInt64LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read signed 64-bit BigInt (value ranges from -9,223,372,036,854,775,808n to 9,223,372,036,854,775,807n).
   */
  readBigInt64LE(size: number = 8): bigint {
    const results = this._buffer.readBigInt64LE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads a signed 64-bit BigInt in big-endian format (`BigInt64BE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read signed 64-bit BigInt (value ranges from -9,223,372,036,854,775,808n to 9,223,372,036,854,775,807n).
   */
  readBigInt64BE(size: number = 8): bigint {
    const results = this._buffer.readBigInt64BE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads an unsigned 64-bit BigInt in little-endian format (`BigUInt64LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read unsigned 64-bit BigInt (value ranges from 0n to 18,446,744,073,709,551,615n).
   */
  readBigUInt64LE(size: number = 8): bigint {
    const results = this._buffer.readBigUInt64LE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads an unsigned 64-bit BigInt in big-endian format (`BigUInt64BE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read unsigned 64-bit BigInt (value ranges from 0n to 18,446,744,073,709,551,615n).
   */
  readBigUInt64BE(size: number = 8): bigint {
    const results = this._buffer.readBigUInt64BE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads a 64-bit double-precision floating-point number in little-endian format (`DoubleLE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read double-precision floating-point number.
   */
  readDoubleLE(size: number = 8): number {
    const results = this._buffer.readDoubleLE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads a 64-bit double-precision floating-point number in big-endian format (`DoubleBE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read double-precision floating-point number.
   */
  readDoubleBE(size: number = 8): number {
    const results = this._buffer.readDoubleBE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads a 32-bit single-precision floating-point number in little-endian format (`FloatLE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read single-precision floating-point number.
   */
  readFloatLE(size: number = 4): number {
    const results = this._buffer.readFloatLE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Reads a 32-bit single-precision floating-point number in big-endian format (`FloatBE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read single-precision floating-point number.
   */
  readFloatBE(size: number = 4): number {
    const results = this._buffer.readFloatBE(this._post);
    this.seek(size, 1);
    return results;
  }

  /**
   * Appends the provided binary data to the absolute end of the underlying buffer.
   *
   * @remarks
   * This operation concatenates the new data to the existing buffer, increasing its total length.
   * Note that this method does not modify or advance the current pointer position (`post`).
   *
   * @param data - The `Buffer` containing the binary data to append.
   * @returns The current `BytesIO` instance, enabling method chaining.
   */
  write(data: Buffer): BytesIO {
    this._buffer = Buffer.concat([
      this._buffer as unknown as Uint8Array,
      data as unknown as Uint8Array,
    ]);
    return this;
  }

  /**
   * Allocates a new `BytesIO` instance populated with a zero-filled buffer of the specified size.
   *
   * @param size - The number of bytes to allocate for the initial buffer.
   * @returns A new `BytesIO` instance with the allocated buffer.
   */
  static alloc(size: number): BytesIO {
    return new BytesIO(Buffer.alloc(size));
  }

  /**
   * Creates a new `BytesIO` instance from the given input data, delegating to `Buffer.from`.
   *
   * @param input - The input data. Can be a `Buffer`, `Uint8Array`, `ArrayBuffer`, `SharedArrayBuffer`,
   *                an `Array` of numbers, a `string`, or an object with a `valueOf` or `Symbol.toPrimitive` method.
   * @param encode - The character encoding to use if the `input` is a string (e.g., `'utf8'`, `'hex'`, `'base64'`).
   * @returns A new `BytesIO` instance initialized with the parsed input data.
   */
  static from(input: any, encode?: any): BytesIO {
    return new BytesIO(Buffer.from(input, encode));
  }

  /**
   * Concatenates an array of `Buffer` instances into a single `BytesIO` instance.
   *
   * @param data - An array of `Buffer` objects to be joined together in order.
   * @returns A new `BytesIO` instance containing the concatenated binary data.
   */
  static concat(data: Array<Buffer>): BytesIO {
    return new BytesIO(Buffer.concat(data as unknown as Array<Uint8Array>));
  }

  /**
   * Gets the total size of the underlying buffer in bytes.
   *
   * @returns The byte length of the buffer.
   */
  get length(): number {
    return Buffer.byteLength(this._buffer);
  }

  /**
   * Gets the raw, underlying `Buffer` instance managed by this `BytesIO` object.
   *
   * @returns The underlying `Buffer` instance.
   */
  get buffer(): Buffer {
    return this._buffer;
  }

  /**
   * Gets the current read/write pointer (offset index) within the buffer.
   *
   * @returns The current pointer position.
   */
  get post(): number {
    return this._post;
  }
}
