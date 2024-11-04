import { randomUUID } from 'node:crypto'
import { entofu, detofu } from '../index.ts'
import { parse, stringify } from './utils/uuid.ts'

// Who needs a test runner?

// UUID string
let uuid = randomUUID()
console.log('uuid\t', uuid)

// UUID binary
let binary = parse(uuid)
console.log('binary\t', binary)

// Tofu encoded binary
let encoded = entofu(binary)
console.log('encoded\t', encoded)

// Tofu string
let string = new TextDecoder('utf8').decode(encoded)
console.log('string\t', string)

// Tofu decoded binary (should be identical to input)
let decoded = detofu(encoded)
console.log('decoded\t', decoded)

// UUID string
let uuid2 = stringify(decoded)
console.log('uuid2\t', uuid2)

let outcome = uuid2 === uuid ? '\x1b[32msuccess\t 🥳🎉🎊🪅\x1b[0m' : '\x1b[31mnot yet\t 🧐\x1b[0m'
console.log(outcome)

// Alright, now that it works I should write some real tests…
