import { Tiny } from "./tiny.ts";

const scores = new Tiny('scores')
scores.data = [12,2,3,4,5,6,7,8,9,10]
console.log('Scores data:',scores.data.then(()=>{
    console.log('Compressed data: ',scores.state)
    console.log(scores.at(-2));
}));
console.log('Current scores state',scores.state);
scores.push(10);
console.log('Current scores state',scores.state);