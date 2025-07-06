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
function bisect_right(arr:number[], x:number,endIndex:number) {
    let startIndex:number = 0;
    while (startIndex < endIndex) {
        const mid = Math.floor((startIndex + endIndex)/2);
        if (x < arr[mid]) endIndex = mid
        else startIndex = mid + 1
    }
    return startIndex
}
export function choices(population:number[],weights:number[],numOfResults:number):number[] {//it will return an empty array if the weights are empty
    const cumWeights:number[] = accum(weights);
    const totalWeight = cumWeights[cumWeights.length-1];
    const results:number[] = [];
    for (let i=0;i<numOfResults;i++) {
        const lastIndex = population.length-1;
        const randomWeight = Math.random() * totalWeight;//declared under the loop formulti choice selection
        const num = population[bisect_right(cumWeights,randomWeight,lastIndex)];
        results.push(num);
    }
    return results;
}
const x = [1,2,3]
const y = choices(x,[1,1,1],2)
console.log("y: ",y);