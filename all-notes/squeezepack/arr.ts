import { TinyPack } from "./squeezepack.js"

const scores = new TinyPack()
scores.data = [30]
console.log(scores.at(0))
console.log(scores.data);