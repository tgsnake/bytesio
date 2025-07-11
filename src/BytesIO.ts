/**
 * tgsnake - Telegram MTProto library for javascript or typescript.
 * Copyright (C) 2025 tgsnake <https://github.com/tgsnake>
 *
 * THIS FILE IS PART OF TGSNAKE
 *
 * tgsnake is a free software: you can redistribute it and/or modify
 * it under the terms of the MIT License as published.
 */
import { Buffer } from 'node:buffer';

/**
 * A class for reading and writing binary data using Node.js Buffers, similar to Python's BytesIO.
 * Provides methods for seeking, slicing, reading, and writing various data types.
 *
 * @remarks
 * This class is useful for manipulating binary data in memory, supporting random access and
 * reading/writing of integers, floats, and raw buffers.
 *
 * @example
 * ```typescript
 * const bio = BytesIO.from([1, 2, 3, 4]);
 * bio.seek(0);
 * const value = bio.readInt32LE();
 * ```
 */
export class BytesIO {
  /**
   * Creates a new BytesIO instance with an optional initial buffer.
   * @param buffer - The initial buffer to use. Defaults to an empty buffer.
   */
  private _buffer!: Buffer;
  private _post!: number;
  constructor(buffer: Buffer = Buffer.alloc(0)) {
    this._post = 0;
    this._buffer = buffer;
    return this;
  }
  /**
   * Moves the internal pointer to a new position.
   * @param offset - The offset to move the pointer.
   * @param whence - The reference point: 0 (start), 1 (current), 2 (end).
   * @returns The new pointer position.
   * @throws If the offset or whence is invalid.
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
   * Returns a new BytesIO instance containing a slice of the buffer.
   * @param args - Arguments passed to Buffer.subarray.
   * @returns A new BytesIO instance with the sliced buffer.
   */
  slice(...args: Array<any>): BytesIO {
    return new BytesIO(this._buffer.subarray(...args));
  }
  /**
   * Returns a JSON representation of the buffer.
   * @returns The buffer as a JSON object.
   */
  toJSON() {
    return this._buffer.toJSON();
  }
  /**
   * Returns a string representation of the buffer.
   * @param args - Arguments passed to Buffer.toString.
   * @returns The buffer as a string.
   */
  toString(...args: Array<any>) {
    return this._buffer.toString(...args);
  }
  /**
   * Reads a specified number of bytes from the current pointer.
   * Advances the pointer by the number of bytes read.
   * @param length - The number of bytes to read. If undefined, reads to the end.
   * @returns A Buffer containing the read bytes.
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
   * Reads a 32-bit signed integer (little-endian) from the current pointer.
   * Advances the pointer by 4 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 4.
   * @returns The read integer.
   */
  readInt32LE(size: number = 4): number {
    const results = this._buffer.readInt32LE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 32-bit signed integer (big-endian) from the current pointer.
   * Advances the pointer by 4 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 4.
   * @returns The read integer.
   */
  readInt32BE(size: number = 4): number {
    const results = this._buffer.readInt32BE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 32-bit unsigned integer (little-endian) from the current pointer.
   * Advances the pointer by 4 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 4.
   * @returns The read unsigned integer.
   */
  readUInt32LE(size: number = 4): number {
    const results = this._buffer.readUInt32LE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 32-bit unsigned integer (big-endian) from the current pointer.
   * Advances the pointer by 4 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 4.
   * @returns The read unsigned integer.
   */
  readUInt32BE(size: number = 4): number {
    const results = this._buffer.readInt32BE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 64-bit signed integer (little-endian) from the current pointer.
   * Advances the pointer by 8 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 8.
   * @returns The read bigint.
   */
  readBigInt64LE(size: number = 8): bigint {
    const results = this._buffer.readBigInt64LE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 64-bit signed integer (big-endian) from the current pointer.
   * Advances the pointer by 8 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 8.
   * @returns The read bigint.
   */
  readBigInt64BE(size: number = 8): bigint {
    const results = this._buffer.readBigInt64BE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 64-bit unsigned integer (little-endian) from the current pointer.
   * Advances the pointer by 8 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 8.
   * @returns The read bigint.
   */
  readBigUInt64LE(size: number = 8): bigint {
    const results = this._buffer.readBigUInt64LE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 64-bit unsigned integer (big-endian) from the current pointer.
   * Advances the pointer by 8 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 8.
   * @returns The read bigint.
   */
  readBigUInt64BE(size: number = 8): bigint {
    const results = this._buffer.readBigUInt64BE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 64-bit floating point number (little-endian) from the current pointer.
   * Advances the pointer by 8 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 8.
   * @returns The read double.
   */
  readDoubleLE(size: number = 8): number {
    const results = this._buffer.readDoubleLE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 64-bit floating point number (big-endian) from the current pointer.
   * Advances the pointer by 8 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 8.
   * @returns The read double.
   */
  readDoubleBE(size: number = 8): number {
    const results = this._buffer.readDoubleBE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 32-bit floating point number (little-endian) from the current pointer.
   * Advances the pointer by 4 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 4.
   * @returns The read float.
   */
  readFloatLE(size: number = 4): number {
    const results = this._buffer.readFloatLE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Reads a 32-bit floating point number (big-endian) from the current pointer.
   * Advances the pointer by 4 bytes (or specified size).
   * @param size - Number of bytes to advance the pointer. Defaults to 4.
   * @returns The read float.
   */
  readFloatBE(size: number = 4): number {
    const results = this._buffer.readFloatBE(this._post);
    this.seek(size, 1);
    return results;
  }
  /**
   * Appends data to the end of the buffer.
   * @param data - The Buffer to append.
   * @returns The BytesIO instance (for chaining).
   */
  write(data: Buffer): BytesIO {
    this._buffer = Buffer.concat([
      this._buffer as unknown as Uint8Array,
      data as unknown as Uint8Array,
    ]);
    return this;
  }
  /**
   * Allocates a new BytesIO instance with a buffer of the given size.
   * @param size - The size of the buffer to allocate.
   * @returns A new BytesIO instance.
   */
  static alloc(size: number): BytesIO {
    return new BytesIO(Buffer.alloc(size));
  }
  /**
   * Creates a new BytesIO instance from the given input.
   * @param input - The input data (Buffer, Array, string, etc.).
   * @param encode - Optional encoding if input is a string.
   * @returns A new BytesIO instance.
   */
  static from(input: any, encode?: any): BytesIO {
    return new BytesIO(Buffer.from(input, encode));
  }
  /**
   * Concatenates an array of Buffers into a new BytesIO instance.
   * @param data - The array of Buffers to concatenate.
   * @returns A new BytesIO instance.
   */
  static concat(data: Array<Buffer>): BytesIO {
    return new BytesIO(Buffer.concat(data as unknown as Array<Uint8Array>));
  }
  /**
   * Gets the length of the buffer in bytes.
   */
  get length(): number {
    return Buffer.byteLength(this._buffer);
  }
  /**
   * Gets the underlying Buffer.
   */
  get buffer(): Buffer {
    return this._buffer;
  }
  /**
   * Gets the current pointer position.
   */
  get post(): number {
    return this._post;
  }
}
