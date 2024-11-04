import { entofu, detofu } from '../mod.ts'

let data = await Bun.file('./assets/unicode-map.png').bytes()
let encoded = entofu(data)
let decoded = detofu(encoded)

console.log(Buffer.from(data).equals(decoded) ? '🥳' : '🧐')
