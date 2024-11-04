import { entofu, detofu } from '../index.ts'

let data = await Bun.file('./assets/unicode-map.png').bytes()
let encoded = entofu(data)
let decoded = detofu(encoded)

console.log(Buffer.from(data).equals(decoded) ? '🥳' : '🧐')
