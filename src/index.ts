/**
 * A reference implementation of the Base524288 Entofu algorithm.
 *
 * On Base262144:
 * It is arguably cleaner, with 3 x 6 bits, but objectively not as efficient as
 * using all 19 bits and 8 Unicode planes. It may however be more amenable to
 * optimization, by borrowing tricks from Base64 libraries. I have therefore
 * included it as an option.
 *
 * Base262144 produces at least one tofu more. If length is of importance,
 * stick to Base524288. Note that although they use the same code and occupy
 * the same Unicode planes, the two are not interchangeable.
 */

/** Leading byte of a Unicode character. */
const UNICODE_LEADING_MASK = 0xf0 // 0b11110000

/** Continuation byte of a Unicode character. */
const UNICODE_CONTINUATION_MASK = 0x80 // 0b10000000

/** Continuation byte BF. */
const UNICODE_CONTINUATION_BF = 0xbf // 0b10111111

/** Continuation byte BE. */
const UNICODE_CONTINUATION_BE = 0xbe // 0b10111110

/** Matches …F of the second byte. */
const UNICODE_PLANE_MASK = 0x8f // 0b10001111

/**
 * Encodes binary data into Unicode tofu.
 *
 * @param input - Binary data as a byte array.
 * @param base262144 - Encode using 18 bits per character instead of 19 (don't).
 * @returns Unicode tofu as a byte array.
 */
export function entofu(input: Uint8Array, base262144 = false) {
  let bits = base262144 ? 18 : 19
  let length = Math.ceil((input.byteLength * 8) / bits) * 4
  let output = new Uint8Array(length)

  // Current bit in the input byte array.
  let cursor = 0

  /** Reads one bit from the input. */
  function readOne() {
    const offset = Math.floor(cursor / 8)
    const shift = 7 - (cursor % 8)
    cursor += 1
    return (input[offset] >> shift) & 1
  }

  /** Reads the specified number of bits from the input. */
  function read(n: number) {
    let i: number
    let value = 0
    for (i = 0; i < n; i += 1) {
      value = (value << 1) | readOne()
    }
    return value
  }

  // Encode the binary 4 bytes at a time, tofu by tofu.
  for (let offset = 0; offset < length; offset += 4) {
    const bytes = new Uint8Array(4)

    bytes[0] = (base262144 || readOne() ? 0b01 : 0b10) | UNICODE_LEADING_MASK
    bytes[1] = read(6) | UNICODE_CONTINUATION_MASK
    bytes[2] = read(6) | UNICODE_CONTINUATION_MASK
    bytes[3] = read(6) | UNICODE_CONTINUATION_MASK

    // If a sneaky noncharacter is produced, transform it into a special substitute tofu.
    if (isNoncharacter(bytes)) {
      bytes[2] = bytes[1]
      bytes[1] = ((bytes[0] >> 0) & 2) | UNICODE_CONTINUATION_MASK
      bytes[0] = 0b11 | UNICODE_LEADING_MASK
    }

    output.set(bytes, offset)
  }

  return output
}

/**
 * Decodes Unicode tofu into binary data.
 *
 * @param input - Unicode tofu as a byte array.
 * @param base262144 - Decode using 18 bits per character instead of 19.
 * @returns Binary data as a byte array.
 */
export function detofu(input: Uint8Array, base262144 = false) {
  let bits = base262144 ? 18 : 19
  let output = new Uint8Array()

  let length = input.length
  for (let offset = 0; offset < length; offset += 4) {
    // @todo it
  }

  return output
}

/** Checks whether a Unicode character is in fact not a character. */
function isNoncharacter(bytes: Uint8Array | number[]) {
  return (
    (bytes[3] === UNICODE_CONTINUATION_BF || bytes[3] === UNICODE_CONTINUATION_BE) &&
    bytes[2] === UNICODE_CONTINUATION_BF &&
    (bytes[1] & UNICODE_PLANE_MASK) === UNICODE_PLANE_MASK
  )
}
