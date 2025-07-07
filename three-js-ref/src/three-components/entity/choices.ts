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
function bisectRight(arr:number[], x:number,endIndex:number) {
    let startIndex:number = 0;
    while (startIndex < endIndex) {
        const mid = Math.floor((startIndex + endIndex)/2);
        if (x < arr[mid]) endIndex = mid
        else startIndex = mid + 1
    }
    return startIndex
}
export function choices<T>(population:T[],weights:number[],numOfResults:number):T[] {//it will return an empty array if the weights are empty
    const cumWeights:number[] = accum(weights);
    const totalWeight = cumWeights[cumWeights.length-1];
    const results:T[] = [];
    for (let i=0; i < numOfResults; i++) {
        const lastIndex:number= population.length-1;
        const randomWeight:number = Math.random() * totalWeight;//declared under the loop formulti choice selection
        const num:T = population[bisectRight(cumWeights,randomWeight,lastIndex)];
        results.push(num);
    }
    return results;
}
export function choice<T>(population:T[]):T | null {
    if (population.length === 0) return null;
    const weights = new Array(population.length).fill(1);
    const singleChoice = choices(population,weights,1)[0]
    return singleChoice;
}

const x = [1,2,3]
const y = choices(x,[1,8,10],2)
console.log("y: ",y);

const z = choice([])
console.log(' :42 => z:', z);
