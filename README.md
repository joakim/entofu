# □ Entofu

![License](https://img.shields.io/badge/license-public_domain-green?color=0fb46e)
![Status](https://img.shields.io/badge/status-draft-ee7263)

A [binary-to-text encoding](https://en.wikipedia.org/wiki/Binary-to-text_encoding) that encodes binary data as unassigned Unicode code points, also known as [tofu](https://en.wiktionary.org/wiki/tofu#English:_undisplayable_character).

Entofu stuffs binary data into 262,144 tofus of Unicode planes 8 to 11 – the empty planes in the middle of [the vast Unicode codespace](/assets/unicode-map.png). It lets you embed binary data _inside_ valid UTF-8 text, making tofu omelette without breaking any eggs so to speak. [^1]

Alternatively, it's a Base262144 encoding that uses almost half of Unicode as its alphabet. [^2]

It is much shorter in length than common base encodings like Base32, Base64 and Base85.

| Bits | Output                        | Length | Size               |
| ---- | ----------------------------- | ------ | ------------------ |
| 128  | 򀂘򡶢򝁉򛣤򋡷򱻧򑬍󁀐                      | 8      | 256 bits (2×)      |
| 256  | 򡙘򾧙򸁠򒗤򓮨򩻑򊰟򂌦򊻑򛽈򾝦򈖮򯴐򄻱󁀔               | 15     | 480 bits (1.875×)  |
| 512  | 򺔴򆟮򫪕򮐓򐬡򝗮򔈼򑻄򇨋򡒼򮈢򟠐򉉚򚋅򹕾򼛲򷮐򳚱򊰅򽍿򒮖򉂠򨺡򀅢򘞷򷶏򶰶򴐼󀗠 | 29     | 928 bits (1.8125×) |


## JavaScript library

![Dependencies](https://img.shields.io/badge/dependencies-none-0fb46e)
![Maintenance](https://img.shields.io/maintenance/yes/2025?color=0fb46e)
[![NPM](https://img.shields.io/npm/v/entofu)](https://www.npmjs.com/package/entofu)
[![JSR](https://img.shields.io/jsr/v/%40joakim/entofu)](https://jsr.io/@joakim/entofu)

### Status

It's still early days. The algorithm is implemented and working, except noncharacter decoding. After that's done, I'll add a test suite, upgrade the status to alpha and publish a package to npm and jsr.

### Usage

Install [`entofu`](https://www.npmjs.com/package/entofu) from npm or [`@joakim/entofu`](https://jsr.io/@joakim/entofu) from jsr. The code below assumes npm.

```js
import { stringify, parse } from 'entofu'

let data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]

let encoded = stringify(data)
//=> 򀐈򃁀򔆁񰠉

let decoded = parse(encoded)
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
```

The functions `stringify` and `parse` rely on JavaScript's widely supported [Encoding API](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API) to convert to and from UTF-8. If the JavaScript runtime does not support [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) and [`TextDecoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder), or you want to work directly with byte arrays, use the `entofu` and `detofu` functions instead.

```js
import { entofu, detofu } from 'entofu'

let data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]

let encoded = entofu(data)
// Uint8Array(16) [ 242, 128, 144, 136, 242, 131, 129, 128, 242, 148, 134, 129, 241, 176, 160, 137 ]

let decoded = detofu(encoded)
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
```

## Efficiency

Each 32-bit code point can hold 18 (3 × 6) bits of binary data in its continuation bytes:

|        | 1st byte   | 2nd byte   | 3rd byte   | 4th byte   |
| ------ | ---------- | ---------- | ---------- | ---------- |
| Binary | `11110010` | `10001111` | `10111111` | `10000000` |
| Mask   | `11110010` | `10______` | `10______` | `10______` |

Tofu characters contain _3×_ more data than Base64 characters, making it visually much smaller. This comes at a cost of more overhead and larger size of the encoded data (bytes in memory or on disk).

### Theoretical numbers

|                                 | Base8 | Base16 | Base32 | Base64 | Base262144 (Entofu) |
| ------------------------------- | ----- | ------ | ------ | ------ | ------------------- |
| Size <sup>I</sup>               | 1×    | 2×     | 1.6×   | 1.333× | 1.777×              |
| Size efficiency <sup>II</sup>   | 100%  | 50%    | 62.5%  | 75% ★  | 56.25%              |
| Length <sup>III</sup>           | 1×    | 2×     | 1.6×   | 1.333× | 0.444×              |
| Length efficiency <sup>IV</sup> | 100%  | 50%    | 62.5%  | 75%    | 225% ★              |

<sup>I) Ratio between the number of bits in the output and the number of bits in the input, showing inflation in size (lower is better).</sup>\
<sup>II) The inverse ratio, showing the size efficiency as a percentage (higher is better).</sup>\
<sup>III) Ratio between the number of bits per byte of input and the number of bits per UTF-8 character of output, measuring the relative difference in length (lower is better).</sup>\
<sup>IV) The inverse ratio, illustrating the length efficiency as a percentage (higher is better).</sup>

Entofu falls between Base16 and Base32 in size efficiency, while only a fraction of the length.

That makes it not suitable for large binaries if _size_ matters, but useful for encoding smaller binary data, such as UUIDs and hashes, where the size is small and _length_ matters.

### Actual numbers

The larger the binary, or the less padding is required, the higher the size efficiency, approaching the theoretical 1.777 × the input's size.

UUIDs actually represent the worst case, with a padding of 16 unused bits in the last tofu. It is still smaller in size than the typical UUID. In length, it is by far the shortest encoding.

| Encoding         | Output                               | Length    | Size               |
| ---------------- | ------------------------------------ | --------- | ------------------ |
| [RFC 9562][uuid] | 90f119cf-9fc4-4090-acc1-0000bc711dc3 | 36 chars  | 288 bits (2.25×)   |
| Base16           | 90f119cf9fc44090acc10000bc711dc3     | 32 chars  | 256 bits (2×)      |
| Base32           | j3rhkkwzrh091b61000brw8xrc           | 26 chars  | 208 bits (1.625×)  |
| Base64           | kPEZz5_EQJCswQAAvHEdww               | 22 chars  | 176 bits (1.375×)  |
| Base85           | ORX47T>X!VXMFl:]Q"t0                 | 20 chars  | 160 bits (1.25×) ★ |
| Entofu           | 򐜟򀟫򑔘򁃡򖗳򭄝򩸯󁀰                             | 8 tofus ★ | 256 bits (2×)      |


## Textual representation

Each unassigned code point will be [displayed](https://www.unicode.org/faq/unsup_char.html) as a _missing glyph_ – that is, a [tofu](https://en.wiktionary.org/wiki/tofu#English:_undisplayable_character) – which differs by [font](https://learn.microsoft.com/en-us/typography/opentype/spec/recom#glyph-0-the-notdef-glyph). If a font doesn't provide a _missing glyph_, a [fallback font](https://en.wikipedia.org/wiki/Fallback_font) is used. [^3]

Unlike many base encodings, Entofu does not produce any characters that have special meaning in code or protocols. And unlike the related [Base122][base122], it doesn't produce characters that make selection, keyboard navigation and copy/paste difficult. Tofus are relatively unproblematic.

That said, they're not exactly typable, and they're only readable if the _missing glyph_ displays some information about the code point. Otherwise it's all tofu.


## Particularities

### Self-delimiting and padding

The last character of the encoded output is a distinct terminal character that handles padding, making it a self-delimiting encoding. Terminal characters use the unassigned planes above (12) and below (4-7) the planes used for regular characters (8-11).

The two least significant bits of the leading byte are used as flags for special tofu (terminal/noncharacter), resulting in the planes used.


### Noncharacters

Unicode reserves the last two code points of each plane as [noncharacters](https://www.unicode.org/faq/private_use.html#noncharacters) intended for internal use.

Any noncharacters produced when encoding must therefore be converted to substitute code points in plane 12.

Any substitute code points encountered when decoding must be converted back to their respective noncharacters before reading their binary data.

8 noncharacters in regular tofus:
- `U+8FFFE` ⟷ `U+D0000`
- `U+8FFFF` ⟷ `U+D0001`
- `U+9FFFE` ⟷ `U+D0002`
- `U+9FFFF` ⟷ `U+D0003`
- `U+AFFFE` ⟷ `U+D0004`
- `U+AFFFF` ⟷ `U+D0005`
- `U+BFFFE` ⟷ `U+D0006`
- `U+BFFFF` ⟷ `U+D0007`

8 noncharacters in terminal tofus:
- `U+4FFFE` ⟷ `U+D0008`
- `U+4FFFF` ⟷ `U+D0009`
- `U+5FFFE` ⟷ `U+D000A`
- `U+5FFFF` ⟷ `U+D000B`
- `U+6FFFE` ⟷ `U+D000C`
- `U+6FFFF` ⟷ `U+D000D`
- `U+7FFFE` ⟷ `U+D000E`
- `U+7FFFF` ⟷ `U+D000F`

The code points are converted back and forth by simple bitwise operations, yielding the sequence above.

(The substitutes are still unassigned code points used to represent binary data, in this case 15-18 consecutive `1` bits. Entofu does not assign meaning to these code points, they're merly stand-ins for noncharacters by necessity.)


## Rarely Asked Questions

**Is it future proof?**

> Some day, some of the tofus will inevitably be assigned a character and cease to be tofu. The tofu planes have been selected so that there's a buffer of one unassigned plane on each side, so this should be quite some time in the future. Even then, it should still be a valid encoding, producing some random characters from obscure scripts now and then.

**Can't you up the ante and use Base524288, with 19 bits per character?**

> Tried it, and I don't think it's worth it. It complicates the algorithm, negatively affecting performance, and is just not worth the ~5% gain in size efficiency. The length would often be the same as Base262144 anyway, due to padding needing an extra character in some cases. If these issues were solved, I'd be happy to reconsider it.


## Inspiration

- [Base122][base122] by Kevin Albertson
- [Wikipedia](https://en.wikipedia.org/wiki/Base64#Applications_not_compatible_with_RFC_4648_Base64) ("A UTF-8 environment can use non-synchronized continuation bytes as base64: `0b10xxxxxx`")


## License

- [Public domain](/LICENSE.md)
- [The Unicode map](/assets/unicode-map.png) is licensed [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) by [Nathan Reed](https://www.reedbeta.com/blog/programmers-intro-to-unicode/) (thanks!)



[^1]: Yes, it's perfectly [valid](https://www.unicode.org/faq/basic_q.html#12).
[^2]: Counting [terminal tofus](#self-delimiting-and-padding) and [noncharacter substitutes](#noncharacters).
[^3]: With Unicode's [Last Resort Font](https://github.com/unicode-org/last-resort-font/) used as a fallback font, a code point is a square with the number of its plane in a circle. Firefox uses a rectangle displaying the code point in hex. It has that binary feel to it. On Apple systems, GitHub's missing glyph looks like a block of tofu that has been sliced into 6 pieces.

[uuid]: https://datatracker.ietf.org/doc/html/rfc9562
[base122]: https://github.com/kevinAlbs/Base122
