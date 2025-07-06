from itertools import accumulate as _accumulate, repeat as _repeat
from bisect import bisect as _bisect
import random as Random


def accum(weights:list[int]) -> list[int]:
    accumList:list[int] = []
    for [index,num] in enumerate(weights):
        if (index == 0):
            accumList.append(num)
        else:
            prevIndex:int = index - 1
            accumList.append(num + accumList[prevIndex])
    print('Accum list: ',accumList)
    return accumList
    
def choices(population:list[int], weights:list[int],k:int=1):
    n = len(population)
    cum_weights = accum(weights)
    
    total = cum_weights[-1] + 0.0   # convert to float
    bisect = _bisect
    hi = n - 1
    final:list[int] = []
    
    for _ in _repeat(None, k):
        num:int = population[bisect(cum_weights,Random.random() * total, 0, hi)]
        final.append(num)
        
    return final

x:list[int] = [1,2,3]
y = choices(x,[4,7,10],2)
print(y)
