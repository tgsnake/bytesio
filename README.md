# BytesIO 🚀

A simple Buffer implementation inspired by Python's `BytesIO`.  
This project was originally based on the source code from [`@tgsnake/core`](https://github.com/tgsnake/core). 🐍

## Features ✨

- In-memory byte stream operations 💾
- Read and write bytes efficiently ⚡
- Python-like API for ease of use 🐍

## Installation 📦

```bash
# Example installation command
npm install @tgsnake/bytesio
```

## Usage 🛠️

```ts
import { BytesIO } from '@tgsnake/bytesio';

const stream = new BytesIO();
stream.write(Buffer.from([1, 2, 3]));
stream.seek(0);
console.log(stream.read(3)); // Output: <Buffer 01 02 03>
```
