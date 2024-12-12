<script lang='ts'>
    import { onMount } from "svelte";
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    let board:BoardDefinition = $state() as BoardDefinition

    onMount(async ()=>{
        const response:Response = await fetch('',{method:'GET'})
        board = await response.json()
        console.log(board);
    })
</script>

<div class='flex bg-[#2e2e3a] text-white h-20 items-center w-[62rem] relative border border-[#2e2e3a]'>
    <h1 class='font-bold text-2xl ml-20'>Platform Launch</h1>
    <button class='absolute right-56 bg-[rgb(100,94,197)] py-2 px-4 rounded-3xl'>+ Add new Task</button>
    <button class='absolute right-24'>
        <h1>Delete this board</h1>
    </button>
</div>