import { entofu, detofu } from '../entofu.ts'

let input = 'hello, world'

let encoded = entofu(input)
//=> '򚆕򬛆򼬈򇝯򜦱󀤀'

let output = detofu(encoded)
//=> 'hello, world'

console.log(input, '===', output)
console.log(input === output ? '🥳' : '🧐')
