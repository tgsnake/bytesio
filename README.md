# `@tgsnake/bytesio` 🚀

A high-performance, lightweight, seekable in-memory binary stream library for JavaScript and TypeScript, heavily inspired by Python's `io.BytesIO`.

Originally decoupled from [`@tgsnake/core`](https://github.com/tgsnake/core) to serve as a high-performance standalone module for Node.js, Deno, Bun, and browser environments.

[![JSR Badge](https://jsr.io/badges/@tgsnake/bytesio)](https://jsr.io/@tgsnake/bytesio) [![NPM Version](https://img.shields.io/npm/v/@tgsnake/bytesio.svg)](https://www.npmjs.com/package/@tgsnake/bytesio) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Key Features

- 💾 **Seekable In-Memory Streams**: Track pointer position automatically with sequential or random-access seek operations (`0` absolute, `1` relative, `2` from-end).
- ⚙️ **Direct Node.js Buffer API**: Provides highly optimized operations to read and write integers, floats, doubles, bigints, and subarrays directly from/to memory.
- ⚡ **Cross-Platform**: Fully compatible with Node.js, Deno, Bun, and browsers with a centralized polyfill layer.
- 🚀 **Zero Dependencies**: Lightweight and fast footprint designed for modern high-performance networking, protocol parsing, and binary serialization.
- 📦 **Modern ESM & Typescript**: Written in TypeScript with first-class JSR support, full type safety, and clean ESM packaging.

---

## ⚠️ Requirements & Compatibility in v2.0.0

Version `2.0.0` introduces modern packaging improvements to align with the current JS/TS ecosystem:

- **Pure ESM (EcmaScript Modules)**: The package is now fully ESM. Since Node 20+ has support `require(ESM)`, this package now has fully writen to ESM. Minimum Node.js version is now **>= 22.0.0**. Formal support has been added for **Deno (>= 1.0.0)** and **Bun (>= 1.0.0)**.
- **First-class JSR & Deno Support**: Native Deno integration and standard JSR publishing.

---

## 📦 Installation

Install `@tgsnake/bytesio` using your favorite package manager:

### Node.js / Bun (via NPM, Yarn, PNPM, Bun)

```bash
# Using npm
npm install @tgsnake/bytesio

# Using yarn
yarn add @tgsnake/bytesio

# Using pnpm
pnpm add @tgsnake/bytesio

# Using bun
bun add @tgsnake/bytesio
```

### Deno / JSR (Native Deno Import)

```bash
# Add the dependency via JSR
deno add jsr:@tgsnake/bytesio
```

---

## 🛠️ Detailed Usage & Examples

### 1. In-Memory Write & Read Operations

```typescript
import { BytesIO } from '@tgsnake/bytesio';
import { Buffer } from 'node:buffer'; // or standard global Buffer in modern environments

// 1. Create a stream and write binary data
const stream = new BytesIO();
stream.write(Buffer.from([0x10, 0x20]));
stream.write(Buffer.from([0x30, 0x40]));

// Check pointer and stream length
console.log('Stream length:', stream.length); // Output: 4 bytes
console.log('Current pointer:', stream.post); // Output: 0 (write does not advance the seek pointer)

// 2. Seek and read sequentially
stream.seek(0);
const allBytes = stream.read();
console.log(allBytes); // Output: <Buffer 10 20 30 40>

// 3. Read specific slice size
stream.seek(1); // Seek to offset 1
const chunk = stream.read(2);
console.log(chunk); // Output: <Buffer 20 30>
console.log('Pointer position:', stream.post); // Output: 3 (advanced by 2)
```

### 2. Reading Binary Data Types (Integers, BigInts, Floats)

`BytesIO` provides built-in wrapper methods for Node.js `Buffer` integer, bigint, and float parsing. They automatically advance the stream pointer by the number of read bytes (or a customized step size).

```typescript
import { BytesIO } from '@tgsnake/bytesio';

// Setup buffer containing mixed data: [Int32LE, BigInt64BE, FloatLE]
const dataStream = BytesIO.alloc(20);

// Allocate and write manually or instantiate from array
const stream = BytesIO.from([
  0x78,
  0x56,
  0x34,
  0x12, // 305419896 (Int32LE)
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x0a, // 10n (BigInt64BE)
  0x00,
  0x00,
  0xa0,
  0x40, // 5.0 (FloatLE)
]);

// Read 32-bit signed integer (little-endian)
const val1 = stream.readInt32LE(); // Reads 4 bytes and advances pointer by 4
console.log(val1); // Output: 305419896
console.log(stream.post); // Output: 4

// Read 64-bit signed BigInt (big-endian)
const val2 = stream.readBigInt64BE(); // Reads 8 bytes and advances pointer by 8
console.log(val2); // Output: 10n
console.log(stream.post); // Output: 12

// Read 32-bit float (little-endian)
const val3 = stream.readFloatLE(); // Reads 4 bytes and advances pointer by 4
console.log(val3); // Output: 5.0
console.log(stream.post); // Output: 16
```

### 3. Seeking Modes

You can control stream tracking with standard file-seek positioning (`whence` options):

```typescript
import { BytesIO } from '@tgsnake/bytesio';

const stream = BytesIO.from('Hello, Advanced BytesIO!', 'utf-8');

// whence = 0 (Absolute seek relative to the beginning of the stream)
stream.seek(7, 0);
console.log(stream.read(8).toString('utf-8')); // Output: 'Advanced'

// whence = 1 (Relative seek from the current pointer location)
stream.seek(-8, 1); // Move backward 8 bytes
console.log(stream.read(8).toString('utf-8')); // Output: 'Advanced'

// whence = 2 (Seek relative to the end of the stream - expects a negative offset)
stream.seek(-1, 2); // Move to the last byte
console.log(stream.read().toString('utf-8')); // Output: '!'
```

---

## 📖 API Documentation

### Constructor

- `new BytesIO(buffer?: Buffer)`: Creates an in-memory stream wrapper around an optional initial Node.js `Buffer`.

### Instance Properties

- `length`: `number` (Read-only) — The total size of the underlying buffer in bytes.
- `buffer`: `Buffer` (Read-only) — Access the underlying raw `Buffer` object.
- `post`: `number` (Read-only) — The current read/write pointer (byte index) of the stream.

### Instance Methods

- `seek(offset: number, whence?: number): number` — Moves the internal pointer. `whence` supports:
  - `0`: Seek from start (absolute).
  - `1`: Seek relative to current position.
  - `2`: Seek relative to the end (requires negative offset).
- `read(length?: number): Buffer` — Reads up to `length` bytes from the current pointer position and advances the pointer. If `length` is omitted, reads to the end.
- `slice(start?: number, end?: number): BytesIO` — Returns a new `BytesIO` instance referencing a subarray slice of the original buffer (shared memory).
- `write(data: Buffer): this` — Appends binary data to the absolute end of the buffer (increases length, doesn't change `post`).
- `toJSON(): { type: 'Buffer'; data: number[] }` — Serializes the underlying buffer data to JSON format.
- `toString(encoding?: string, start?: number, end?: number): string` — Decodes the buffer to a string.

#### Custom Decoders (Integer/Float/BigInt)

Every decoder reads the specified data type at the current pointer position and advances the pointer by `size` bytes (defaults to the type size):

- `readInt32LE(size?: number): number`
- `readInt32BE(size?: number): number`
- `readUInt32LE(size?: number): number`
- `readUInt32BE(size?: number): number`
- `readBigInt64LE(size?: number): bigint`
- `readBigInt64BE(size?: number): bigint`
- `readBigUInt64LE(size?: number): bigint`
- `readBigUInt64BE(size?: number): bigint`
- `readDoubleLE(size?: number): number`
- `readDoubleBE(size?: number): number`
- `readFloatLE(size?: number): number`
- `readFloatBE(size?: number): number`

### Static Methods

- `BytesIO.alloc(size: number): BytesIO` — Creates a new instance with a zero-filled buffer of the specified size.
- `BytesIO.from(input: any, encoding?: string): BytesIO` — Creates a new instance from an array, string, buffer, or ArrayBuffer.
- `BytesIO.concat(list: Buffer[]): BytesIO` — Joins an array of buffers into a single `BytesIO` instance.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

Built with ♥️ by the **tgsnake** team. Contributions and issues are welcome!
