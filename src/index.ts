/**
 * Reference implementation of the Entofu algorithm (Base262144).
 *
 * The encoding produces valid unassigned 4-byte Unicode characters (tofus).
 *
 * Bit distribution of a tofu: 111100xx 10zzzzzz 10zzzzzz 10zzzzzz
 * - xx = 10: regular tofu (first byte = F2)
 * - xx = 01: special tofu, unpadded terminal tofu (first byte = F1)
 * - xx = 11: special tofu, padded terminal tofu or noncharacter (first byte = F3)
 * - z…: data bits
 */

const BITS_PER_BYTE = 8
const BITS_PER_TOFU = 18

const UNICODE_LEAD_REGULAR = 0xf2 // 0b11110010
const UNICODE_LEAD_TERMINAL = 0xf1 // 0b11110001
const UNICODE_LEAD_TERMINAL_PADDED = 0xf3 // 0b11110011
const UNICODE_LEAD_NONCHAR = 0xf3

const UNICODE_CONTINUATION = 0x80 // 0b10000000
const UNICODE_CONTINUATION_BF = 0xbf // 0b10111111
const UNICODE_CONTINUATION_BE = 0xbe // 0b10111110

/** Matches _F of the second byte, not just 8F. */
const UNICODE_PLANE_XF = 0x8f // 0b10001111

/**
 */

/**
 * Encodes binary data into tofu.
 * @param input - Binary data.
 * @returns Entofu encoded data as UTF-8 bytes.
 */
export function entofu(input: Uint8Array) {
  let bits = input.byteLength * BITS_PER_BYTE
  let length = Math.ceil(bits / BITS_PER_TOFU) * 4 // in tofus
  let output = new Uint8Array(length)

  let index = 0
  let buffer = 0
  let count = 0

  for (let offset = 0; offset < length; offset += 4) {
    let tofu = new Uint8Array(4)
    tofu[0] = UNICODE_LEAD_REGULAR

    for (let byte = 1; byte <= 3; byte++) {
      // Fill the bit buffer from the input
      if (count < 6) {
        buffer = (buffer << BITS_PER_BYTE) | input[index++]
        count += BITS_PER_BYTE
      }

      // Extract 6 bits for the tofu
      if (count >= 6) {
        tofu[byte] = UNICODE_CONTINUATION | (buffer >> (count - 6))
        buffer &= (1 << (count - 6)) - 1
        count -= 6
      }
    }

    // Handle terminal tofu and padding
    if (offset + 4 === length) {
      tofu[0] = UNICODE_LEAD_TERMINAL

      let remainder = bits % BITS_PER_TOFU
      if (remainder && remainder < 12) {
        tofu[0] = UNICODE_LEAD_TERMINAL_PADDED

        if (remainder < 6) {
          tofu[3] = tofu[1]
          tofu[2] = UNICODE_CONTINUATION
          tofu[1] = UNICODE_CONTINUATION | 0b1
        } else {
          tofu[3] = tofu[2]
          tofu[2] = tofu[1]
          tofu[1] = UNICODE_CONTINUATION
        }
      }
    }

    // Handle noncharacter
    if (
      tofu[2] === UNICODE_CONTINUATION_BF &&
      (tofu[3] === UNICODE_CONTINUATION_BF || tofu[3] === UNICODE_CONTINUATION_BE) &&
      (tofu[1] & UNICODE_PLANE_XF) === UNICODE_PLANE_XF
    ) {
      let special = tofu[0] & 1
      let plane = (tofu[1] & 0b110000) >> 4
      let noncharacter = tofu[3] & 1
      tofu[3] = noncharacter | (plane << 1) | (special << 3)
      tofu[2] = UNICODE_CONTINUATION
      tofu[1] = UNICODE_CONTINUATION | 0b10000 // 90
      tofu[0] = UNICODE_LEAD_NONCHAR
    }

    output.set(tofu, offset)
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
