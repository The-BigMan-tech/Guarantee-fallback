import { TinyPack } from "./squeezepack.ts"

const scores = new TinyPack()
scores.data = [1111111111]
scores.compress()
scores.push(100000000000)
scores.push(13)
console.log(scores.at(-1));