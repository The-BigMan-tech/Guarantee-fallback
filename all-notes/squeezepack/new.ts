import { Tiny } from "./tiny.ts";

const scores = new Tiny('scores',true)
scores.data = [22,2345678910]
console.log('Scores data:',scores.data.then(()=>{
    console.log('Compressed data: ',scores.state)
    console.log(scores.at(-1));
}));
console.log('Current scores state',scores.state);
await scores.push(10);
console.log('Current scores state',scores.state);