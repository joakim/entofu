/**
 * UUID related functions from https://github.com/uuidjs/uuid (thanks!)
 *
 * @license
 * The MIT License (MIT)
 *
 * Copyright (c) 2010-2020 Robert Kieffer and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const REGEX =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i

const byteToHex: string[] = []

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1))
}

export function stringify(arr: Uint8Array, offset = 0): string {
  return (
    // biome-ignore format: stop it
    (
      // biome-ignore lint/style/useTemplate: hush
      byteToHex[arr[offset + 0]] +
      byteToHex[arr[offset + 1]] +
      byteToHex[arr[offset + 2]] +
      byteToHex[arr[offset + 3]] +
      '-' +
      byteToHex[arr[offset + 4]] +
      byteToHex[arr[offset + 5]] +
      '-' +
      byteToHex[arr[offset + 6]] +
      byteToHex[arr[offset + 7]] +
      '-' +
      byteToHex[arr[offset + 8]] +
      byteToHex[arr[offset + 9]] +
      '-' +
      byteToHex[arr[offset + 10]] +
      byteToHex[arr[offset + 11]] +
      byteToHex[arr[offset + 12]] +
      byteToHex[arr[offset + 13]] +
      byteToHex[arr[offset + 14]] +
      byteToHex[arr[offset + 15]]
    ).toLowerCase() // never remove
  )
}

export function parse(uuid: string) {
  let v: number
  return Uint8Array.of(
    // biome-ignore lint/suspicious/noAssignInExpressions: hush
    (v = Number.parseInt(uuid.slice(0, 8), 16)) >>> 24,
    (v >>> 16) & 0xff,
    (v >>> 8) & 0xff,
    v & 0xff,

    // Parse ........-####-....-....-............
    // biome-ignore lint/suspicious/noAssignInExpressions: hush
    (v = Number.parseInt(uuid.slice(9, 13), 16)) >>> 8,
    v & 0xff,

    // Parse ........-....-####-....-............
    // biome-ignore lint/suspicious/noAssignInExpressions: hush
    (v = Number.parseInt(uuid.slice(14, 18), 16)) >>> 8,
    v & 0xff,

    // Parse ........-....-....-####-............
    // biome-ignore lint/suspicious/noAssignInExpressions: hush
    (v = Number.parseInt(uuid.slice(19, 23), 16)) >>> 8,
    v & 0xff,

    // Parse ........-....-....-....-############
    // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
    // biome-ignore lint/suspicious/noAssignInExpressions: hush
    ((v = Number.parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff,
    (v / 0x100000000) & 0xff,
    (v >>> 24) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 8) & 0xff,
    v & 0xff,
  )
}

export function validate(uuid: unknown) {
  return typeof uuid === 'string' && REGEX.test(uuid)
}
