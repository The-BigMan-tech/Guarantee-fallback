import { Small32 } from "./tiny.ts";

const scores = new Small32('scores',true);
scores.data = [0,-1111111111,100000000000,24,88,998,1999,1011,1111,233,-9887]
console.log('Is compressed(Should not compress yet)',scores.is_compressed);
//Its when you use the data,that it will trigger the compression
console.log('Current score data',scores.data.then(()=>{
    console.log('Compressed data',scores.state);
    console.log('Is compressed',scores.is_compressed);
}));
console.log('Is compressed(Should not compress yet)',scores.is_compressed);
console.log('element 1',scores.at(0));
console.log('Is compressed(Should not compress yet)',scores.is_compressed);

//Change the name to Better32,summarize the algorithm,try out using 15 digits per chunk and see how i can reverese the damage of the integer
//supports negative integers but it will increase the size of the compressed array because of the overhead of creating a new chunk to tell which integer is suppose to be negative
//*My algorithm now supports arrays of any integers whether negative or not