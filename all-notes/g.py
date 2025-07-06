import random as Random
from math import floor


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

def bisect_right(a:list[int], x:float,hi:int):
    lo:int = 0
    while lo < hi:
        mid = floor((lo + hi)/2)
        if x < a[mid]: hi = mid
        else: lo = mid + 1
    return lo


def choices(population:list[int], weights:list[int],k:int=1):
    n = len(population)
    cum_weights = accum(weights)
    
    total = cum_weights[-1]
    final:list[int] = []
    
    for _ in range(0,k):
        num2:int = population[bisect_right(cum_weights,Random.random() * total,n-1)]
        final.append(num2)
    return final

x:list[int] = [4,2,3]
y = choices(x,[15,7,10],2)
print(y)
