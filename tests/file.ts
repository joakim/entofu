import { stringify, parse } from '../entofu.ts'

let input = await Bun.file('./assets/unicode-map.png').bytes()
let tofus = stringify(input)
let output = parse(tofus)

let result = Buffer.from(input).equals(output)
console.log(result ? '\x1b[32msuccess\t 🥳🎉🎊🪅\x1b[0m' : '\x1b[31mnot yet\t 🧐\x1b[0m')
