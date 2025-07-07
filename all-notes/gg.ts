const x = {a:10}
const y = Object.values(x)

console.log(y);
x.a = null
console.log(y);