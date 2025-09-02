import { Observable, Subscription } from "rxjs";

interface MyAsyncIterator<T> {
    next(): Promise<IteratorResult<T>>;
    return?(): Promise<IteratorResult<T>>;
    throw?(e?: any): Promise<IteratorResult<T>>;
}

export interface CustomAsyncIterable<T> {
    [Symbol.asyncIterator](): MyAsyncIterator<T>;
}

export async function consumeAsyncIterable<T>(asyncIterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const item of asyncIterable) {
        result.push(item);
    }
    return result;
}

export function observableToAsyncGen<T>(observable: Observable<T>): CustomAsyncIterable<T> {
    const queue: IteratorResult<T>[] = [];
    let subscription: Subscription | null = null;
    let nextValueResolver: ((value: IteratorResult<T>) => void) | null = null;
    let doneResolver: (() => void) | null = null;
    let errorRejecter: ((error: any) => void) | null = null;
    let isDone = false;

    const asyncIterator: MyAsyncIterator<T> = {
        async next(): Promise<IteratorResult<T>> {
            if (queue.length) {
                return queue.shift()!;
            }
            if (isDone) {
                return { value: undefined, done: true };
            }
            return new Promise<IteratorResult<T>>((resolve, reject) => {
                nextValueResolver = resolve;
                errorRejecter = reject;
                doneResolver = ():void => {
                    isDone = true;
                    resolve({ value: undefined, done: true });
                };
            });
        },

        async return(): Promise<IteratorResult<T>> {
            if (subscription) {
                subscription.unsubscribe();
            }
            isDone = true;
            if (doneResolver) {
                doneResolver();
            }
            return { value: undefined, done: true };
        },

        async throw(error?: any): Promise<IteratorResult<T>> {
            if (subscription) {
                subscription.unsubscribe();
            }
            isDone = true;
            if (errorRejecter) {
                errorRejecter(error);
            }
            return { value: undefined, done: true };
        },
    };

    subscription = observable.subscribe({
        next: (value) => {
            if (nextValueResolver) {
                nextValueResolver({ value, done: false });
                nextValueResolver = null;
            } else {
                queue.push({ value, done: false });
            }
        },
        error: (err) => {
            if (errorRejecter) {
                errorRejecter(err);
                errorRejecter = null;
            }
            isDone = true;
        },
        complete: () => {
            if (doneResolver) {
                doneResolver();
                doneResolver = null;
            }
            isDone = true;
        },
    });

    const asyncIterable:CustomAsyncIterable<T> = {
        [Symbol.asyncIterator]: () => asyncIterator,
    };

    return asyncIterable;
}