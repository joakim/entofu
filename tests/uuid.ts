import { randomUUID } from 'node:crypto'
import { encode, decode } from '../entofu.ts'
import * as uuid from './utils/uuid.ts'

// Who needs a test runner?

// UUID string
let input = randomUUID()
console.log('input\t', input)

// UUID binary
let binary = uuid.parse(input)
console.log('binary\t', binary)

// Tofu encoded binary
let encoded = encode(binary)
console.log('encoded\t', encoded)

// Tofu decoded binary (should be identical to input)
let decoded = decode(encoded)
console.log('decoded\t', decoded)

// UUID string
let output = uuid.stringify(decoded)
console.log('output\t', output)

let outcome = output === input ? '\x1b[32msuccess\t 🥳🎉🎊🪅\x1b[0m' : '\x1b[31mnot yet\t 🧐\x1b[0m'
console.log(outcome)

// Alright, now that it works I should write some real tests…
