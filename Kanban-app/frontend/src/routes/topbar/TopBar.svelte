<script lang='ts'>
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    import {Sidelever,Tasklever} from '../levers/lever.svelte'

    let nameDisplay:string = $state('Select a board to view its info')
    let boards:BoardDefinition[] = $state([])
    let board:BoardDefinition = $state() as BoardDefinition
    let {isTopBarOn} = $props()

    async function processResponse(response:Response):Promise<void> {
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    async function getSelectedBoard():Promise<void> {
        let response:Response = await fetch('http://localhost:3100/boards/loadSelectedBoard',{method:'GET'})
        processResponse(response);
        board = await response.json()
        response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        processResponse(response)
        boards = await response.json()
    }
    async function deleteBoard():Promise<void> {
        let response:Response = await fetch(`http://localhost:3100/boards/delete/board/${nameDisplay}`,{method:'DELETE'})
        await processResponse(response)
        Sidelever.set(true)
        Sidelever.set(false)

        console.log('reached here')
        response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        processResponse(response)
        boards = await response.json()
        if (boards.length) {
            let lastBoardName = boards.at(-1)?.name
            console.log(lastBoardName);
            nameDisplay = lastBoardName as string
            return
        }
        nameDisplay = 'Select a board to view its info'
    }
    async function addTask():Promise<void> {
        let taskIndex = boards.findIndex(Board=>Board.name===board.name)
        console.log('Board index',taskIndex);
        if ($Tasklever) {
            Tasklever.set(false)
            return
        }
        Tasklever.set(true)
    }
    $effect(()=>{
        let none = isTopBarOn
        getSelectedBoard()
        .then(() => nameDisplay = board.name);
    })
</script>

<div class='flex bg-[#2e2e3a] text-white h-20 items-center w-[62rem] relative border border-[#2e2e3a]'>
    {#if (nameDisplay !==  'Select a board to view its info')}
        <div class='flex items-center relative top-4 left-12 w-28 h-6'>
            <img class='w-28' src="/laps.svg" alt="">
            <h1 class='font-bold relative bottom-4 right-20'>{nameDisplay}</h1>
        </div>
        <div class='flex absolute right-24 gap-8'>
            <button onclick={addTask} class='bg-[#251e4f] py-3 px-4 rounded-3xl'>+ Add new Task</button>
            <button onclick={deleteBoard} class='flex items-center gap-4'>
                <img class='w-5' src="/trash-can-regular.svg" alt="">
                <h1 class='text-[#f66473]'>Delete this board</h1>
            </button>
        </div>
    {:else}
        <h1 class='font-bold text-xl absolute left-16'>{nameDisplay}</h1>
    {/if}
</div>