# □ Entofu

[![License](https://img.shields.io/badge/license-public_domain-green?color=0fb46e)](./LICENSE.md)
![Status](https://img.shields.io/badge/status-alpha-orange)

A [binary-to-text encoding](https://en.wikipedia.org/wiki/Binary-to-text_encoding) that encodes binary data as unassigned Unicode code points, also known as [tofu][tofu].

Entofu stuffs binary data into 262,144 tofus of Unicode planes 8 to 11 – the empty planes in the middle of [the vast Unicode codespace][unicode-map]. It lets you embed binary data inside valid Unicode text, making tofu omelette without breaking any eggs so to speak. [^1]

Alternatively, it's a Base262144 encoding that uses almost half of Unicode as its alphabet. [^2]

It is less [efficient](#efficiency) but much shorter (and better looking [^3]) than common encodings like Base64 and Base85.

| Bits | Output                        | Length | Size               |
| ---- | ----------------------------- | ------ | ------------------ |
| 128  | 򀂘򡶢򝁉򛣤򋡷򱻧򑬍󁀐                      | 8      | 256 bits (2×)      |
| 256  | 򡙘򾧙򸁠򒗤򓮨򩻑򊰟򂌦򊻑򛽈򾝦򈖮򯴐򄻱󁀔               | 15     | 480 bits (1.875×)  |
| 512  | 򺔴򆟮򫪕򮐓򐬡򝗮򔈼򑻄򇨋򡒼򮈢򟠐򉉚򚋅򹕾򼛲򷮐򳚱򊰅򽍿򒮖򉂠򨺡򀅢򘞷򷶏򶰶򴐼󀗠 | 29     | 928 bits (1.8125×) |


## JavaScript library

[![Dependencies](https://img.shields.io/badge/dependencies-none-0fb46e)](./package.json)
![Maintenance](https://img.shields.io/maintenance/yes/2025?color=0fb46e)
[![NPM](https://img.shields.io/npm/v/entofu)][npm]
<!-- [![JSR](https://img.shields.io/jsr/v/%40joakim/entofu)][jsr] -->

This library also serves as the reference implementation of the algorithm (see [entofu.ts](./entofu.ts)).

### Status

Alpha. The algorithm is fully implemented and [seems to be](./tests/) correct, but has not yet been thoroughly tested.

Next: Write a test suite.

### Usage

Install [`entofu`][npm] using your package manager of choice.<!--from npm, alternatively [`@joakim/entofu`][jsr] from jsr. The code below assumes npm.-->

To encode/decode binary data, use `stringify` and `parse`:

```js
import { stringify, parse } from 'entofu'

let input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]

let tofus = stringify(input)
//=> '򀐈򃁀򔆁񰠉'

let output = parse(tofus)
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
```

To encode/decode strings, use `entofu` and `detofu`:

```js
import { entofu, detofu } from 'entofu'

let input = 'hello, world'
//=> 'hello, world'

let tofus = entofu(input)
//=> '򚆕򬛆򼬈򇝯򜦱󀤀'

let output = detofu(tofus)
//=> 'hello, world'
```

These functions rely on JavaScript's [Encoding API](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API) to convert between UTF-8 and UTF-16. While this is widely supported, should the JavaScript runtime not support [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) and [`TextDecoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder), use the underlying `encode` and `decode` functions instead to work directly with byte arrays:

```js
import { encode, decode } from 'entofu'

let input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]

let bytes = encode(input)
// Uint8Array(16) [ 242, 128, 144, 136, 242, 131, 129, 128, 242, 148, 134, 129, 241, 176, 160, 137 ]

let output = decode(bytes)
//=> Uint8Array(9) [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
```

## Efficiency

Each 32-bit code point can hold 18 (3 × 6) bits of binary data in its continuation bytes:

|        | 1st byte   | 2nd byte   | 3rd byte   | 4th byte   |
| ------ | ---------- | ---------- | ---------- | ---------- |
| Binary | `11110010` | `10001111` | `10111111` | `10000000` |
| Mask   | `11110010` | `10______` | `10______` | `10______` |

Tofus contain _3×_ more data than Base64 characters, making it visually much smaller. This comes at a cost of more overhead and larger size of the encoded data in storage (memory or disk).

That makes it not suitable for large binaries if _size_ matters, but useful for smaller binaries like UUIDs and hashes, where _length_ matters.

### Theoretical numbers

Entofu falls between Base16 and Base32 in size efficiency, while only a fraction of the length.

|                                 | Original | Base16 | Base32 | Base64 | Base262144 (Entofu) |
| ------------------------------- | -------- | ------ | ------ | ------ | ------------------- |
| Size <sup>Ⅰ</sup>               | 1×       | 2×     | 1.6×   | 1.333× | 1.777×              |
| Size efficiency <sup>Ⅱ</sup>   | 100%     | 50%    | 62.5%  | 75% ★  | 56.25%              |
| Length <sup>Ⅲ</sup>           | 1×       | 2×     | 1.6×   | 1.333× | 0.444×              |
| Length efficiency <sup>Ⅳ</sup> | 100%     | 50%    | 62.5%  | 75%    | 225% ★              |

<sup>Ⅰ) Ratio between output bits and input bits, showing inflation in size (lower is better).</sup>\
<sup>Ⅱ) The inverse ratio, showing the size efficiency as a percentage (higher is better).</sup>\
<sup>Ⅲ) Ratio between bits per input byte (8) and data bits per output code point, measuring the difference in length (lower is better).</sup>\
<sup>Ⅳ) The inverse ratio, illustrating the length efficiency as a percentage (higher is better).</sup>

### Actual numbers

UUIDs actually represent the worst case, with the last tofu only encoding 2 bits. It is still smaller in size than the typical UUID string. In length, it is by far the shortest encoding.

| Encoding         | Output                               | Length    | Size               |
| ---------------- | ------------------------------------ | --------- | ------------------ |
| [RFC 9562][uuid] | 90f119cf-9fc4-4090-acc1-0000bc711dc3 | 36 chars  | 288 bits (2.25×)   |
| Base16           | 90f119cf9fc44090acc10000bc711dc3     | 32 chars  | 256 bits (2×)      |
| Base32           | j3rhkkwzrh091b61000brw8xrc           | 26 chars  | 208 bits (1.625×)  |
| Base64           | kPEZz5_EQJCswQAAvHEdww               | 22 chars  | 176 bits (1.375×)  |
| Base85           | ORX47T>X!VXMFl:]Q"t0                 | 20 chars  | 160 bits (1.25×) ★ |
| Entofu           | 򐜟򀟫򑔘򁃡򖗳򭄝򩸯󁀰                             | 8 tofus ★ | 256 bits (2×)      |


## Textual representation

Each unassigned code point will be [displayed](https://www.unicode.org/faq/unsup_char.html) as a _missing glyph_ – that is, a [tofu][tofu] – which differs by [font](https://learn.microsoft.com/en-us/typography/opentype/spec/recom#glyph-0-the-notdef-glyph). By changing the font, you can change the appearance of tofus. If a font doesn't provide a _missing glyph_, a [fallback font](https://en.wikipedia.org/wiki/Fallback_font) that does may be used. [^4] It's possible to make a custom fallback font for tofus to control its appearance.

Unlike many base encodings, Entofu does not produce any characters that have special meaning in code or protocols. And unlike the related [Base122][base122], it doesn't produce characters that make selection, keyboard navigation and copy/paste difficult. Tofus are relatively unproblematic.

That said, they're not exactly typable, and they're only readable if the _missing glyph_ displays some information about the code point. Otherwise it's all tofu.


## Particularities

### Terminals

The last tofu of the encoded output is a distinct terminal tofu that handles padding, making it a self-delimiting encoding. Terminal tofus use the unassigned planes 12 and 4-7, above and below the planes used for regular tofus (8-11).

The two least significant bits of the leading byte are used as [bitwise flags](./assets/bitwise-terminals.png) for the type of tofu (regular/terminal/noncharacter), resulting in the planes used and the 18 bits available for data.


### Noncharacters

Unicode reserves the last two code points of each plane as [noncharacters](https://www.unicode.org/faq/private_use.html#noncharacters) intended for internal use.

Any noncharacters produced when encoding must therefore be converted to substitute code points in plane 13.

When decoding, any substitute code points must be converted back to their respective noncharacters before reading their binary data.

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

The code points are converted back and forth by [bitwise operations](./assets/bitwise-noncharacters.png), yielding the sequence above.

(These substitutes are still unassigned code points used to represent binary data, in this case 15-18 consecutive `1` bits. Entofu does not assign any meaning, they're merly stand-ins for noncharacters by necessity, as the upper planes include the Special-purpose and Private Use Area planes that may not be used.)


## Rarely Asked Questions

**Is it future-proof?**

> Planes 4-13 are not on any [Unicode roadmaps](https://unicode.org/roadmaps/) as of 2024. But some day, some tofus will inevitably be assigned a character and cease to be tofu. Any whitespace characters, combining characters, format characters or control characters would be problematic, as would normalization (see [qntm's excellent explanation](https://qntm.org/safe)).
>
> That said, the tofu planes have been selected so that there's a buffer of one unassigned plane on each side (3 and 13). Unicode grows very slowly, at a rate of ~4487 characters per year on average since 2014, so Entofu should be usable for quite some time into the future.
>
> But because I can't predict the future, I can't offer any guarantees. If long-term future-proofing is a requirement, I'd recommend [Base65536][base65536] or [Base32768][base32768] instead. If the time horizon is less than several decades, I'd be fine with using Entofu.

**Why did you make an encoding that's less size efficient than Base64?**

> Because size efficiency isn't the only metric. Length, appearance and ease of use can be just as important, if not more important. Storage is cheap, screen estate is not. Still, the size efficiency isn't all that bad, it's better than hexadecimal and the standard UUID text format.

**Shouldn't an encoding use readable and typable characters?**

> How often do you read or write hashes by hand? Unless a paper backup is required, I think it's more important that the encoding be easy to copy/paste and use in various contexts. That and the short length are the strengths of this encoding. And the name.

**Can't you up the ante and use Base524288 with 19 bits per tofu?**

> Tried it, and I don't think it's worth it. It complicates the algorithm, negatively affecting performance and room for optimization, and is just not worth the ~5% gain in efficiency. The length would often be the same as Base262144 anyway, due to padding needing an extra tofu in some cases, as the lead byte can't be used for flags.


## Inspiration

- [Base122][base122] by Kevin Albertson
- [Wikipedia](https://en.wikipedia.org/wiki/Base64#Applications_not_compatible_with_RFC_4648_Base64) ("A UTF-8 environment can use non-synchronized continuation bytes as base64: `0b10xxxxxx`")

I was not aware of [Base65536][base65536] and [Base32768][base32768] until after having made this, but I think they're brilliant if you need a future-proof encoding that looks like gibberish. Especially Base32768 if all you have is UTF-16.


## License

[Public domain](/LICENSE.md), except the following files:
- [assets/unicode-map.png][unicode-map] licensed [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) by [Nathan Reed](https://www.reedbeta.com/blog/programmers-intro-to-unicode/) (thanks!)
- [tests/utils/uuid.ts](./tests/utils/uuid.ts) licensed [MIT](https://github.com/uuidjs/uuid/blob/main/LICENSE.md) by contributors to [uuidjs](https://github.com/uuidjs/uuid) (thanks!)



[^1]: Yes, it's perfectly [valid](https://www.unicode.org/faq/basic_q.html#12). However, see [the first question](#rarely-asked-questions).
[^2]: Counting [terminal tofus](#terminals) and [noncharacter substitutes](#noncharacters).
[^3]: Depending on the font used. By changing the font, you can control its [appearance](#textual-representation).
[^4]: With Unicode's [Last Resort Font](https://github.com/unicode-org/last-resort-font/) used as a fallback font, a code point is a square with the number of its plane in a circle. Firefox uses a rectangle displaying the code point in hex. It has that binary feel to it. In Apple's system fonts, the missing glyph looks like a block of tofu that has been sliced into 6 pieces.

[npm]: https://www.npmjs.com/package/entofu
[jsr]: https://jsr.io/@joakim/entofu
[tofu]: https://en.wiktionary.org/wiki/tofu#English:_undisplayable_character
[uuid]: https://datatracker.ietf.org/doc/html/rfc9562
[base122]: https://github.com/kevinAlbs/Base122
[base32768]: https://github.com/qntm/base32768
[base65536]: https://github.com/qntm/base65536
[unicode-map]: ./assets/unicode-map.png
