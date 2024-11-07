import { stringify, parse } from '../entofu.ts'

let input = await Bun.file('./assets/unicode-map.png').bytes()
let tofus = stringify(input)
let output = parse(tofus)

console.log('input === output')
console.log(Buffer.from(input).equals(output) ? '🥳' : '🧐')
