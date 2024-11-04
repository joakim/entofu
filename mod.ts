/**
 * Reference implementation of the Entofu algorithm (Base262144).
 *
 * The encoding produces valid unassigned 4-byte Unicode characters (tofus).
 *
 * Bit distribution of a tofu: 111100xx 10zzzzzz 10zzzzzz 10zzzzzz
 * - xx = 10: regular tofu (first byte = F2)
 * - xx = 01: special tofu, unpadded terminal tofu (first byte = F1)
 * - xx = 11: special tofu, padded terminal tofu or noncharacter substitute tofu (first byte = F3)
 * - z…: data bits
 */

const BITS_PER_BYTE = 8
const BITS_PER_TOFU = 18

const UNICODE_LEAD = 0xf0 // 0b11110000
const UNICODE_LEAD_REGULAR = 0xf2 // 0b11110010
const UNICODE_LEAD_TERMINAL = 0xf1 // 0b11110001
const UNICODE_LEAD_TERMINAL_PADDED = 0xf3 // 0b11110011
const UNICODE_LEAD_NONCHAR = 0xf3 // 0b11110011

const UNICODE_CONTINUATION = 0x80 // 0b10000000
const UNICODE_CONTINUATION_BF = 0xbf // 0b10111111
const UNICODE_CONTINUATION_BE = 0xbe // 0b10111110
const UNICODE_CONTINUATION_NONCHAR = 0x90 // 0b10000000

/** Matches _F of the second byte, not just 8F. */
const UNICODE_PLANE_XF = 0x8f // 0b10001111

/**
 * Encodes binary data into a tofu string.
 * @param input – Binary data.
 * @returns Entofu encoded data as a string.
 */
export function stringify(input: Uint8Array): string {
  let encoded = entofu(input)
  return new TextDecoder('utf8').decode(encoded)
}

/**
 * Decodes a tofu string into binary data.
 * @param input - Entofu encoded data as a string.
 * @returns Binary data.
 */
export function parse(input: string): Uint8Array {
  let encoded = new TextEncoder().encode(input)
  return detofu(encoded)
}

/**
 * Encodes binary data into tofu.
 * @param input - Binary data.
 * @returns Entofu encoded data as UTF-8 bytes.
 */
export function entofu(input: Uint8Array): Uint8Array {
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
          tofu[1] = UNICODE_CONTINUATION | 1
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
      tofu[0] = UNICODE_LEAD_NONCHAR
      tofu[1] = UNICODE_CONTINUATION_NONCHAR
      tofu[2] = UNICODE_CONTINUATION
      tofu[3] = UNICODE_CONTINUATION | noncharacter | (plane << 1) | (special << 3)
    }

    output.set(tofu, offset)
  }

  return output
}

/**
 * Decodes tofu into binary data.
 * @param input - Entofu encoded data as UTF-8 bytes.
 * @returns Binary data.
 */
export function detofu(input: Uint8Array): Uint8Array {
  let length = Math.ceil(((input.length / 4) * BITS_PER_TOFU) / BITS_PER_BYTE)
  let output = new Uint8Array(length)

  let index = 0
  let buffer = 0
  let count = 0

  for (let offset = 0; offset < input.length; offset += 4) {
    let tofu = input.subarray(offset, offset + 4)

    if ((tofu[0] & 0b11111100) !== UNICODE_LEAD) throw Error(`Invalid leading byte at ${offset}`)

    // Bytes to skip (for padded terminal tofus)
    let skip = 0

    // Special tofu (terminal/noncharacter)
    if ((tofu[0] & 1) === 1) {
      // Padded/noncharacter
      if (((tofu[0] >> 1) & 1) === 1) {
        if (tofu[1] === UNICODE_CONTINUATION_NONCHAR) {
          // Noncharacter
          let noncharacter = tofu[3] & 1
          let plane = (tofu[3] >> 1) & 0b11
          let special = (tofu[3] >> 3) & 1
          tofu[0] = UNICODE_LEAD | (special ? 0b01 : 0b10)
          tofu[1] = UNICODE_CONTINUATION | (plane << 4) | 0b1111
          tofu[2] = UNICODE_CONTINUATION | 0b111111
          tofu[3] = UNICODE_CONTINUATION | 0b111110 | noncharacter
        } else {
          // Padded terminal tofu
          skip = 1 + (tofu[1] & 1)
        }
      }
    }

    for (let byte = 1 + skip; byte <= 3; byte++) {
      if ((tofu[byte] & 0b11000000) !== UNICODE_CONTINUATION)
        throw Error(`Invalid continuation byte at ${offset + byte}`)

      // Fill the bit buffer from the tofu byte's data
      let bits = tofu[byte] & 0b111111
      buffer = (buffer << 6) | bits
      count += 6

      // Extract bytes as they become available
      while (count >= 8) {
        let data = (buffer >> (count - 8)) & 0xff
        output[index++] = data
        count -= 8
      }
    }
  }

  // Cap the output to only extracted bytes (may be < length)
  return output.subarray(0, index)
}
