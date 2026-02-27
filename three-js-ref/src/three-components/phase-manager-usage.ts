import { Guard } from "./phase-manager";
import * as THREE from "three";

const start = performance.now();

Guard.setMode('prod');


const dummyFetch = async (value:number) => value*2;

const x = new Guard(10).async().cleanup(async draft=>{ draft.value=0 });
const y = x.readonly();

await x.transition('READ');
console.log(await x.snapshot());

await x.transition('UPDATE');
await x.update(async draft=>{
    draft.value = await dummyFetch(draft.value);
    draft.value += await dummyFetch(draft.value);
});
await x.update(async draft=>{
    draft.value += 2;
});

await x.transition('READ');//you loose the fluent chaining syntax when using an async guard
console.log(await x.snapshot());
console.log(await y.snapshot());

await x.transition('CLEAR');
// console.log(await y.snapshot());//this will throw an error as y cant be used when x isnt in the read phase

await x.transition('READ');
console.log(await x.snapshot());




//Custom class example
const vec = new Guard(new THREE.Vector3(0,10,0)).sync()
    .cleanup(draft=>{ draft.value.set(0,0,0) });

const initVec = vec.transition('READ').snapshot();

vec.transition('UPDATE').update(draft=>{
    draft.value.addScalar(10)
});
console.log('init vec: ',initVec);//this vec is a snapshot and unaffected by subsequent mutations
console.log('current vec: ',vec.transition('READ').snapshot());

vec.transition('CLEAR');
console.log('cleared vec: ',vec.transition('READ').snapshot());



//Primitive State
const flag = new Guard(10).sync()
    .cleanup(draft=>{ draft.value=0 });

console.log(flag.phase);

let externalNum = 10;

flag.write(draft=>{//write is the first phase.
    draft.value += 50;//reassigning the ref to a new value is allowed if its a primitive
    externalNum = draft.value;//primitives can be copied out of the guarded scope even before the guard allows the value to be read externally.This is safe cuz they are passed by value.
})
console.log('escaped primitive: ',externalNum);//logs 60.but try to keep mutations under guarded operations.even for primitives

const currentFlag = flag.transition('READ').snapshot();//It is mandatory to acknowledge the data.Else,proceeding to update will throw an error
console.log("Current flag acknowledged:",currentFlag);

const someIO = async (value:number) => value**2;
const newValue = await someIO(currentFlag);

flag.transition('UPDATE').update(draft=>{ draft.value = newValue });//Fetching async data outside the guard is a sync alternative to the async guard.use when possible for speed.
console.log("Updated flag from fetch:",flag.transition('READ').snapshot());

flag.transition('CLEAR');//automatically calls the stateless clear function that was set in the beginning

flag.transition('READ');//we must transition to read to see the value cuz after clear is a write.
console.log('Cleared flag: ',flag.snapshot());



//Native object state
let externalSet:Set<string> = new Set();

const grades = new Guard(new Set(['A','B','C','D','E','F'])).sync()
    .cleanup(draft=>{ draft.value.clear() });

grades.write(draft=>{//reassignment to a new set is forbidden
    draft.value.add('A+');
    draft.value.add('B-');
    externalSet = draft.value//non-primitives cant be copied out of the guarded scope.the draft is revoked.so you cant read the value externally unless the guard allows you to read it
});
console.log('Escaped reference: ',externalSet);

console.log('Current grades',grades.transition('READ').snapshot());

grades.transition('CLEAR');


//Using the clear all method
const a = new Guard(10).sync().cleanup(draft=>{ draft.value=0 });
const b = new Guard(20).sync().cleanup(draft=>{ draft.value=0 });
const c = new Guard(30).sync().cleanup(draft=>{ draft.value=0 });

console.log('Before clears: ',
    a.transition('READ').snapshot(),
    b.transition('READ').snapshot(),
    c.transition('READ').snapshot()
);

Guard.clearAll(a,b,c);//better than redundant calls to transition if they will be cleared at the same time

console.log('After clears: ',
    a.transition('READ').snapshot(),
    b.transition('READ').snapshot(),
    c.transition('READ').snapshot()
);


// i encourage to do this instead if many states have identical lifecycles
const nums = new Guard({
    a:10,
    b:20,
    c:30
}).sync()

console.log('grouped states: ',nums.transition('READ').snapshot());
nums.transition('CLEAR');


//Native foreign class
const xy = new Guard(new Date()).sync()

console.log(xy.transition('READ').snapshot().getTime());//it doesnt throw an error on read because the object is never visited on the draft.Using the Guard like this is especially useful as a dev-time Object.freeze 

// xy.transition('UPDATE').update(draft=>{//but u cant write to it.it will throw an error
//     draft.value.getTime();
// })


const end = performance.now();
console.log('\nFinished in ',end-start,' milliseconds');

