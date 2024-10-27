# □ Entofu

(Base524288)

A [binary-to-text encoding](https://en.wikipedia.org/wiki/Binary-to-text_encoding) that encodes binary data as [valid](https://www.unicode.org/faq/basic_q.html#12) unassigned Unicode code points, also known as [tofu](https://en.wiktionary.org/wiki/tofu#English:_undisplayable_character).

Binary data is stuffed into 524,288 code points of the [unassigned Unicode planes](https://en.wikipedia.org/wiki/Plane_(Unicode)#Unassigned_planes) 4 to 11. [^1]

That's the 8 empty planes in the middle of [the Unicode codespace](/assets/unicode-map.png), or almost half of Unicode.

Each 32-bit code point holds 19 bits of binary data, 1 in its first byte and 3 × 6 in its continuation bytes. [^2]

|        | 1st byte   | 2nd byte   | 3rd byte   | 4th byte   |
| ------ | ---------- | ---------- | ---------- | ---------- |
| Hex    | `F1`       | `8F`       | `BF`       | `80`       |
| Binary | `11110001` | `10001111` | `10111111` | `10000000` |
| Mask   | `111100__` | `10______` | `10______` | `10______` |

It's essentially embedding binary data inside valid Unicode text. [^3]


### Reference implementation

See [src/](./src/index.ts) for a simple reference implementation that's surprisingly small.

The encoder apparently works, the decoder needs work. Tests are also needed.


### Efficiency

Each character contains _~3×_ more data than Base64, making it visually compact. The price to pay is _~2×_ more overhead than Base64, relative to the original binary data (when stored in memory and on disk).

In other words, this is not suitable for large binaries if size matters.

But it's useful for encoding smaller binary data, such as UUIDs and hashes, where length matters.

#### Some theoretical numbers

|            | Base64   | Base524288  |
| ---------- | -------- | ----------- |
| Efficiency | 75%      | 59.375%     |
| Overhead   | 33.333%  | 68.4210526% |
| Length     | 133.333% | 42.1052632% |

Actual numbers will vary depending on the amount of padding.


### Textual representation

Each unassigned code point will be [displayed](https://www.unicode.org/faq/unsup_char.html) as a _missing glyph_ – that is, a [tofu](https://en.wiktionary.org/wiki/tofu#English:_undisplayable_character) – which differs by system and [font](https://learn.microsoft.com/en-us/typography/opentype/spec/recom#glyph-0-the-notdef-glyph). [^4]

Unlike many base encodings, the encoded text doesn't contain characters that have special meaning in coding languages and protocols. And unlike the related [Base122](#inspiration), it doesn't contain characters that make keyboard navigation, selection and copy/paste difficult. Tofus are unproblematic.

That said, tofus aren't exactly typable. And they're only vaguely readable if the code points are displayed, like in Firefox. Otherwise, it's all tofu.

### Examples

| Input   | Output                      | Length   | Size in UTF-8      |
| ------- | --------------------------- | -------- | ------------------ |
| 128-bit | 򂓧򒳫񴮕񯐨򼶘񅼍򈦠                     | 7 tofus  | 224 bits (175%)    |
| 256-bit | 򏘲񭯸򡋒񅉚񈭼򛬚񛊌򡡴񛕱򥕩򯿖򞞨񂔜򰠀              | 14 tofus | 448 bits (175%)    |
| 512-bit | 򱞂򶭼񰈶򫺬򞗅򧤝򵿕򊓱񎳱񭾡񁿄򮚗񳶂򞥵񰈣񼸇򱟆򐗑񍰒򠂸򵣬񆢱񙂙񇍁񙧠񥬷񫛞 | 27 tofus | 864 bits (168.75%) |


### Comparisons

Compared to popular binary-to-text encodings of UUIDs…

| Encoding     | Output                               | Length            | Size in UTF-8     |
| ------------ | ------------------------------------ | ----------------- | ----------------- |
| Base16       | 90f119cf-9fc4-4090-acc2-0000bc711dc3 | 36 chars (225%)   | 288 bits (225%)   |
| Base64       | kPEZz5/EQJCswgAAvHEdww               | 22 chars (137.5%) | 176 bits (137.5%) |
| Base524288   | 򩦠򄢧򮨲񞌶񒧼񳓜񶄠                              | 7 tofus (43.75%)  | 224 bits (175%)   |

Base524288 encoded UUIDs are:
- **Almost _¾_ the size of the standard UUID format**
- Almost _1¼_ the size of the Base64 encoding

In a monospaced typeface, they are:
- Less than _⅕_ the length of the standard UUID format
- Less than _⅓_ the length of the Base64 encoding

In a proportional typeface, they are:
- About _⅓_ the length of the standard UUID format
- About _½_ the length of the Base64 encoding


### Noncharacters

Unicode reserves the last two code points of each plane as [noncharacters](https://www.unicode.org/faq/private_use.html#noncharacters) – characters that don't want to be characters.

When encoding, any noncharacters that appear must therefore be replaced with their respective substitute code points.

Special tofu:
- `U+4FFFE` ⟷ `U+C03FE`
- `U+4FFFF` ⟷ `U+C03FF`
- `U+5FFFE` ⟷ `U+C07FE`
- `U+5FFFF` ⟷ `U+C07FF`
- `U+6FFFE` ⟷ `U+C0BFE`
- `U+6FFFF` ⟷ `U+C0BFF`
- `U+7FFFE` ⟷ `U+C0FFE` ☕️
- `U+7FFFF` ⟷ `U+C0FFF`
- `U+8FFFE` ⟷ `U+C23FE`
- `U+8FFFF` ⟷ `U+C23FF`
- `U+9FFFE` ⟷ `U+C27FE`
- `U+9FFFF` ⟷ `U+C27FF`
- `U+AFFFE` ⟷ `U+C2BFE`
- `U+AFFFF` ⟷ `U+C2BFF`
- `U+BFFFE` ⟷ `U+C2FFE`
- `U+BFFFF` ⟷ `U+C2FFF`

When decoding, any substitute code points encountered must be replaced with their respective noncharacters before reading their binary data.


### Inspiration

- [Base122](https://blog.kevinalbs.com/base122) by Kevin Albertson
- [Wikipedia](https://en.wikipedia.org/wiki/Base64#Applications_not_compatible_with_RFC_4648_Base64)

---

- [assets/unicode-map.png](/assets/unicode-map.png) is licensed [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) by [Nathan Reed](https://www.reedbeta.com/blog/programmers-intro-to-unicode/). Thanks!


[^1]: Plus 16 substitute code points in plane 12, see [Noncharacters](#noncharacters).
[^2]: It looks like 20 bits, but the first two places represent one bit, alternating between `01` and `10`, so that it uses the correct planes. `11` is used for [noncharacter substitutes](#noncharacters).
[^3]: Or making vegan tofu omelette without breaking any eggs.
[^4]: I like the glyph used by Firefox, a rectangle displaying the code point in hex. It has that binary feel to it. I also like GitHub's glyph. It looks like a block of tofu that has been sliced into 6 pieces.
