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
 * Standard seek origin flags matching POSIX and Python's `io` module.
 */
export enum SeekOrigin {
  SEEK_SET = 0,
  SEEK_CUR = 1,
  SEEK_END = 2,
}

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
 * stream.seek(7, BytesIO.SEEK_SET);
 *
 * // Read remaining bytes
 * const msg = stream.read().toString('utf-8');
 * console.log(msg); // Output: 'World!'
 * ```
 */
export class BytesIO {
  /**
   * Seek relative to the beginning of the stream. Offset must be >= 0.
   */
  static readonly SEEK_SET: number = 0;

  /**
   * Seek relative to the current stream position.
   */
  static readonly SEEK_CUR: number = 1;

  /**
   * Seek relative to the end of the stream.
   */
  static readonly SEEK_END: number = 2;

  /**
   * The raw internal Node.js Buffer instance where binary data is stored.
   * @private
   */
  private _buffer!: Buffer;

  /**
   * The current internal read/write pointer position (byte offset).
   * @private
   */
  private _pos!: number;

  /**
   * Indicates whether the stream has been closed.
   * @private
   */
  private _closed: boolean = false;

  /**
   * Initializes a new instance of the `BytesIO` class.
   *
   * @param buffer - The initial binary buffer to populate the `BytesIO` instance with. Defaults to an empty buffer.
   */
  constructor(buffer: Buffer | Uint8Array = Buffer.alloc(0)) {
    this._pos = 0;
    this._buffer = Buffer.isBuffer(buffer)
      ? buffer
      : Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this._closed = false;
    return this;
  }

  /**
   * Internal helper to verify that the stream has not been closed.
   * @private
   */
  private _checkClosed(msg?: string): void {
    if (this._closed) {
      throw new Error(msg ?? 'I/O operation on closed BytesIO instance.');
    }
  }

  /**
   * Adjusts the position of the internal read/write pointer (offset cursor).
   *
   * @param offset - The byte offset relative to the reference point defined by `whence`.
   *                 - If `whence` is `0`, must be 0 or a positive number.
   *                 - If `whence` is `1`, relative to the current position.
   *                 - If `whence` is `2`, relative to the end of the buffer (supports 0 for EOF, negative offsets, and clamps underflow to 0).
   * @param whence - The reference point for the seek operation:
   *                 - `0` (`SEEK_SET`, default): Absolute positioning from the start of the buffer.
   *                 - `1` (`SEEK_CUR`): Relative positioning from the current pointer position.
   *                 - `2` (`SEEK_END`): Relative positioning from the end of the buffer.
   * @returns The new pointer position (relative to the start of the buffer).
   * @throws {Error} If `whence` is `0` and `offset` is negative.
   * @throws {Error} If `whence` is not `0`, `1`, or `2`.
   */
  seek(offset: number, whence: number = BytesIO.SEEK_SET): number {
    this._checkClosed();
    if (whence === BytesIO.SEEK_SET) {
      if (offset < 0) {
        throw new Error(`offset of BytesIO.seek must be zero or positive value when whence is 0`);
      }
      this._pos = offset;
    } else if (whence === BytesIO.SEEK_CUR) {
      this._pos = Math.max(0, this._pos + offset);
    } else if (whence === BytesIO.SEEK_END) {
      this._pos = Math.max(0, this._buffer.length + offset);
    } else {
      throw new Error(`whence must be 0 or 1 or 2, but received ${whence}`);
    }
    return this._pos;
  }

  /**
   * Returns the current stream position (cursor offset).
   * Parity with Python's `BytesIO.tell()`.
   *
   * @returns Current byte offset.
   */
  tell(): number {
    this._checkClosed();
    return this._pos;
  }

  /**
   * Flushes the stream buffers (no-op for in-memory streams, provided for stream parity).
   */
  flush(): void {
    this._checkClosed();
  }

  /**
   * Returns whether this stream is readable.
   */
  readable(): boolean {
    return !this._closed;
  }

  /**
   * Returns whether this stream is writable.
   */
  writable(): boolean {
    return !this._closed;
  }

  /**
   * Returns whether this stream supports random access / seeking.
   */
  seekable(): boolean {
    return !this._closed;
  }

  /**
   * Flushes and closes the stream. Once closed, any further read, write, or seek operations will throw an error.
   */
  close(): void {
    if (!this._closed) {
      this._closed = true;
      this._buffer = Buffer.alloc(0);
      this._pos = 0;
    }
  }

  /**
   * Returns a copy of the entire buffer contents.
   * Parity with Python's `BytesIO.getvalue()`.
   *
   * @returns An independent `Buffer` copy containing the full stream contents.
   */
  getvalue(): Buffer {
    this._checkClosed();
    return Buffer.from(this._buffer);
  }

  /**
   * Returns a direct view of the underlying buffer without copying memory.
   * Parity with Python's `BytesIO.getbuffer()`.
   *
   * @returns The underlying `Buffer` instance.
   */
  getbuffer(): Buffer {
    this._checkClosed();
    return this._buffer;
  }

  /**
   * Truncates the stream to the specified size (in bytes).
   * If `size` is omitted, it defaults to the current pointer position.
   * If the new size is larger than the current buffer, it is padded with null bytes (`0x00`).
   * The current stream position is not changed.
   *
   * @param size - The target size in bytes. Defaults to current cursor position.
   * @returns The new size.
   */
  truncate(size?: number): number {
    this._checkClosed();
    const targetSize = size ?? this._pos;

    if (targetSize < 0) {
      throw new Error(`negative truncate position: ${targetSize}`);
    }

    if (targetSize < this._buffer.length) {
      this._buffer = Buffer.from(this._buffer.subarray(0, targetSize));
    } else if (targetSize > this._buffer.length) {
      const newBuf = Buffer.alloc(targetSize);
      this._buffer.copy(newBuf, 0, 0, this._buffer.length);
      this._buffer = newBuf;
    }

    return targetSize;
  }

  /**
   * Returns bytes from the current stream position without advancing the pointer.
   *
   * @param size - Number of bytes to peek. If omitted or <= 0, peeks all remaining bytes.
   * @returns A `Buffer` containing the peeked bytes.
   */
  peek(size: number = 0): Buffer {
    this._checkClosed();
    if (this._pos >= this._buffer.length) {
      return Buffer.alloc(0);
    }
    const readSize = size <= 0 ? this._buffer.length - this._pos : size;
    const end = Math.min(this._buffer.length, this._pos + readSize);
    return Buffer.from(this._buffer.subarray(this._pos, end));
  }

  /**
   * Returns a new `BytesIO` instance populated with a subarray/slice of the current buffer.
   * The slice is created using `Buffer.subarray`, meaning it shares the same
   * allocated memory as the original buffer.
   *
   * @param args - Arguments passed directly to the underlying `Buffer.subarray` method.
   * @returns A new `BytesIO` instance containing the sliced view of the buffer.
   */
  slice(...args: Array<any>): BytesIO {
    this._checkClosed();
    return new BytesIO(this._buffer.subarray(...args));
  }

  /**
   * Returns a JSON representation of the underlying buffer.
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
   *                 - If `undefined` or negative (e.g. `-1`), reads all remaining bytes to the end of the buffer.
   *                 - If provided, reads at most `length` bytes from the current pointer position.
   * @returns A new `Buffer` containing the read bytes. If the pointer is at or past EOF, returns an empty buffer.
   */
  read(length?: number): Buffer {
    this._checkClosed();

    if (length === undefined || length < 0) {
      if (this._pos >= this._buffer.length) {
        return Buffer.alloc(0);
      }
      const results = this._buffer.subarray(this._pos);
      this._pos = this._buffer.length;
      return Buffer.from(results);
    }

    if (length === 0 || this._pos >= this._buffer.length) {
      return Buffer.alloc(0);
    }

    const newPos = Math.min(this._buffer.length, this._pos + length);
    const results = this._buffer.subarray(this._pos, newPos);
    this._pos = newPos;
    return Buffer.from(results);
  }

  /**
   * Writes binary data at the current stream pointer position.
   *
   * @remarks
   * If the current pointer is before the end of the buffer, existing bytes are overwritten in-place.
   * If the current pointer is beyond the end of the buffer, the buffer is padded with null bytes (`0x00`) up to the pointer.
   * Advances the pointer by the number of bytes written.
   *
   * @param data - The `Buffer`, `Uint8Array`, or `string` containing the data to write.
   * @param encoding - The character encoding if `data` is a string. Defaults to `'utf-8'`.
   * @returns The current `BytesIO` instance, enabling method chaining.
   */
  write(data: Buffer | Uint8Array | string, encoding: BufferEncoding = 'utf-8'): this {
    this._checkClosed();

    const toWrite: Buffer =
      typeof data === 'string'
        ? Buffer.from(data, encoding)
        : Buffer.isBuffer(data)
          ? data
          : Buffer.from(data.buffer, data.byteOffset, data.byteLength);

    if (toWrite.length === 0) {
      return this;
    }

    const pos = this._pos;
    const endPos = pos + toWrite.length;

    if (endPos <= this._buffer.length) {
      toWrite.copy(this._buffer, pos);
    } else {
      const newLength = Math.max(endPos, this._buffer.length);
      const newBuf = Buffer.alloc(newLength);
      this._buffer.copy(newBuf, 0, 0, Math.min(this._buffer.length, pos));
      toWrite.copy(newBuf, pos);
      this._buffer = newBuf;
    }

    this._pos = endPos;
    return this;
  }

  // --- Typed Integer, Float, and Double Readers ---

  /**
   * Reads a signed 8-bit integer from the current pointer position.
   */
  readInt8(size: number = 1): number {
    this._checkClosed();
    const results = this._buffer.readInt8(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads an unsigned 8-bit integer from the current pointer position.
   */
  readUInt8(size: number = 1): number {
    this._checkClosed();
    const results = this._buffer.readUInt8(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a signed 16-bit integer in little-endian format (`Int16LE`).
   */
  readInt16LE(size: number = 2): number {
    this._checkClosed();
    const results = this._buffer.readInt16LE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a signed 16-bit integer in big-endian format (`Int16BE`).
   */
  readInt16BE(size: number = 2): number {
    this._checkClosed();
    const results = this._buffer.readInt16BE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads an unsigned 16-bit integer in little-endian format (`UInt16LE`).
   */
  readUInt16LE(size: number = 2): number {
    this._checkClosed();
    const results = this._buffer.readUInt16LE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads an unsigned 16-bit integer in big-endian format (`UInt16BE`).
   */
  readUInt16BE(size: number = 2): number {
    this._checkClosed();
    const results = this._buffer.readUInt16BE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a signed 32-bit integer in little-endian format (`Int32LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read signed 32-bit integer.
   */
  readInt32LE(size: number = 4): number {
    this._checkClosed();
    const results = this._buffer.readInt32LE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a signed 32-bit integer in big-endian format (`Int32BE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read signed 32-bit integer.
   */
  readInt32BE(size: number = 4): number {
    this._checkClosed();
    const results = this._buffer.readInt32BE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads an unsigned 32-bit integer in little-endian format (`UInt32LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read unsigned 32-bit integer.
   */
  readUInt32LE(size: number = 4): number {
    this._checkClosed();
    const results = this._buffer.readUInt32LE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
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
    this._checkClosed();
    const results = this._buffer.readUInt32BE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a signed 64-bit BigInt in little-endian format (`BigInt64LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read signed 64-bit BigInt.
   */
  readBigInt64LE(size: number = 8): bigint {
    this._checkClosed();
    const results = this._buffer.readBigInt64LE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a signed 64-bit BigInt in big-endian format (`BigInt64BE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read signed 64-bit BigInt.
   */
  readBigInt64BE(size: number = 8): bigint {
    this._checkClosed();
    const results = this._buffer.readBigInt64BE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads an unsigned 64-bit BigInt in little-endian format (`BigUInt64LE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read unsigned 64-bit BigInt.
   */
  readBigUInt64LE(size: number = 8): bigint {
    this._checkClosed();
    const results = this._buffer.readBigUInt64LE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads an unsigned 64-bit BigInt in big-endian format (`BigUInt64BE`) from the current pointer position.
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read unsigned 64-bit BigInt.
   */
  readBigUInt64BE(size: number = 8): bigint {
    this._checkClosed();
    const results = this._buffer.readBigUInt64BE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a 64-bit double-precision floating-point number in little-endian format (`DoubleLE`).
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read double-precision floating-point number.
   */
  readDoubleLE(size: number = 8): number {
    this._checkClosed();
    const results = this._buffer.readDoubleLE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a 64-bit double-precision floating-point number in big-endian format (`DoubleBE`).
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `8`.
   * @returns The read double-precision floating-point number.
   */
  readDoubleBE(size: number = 8): number {
    this._checkClosed();
    const results = this._buffer.readDoubleBE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a 32-bit single-precision floating-point number in little-endian format (`FloatLE`).
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read single-precision floating-point number.
   */
  readFloatLE(size: number = 4): number {
    this._checkClosed();
    const results = this._buffer.readFloatLE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  /**
   * Reads a 32-bit single-precision floating-point number in big-endian format (`FloatBE`).
   * Automatically advances the pointer by the specified `size` of bytes.
   *
   * @param size - The number of bytes to advance the pointer after reading. Defaults to `4`.
   * @returns The read single-precision floating-point number.
   */
  readFloatBE(size: number = 4): number {
    this._checkClosed();
    const results = this._buffer.readFloatBE(this._pos);
    this.seek(size, BytesIO.SEEK_CUR);
    return results;
  }

  // --- Typed Integer, Float, and Double Writers ---

  /**
   * Writes a signed 8-bit integer at the current stream pointer position.
   */
  writeInt8(value: number): this {
    const buf = Buffer.allocUnsafe(1);
    buf.writeInt8(value, 0);
    return this.write(buf);
  }

  /**
   * Writes an unsigned 8-bit integer at the current stream pointer position.
   */
  writeUInt8(value: number): this {
    const buf = Buffer.allocUnsafe(1);
    buf.writeUInt8(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a signed 16-bit integer in little-endian format at the current stream pointer position.
   */
  writeInt16LE(value: number): this {
    const buf = Buffer.allocUnsafe(2);
    buf.writeInt16LE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a signed 16-bit integer in big-endian format at the current stream pointer position.
   */
  writeInt16BE(value: number): this {
    const buf = Buffer.allocUnsafe(2);
    buf.writeInt16BE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes an unsigned 16-bit integer in little-endian format at the current stream pointer position.
   */
  writeUInt16LE(value: number): this {
    const buf = Buffer.allocUnsafe(2);
    buf.writeUInt16LE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes an unsigned 16-bit integer in big-endian format at the current stream pointer position.
   */
  writeUInt16BE(value: number): this {
    const buf = Buffer.allocUnsafe(2);
    buf.writeUInt16BE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a signed 32-bit integer in little-endian format at the current stream pointer position.
   */
  writeInt32LE(value: number): this {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a signed 32-bit integer in big-endian format at the current stream pointer position.
   */
  writeInt32BE(value: number): this {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32BE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes an unsigned 32-bit integer in little-endian format at the current stream pointer position.
   */
  writeUInt32LE(value: number): this {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32LE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes an unsigned 32-bit integer in big-endian format at the current stream pointer position.
   */
  writeUInt32BE(value: number): this {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32BE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a signed 64-bit BigInt in little-endian format at the current stream pointer position.
   */
  writeBigInt64LE(value: bigint): this {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigInt64LE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a signed 64-bit BigInt in big-endian format at the current stream pointer position.
   */
  writeBigInt64BE(value: bigint): this {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigInt64BE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes an unsigned 64-bit BigInt in little-endian format at the current stream pointer position.
   */
  writeBigUInt64LE(value: bigint): this {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigUInt64LE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes an unsigned 64-bit BigInt in big-endian format at the current stream pointer position.
   */
  writeBigUInt64BE(value: bigint): this {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigUInt64BE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a 32-bit single-precision floating-point number in little-endian format at the current stream pointer position.
   */
  writeFloatLE(value: number): this {
    const buf = Buffer.allocUnsafe(4);
    buf.writeFloatLE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a 32-bit single-precision floating-point number in big-endian format at the current stream pointer position.
   */
  writeFloatBE(value: number): this {
    const buf = Buffer.allocUnsafe(4);
    buf.writeFloatBE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a 64-bit double-precision floating-point number in little-endian format at the current stream pointer position.
   */
  writeDoubleLE(value: number): this {
    const buf = Buffer.allocUnsafe(8);
    buf.writeDoubleLE(value, 0);
    return this.write(buf);
  }

  /**
   * Writes a 64-bit double-precision floating-point number in big-endian format at the current stream pointer position.
   */
  writeDoubleBE(value: number): this {
    const buf = Buffer.allocUnsafe(8);
    buf.writeDoubleBE(value, 0);
    return this.write(buf);
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
   * @param encode - The character encoding to use if the `input` is a string.
   * @returns A new `BytesIO` instance initialized with the parsed input data.
   */
  static from(input: any, encode?: BufferEncoding): BytesIO {
    return new BytesIO(Buffer.from(input, encode));
  }

  /**
   * Concatenates an array of `Buffer` or `Uint8Array` instances into a single `BytesIO` instance.
   *
   * @param data - An array of `Buffer` or `Uint8Array` objects to be joined together in order.
   * @returns A new `BytesIO` instance containing the concatenated binary data.
   */
  static concat(data: Array<Buffer | Uint8Array>): BytesIO {
    return new BytesIO(Buffer.concat(data as unknown as Array<Uint8Array>));
  }

  /**
   * Gets the total size of the underlying buffer in bytes.
   *
   * @returns The byte length of the buffer.
   */
  get length(): number {
    return this._buffer.length;
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
  get pos(): number {
    return this._pos;
  }

  /**
   * Gets whether the stream has been closed.
   */
  get closed(): boolean {
    return this._closed;
  }
}
