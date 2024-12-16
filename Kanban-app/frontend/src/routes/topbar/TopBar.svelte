<script lang='ts'>
    import { onMount } from 'svelte';
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    import {Sidelever,TaskName,Tasklever,setIndex,ReloadTask} from '../levers/lever.svelte'
    

    let nameDisplay:string = $state('Select a board to view its info')
    let boards:BoardDefinition[] = $state([])
    let board:BoardDefinition = $state() as BoardDefinition
    let taskIndex:number = $state(0)
    let shouldDelete:boolean = $state(false)
    let {isTopBarOn} = $props();

    async function processResponse(response:Response):Promise<void> {
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    async function getSelectedBoard():Promise<void> {
        let response:Response = await fetch('http://localhost:3100/boards/loadSelectedBoard',{method:'GET'})
        await processResponse(response);
        board = await response.json()
        response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        await processResponse(response)
        boards = await response.json()
        TaskName.set(board.name);
        taskIndex = boards.findIndex(Board=>Board.name===board.name)
        shouldDelete = localStorage.getItem(`wasWindowOpenedat${taskIndex}`) === 'true'
        console.log('Should delete: ',shouldDelete);
        console.log('FAULTY NAME DISPLAY',nameDisplay);
    }
    function cancel() {
        shouldDelete = false
        localStorage.setItem(`wasWindowOpenedat${taskIndex}`,'')
        shouldDelete = localStorage.getItem(`wasWindowOpenedat${taskIndex}`) === 'true'
        console.log('Should delete from cancel',shouldDelete);
    }
    async function deleteBoard():Promise<void> {
        cancel()
        setIndex(taskIndex,false)
        let response:Response = await fetch(`http://localhost:3100/boards/delete/board/${nameDisplay}`,{method:'DELETE'})
        await processResponse(response)
        Sidelever.set(true)
        Sidelever.set(false)

        console.log('reached here')
        response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        await processResponse(response)
        boards = await response.json()
        ReloadTask.set(true)
        ReloadTask.set(false)
        if (boards.length) {
            let lastBoardName = boards.at(-1)?.name
            console.log(lastBoardName);
            nameDisplay = lastBoardName as string
            return
        }
        nameDisplay = 'Select a board to view its info'
    }
    function deleteForSure():void {
        console.log('Called delete button');
        shouldDelete = true
        console.log('from sure: ',shouldDelete);
        localStorage.setItem(`wasWindowOpenedat${taskIndex}`,'true')
    }
    async function addTask():Promise<void> {
        taskIndex = boards.findIndex(Board=>Board.name===board.name)
        console.log('Board index',taskIndex);
        setIndex(taskIndex,true)
    }
    $effect(()=>{
        let none = isTopBarOn
        getSelectedBoard()
        .then(() => {nameDisplay = board.name || 'Select a board to view its info'});
    })
</script>

<div class='flex bg-[#2e2e3a] text-white h-20 items-center w-[62rem] relative border border-[#2e2e3a]'>
    {#if (nameDisplay !==  'Select a board to view its info')}
        <h1 class='font-bold text-2xl absolute left-14'>{nameDisplay}</h1>
        <div class='flex absolute right-24 gap-8'>
            <button onclick={addTask} class='bg-[#8421bd] py-2 px-3 rounded-3xl font-[550] font-roboto'>+ Add new Task</button>
            <button onclick={deleteForSure} class='flex items-center gap-4'>
                <img class='w-5' src="/trash-can-regular.svg" alt="">
                <h1 class='text-[#ff5a5a]'>Delete this board</h1>
            </button>
        </div>
    {:else}
        <h1 class='font-bold text-xl absolute left-16'>{nameDisplay}</h1>
    {/if}
</div>
{#if (shouldDelete)}
    <div class='flex flex-col gap-3 justify-center items-center absolute left-[35vw] top-[35vh] text-white w-[40rem] bg-[#26262e] h-24 rounded-xl shadow-md z-20'>
        <h1 class='text-red-400 font-bold text-lg font-roboto'>Are you sure you want to delete the board; {board.name} ?</h1>
        <div class='flex gap-20'>
            <button onclick={deleteBoard} class='bg-[#f05050] py-1 px-5 rounded-xl font-[550] font-roboto'>Yes</button>
            <button onclick={cancel}>
                <img class='w-6' src="/circle-xmark-solid.svg" alt="">
            </button>
        </div>
    </div>
{/if}