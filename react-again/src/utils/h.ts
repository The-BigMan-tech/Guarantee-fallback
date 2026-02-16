function avg(...args:number[]):number {
    const sum:number = (args.reduce((prev,current)=>prev + current));
    const average:number = Number((sum/args.length).toFixed(2));
    return average;
}
function min(...args:number[]):number {
    let smallest:number = args[0];
    for (const num of args) {
        if (num < smallest) smallest = num;
    }
    return smallest;
}
console.log(avg(1,2,5));
console.log(min(9,3,8));