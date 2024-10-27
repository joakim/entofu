import { getRandomValues } from 'node:crypto'
import { entofu, detofu } from '../src'

let decoder = new TextDecoder('utf8')

let uuid = getRandomValues(new Uint8Array(16))
console.log(uuid)

let tofu = entofu(uuid)
console.log(tofu)

let text = decoder.decode(tofu)
console.log(text)

let binary = detofu(tofu)
console.log(binary)
