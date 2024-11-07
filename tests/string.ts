import { entofu, detofu } from '../entofu.ts'

let input = 'hello, world'

let encoded = entofu(input)
//=> '򚆕򬛆򼬈򇝯򜦱󀤀'

let output = detofu(encoded)
//=> 'hello, world'

let result = output === input
console.log(result ? '\x1b[32msuccess\t 🥳🎉🎊🪅\x1b[0m' : '\x1b[31mnot yet\t 🧐\x1b[0m')
