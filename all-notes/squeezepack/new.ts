import { Tiny } from "./tiny.ts";

const scores = new Tiny('scores')
scores.data = [-22,-110,12,-16,-43,-9,12,-15]
scores.compress_safely()
console.log('at',scores.at(1));
console.log('Current scores state',scores.state);
console.log('Bytes',(scores.state as Int32Array).byteLength);

//Change the name to Better32,summarize the algorithm,try out using 15 digits per chunk and see how i can reverese the damage of the integer
//supports negative integers but it will increase the size of the compressed array because of the overhead of creating a new chunk to tell which integer is suppose to be negative