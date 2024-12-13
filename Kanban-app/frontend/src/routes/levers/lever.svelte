<script module lang='ts'>
    import {writable} from 'svelte/store'
    export const Toplever = writable(false)
    export const Sidelever = writable(false) 
    export const Tasklever = writable([false])
    export const Indexlever = writable(0)
    export const TaskName = writable('')
    export const ReloadTask = writable(false)

    export function setIndex(index:number,bool:boolean) {
        Tasklever.update(array => {
            const newArray = [...array];
            newArray[index] = bool;
            return newArray; // Return the new array
        });
    }
</script>