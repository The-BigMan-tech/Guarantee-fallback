<script lang='ts'>
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    import {Sidelever} from '../levers/lever.svelte'

    let nameDisplay:string = $state('Platform Launch')
    let defaultName:string = $state('')
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
        const response:Response = await fetch('http://localhost:3100/boards/loadSelectedBoard',{method:'GET'})
        processResponse(response);
        board = await response.json()
    }
    async function deleteBoard():Promise<void> {
        const response:Response = await fetch(`http://localhost:3100/boards/delete/board/${nameDisplay}`,{method:'DELETE'})
        await processResponse(response)
        Sidelever.set(true)
        Sidelever.set(false)
        defaultName = 'react'
        console.log(defaultName);
    }
    $effect(()=>{
        let none = [isTopBarOn,defaultName]
        getSelectedBoard()
        .then(() => {
            console.log('Board name',board.name)
            if (board.name) {
                nameDisplay = board.name
                return
            }
            nameDisplay = 'Platform launch'
        });
    })
</script>

<div class='flex bg-[#2e2e3a] text-white h-20 items-center w-[62rem] relative border border-[#2e2e3a]'>
    <h1 class='font-bold text-2xl ml-20'>{nameDisplay}</h1>
    <button class='absolute right-56 bg-[rgb(100,94,197)] py-2 px-4 rounded-3xl'>+ Add new Task</button>
    <button onclick={deleteBoard} class='absolute right-24'>
        <h1>Delete this board</h1>
    </button>
</div>