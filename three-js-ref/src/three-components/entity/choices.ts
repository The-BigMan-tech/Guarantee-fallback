function accum(weights:number[]):number[] {
    const accumList:number[] = []
    for (const [index,num] of weights.entries()) {
        const prevIndex:number = index - 1;
        if (index == 0) accumList.push(num)
        else accumList.push(num + accumList[prevIndex])
    }
    console.log('Accum list: ',accumList)
    return accumList
}
function bisect_right(arr:number[], x:number,hi:number) {
    let lo:number = 0;
    while (lo < hi) {
        const mid = Math.floor((lo + hi)/2);
        if (x < arr[mid]) hi = mid
        else lo = mid + 1
    }
    return lo
}
export function choices(population:number[],weights:number[],numOfResults:number):number[] {//it will return an empty array if the weights are empty
    const cum_weights:number[] = accum(weights);
    const totalCum = cum_weights.at(-1);
    if (totalCum) {
        const results:number[] = [];
        for (let i=0;i<numOfResults;i++) {
            const lastIndex = population.length-1;
            const num = population[bisect_right(cum_weights,Math.random() * totalCum,lastIndex)];
            results.push(num);
        }
        return results;
    }
    return [];
}
const x = [1,2,3]
const y = choices(x,[1,10,5],2)
console.log("y: ",y);