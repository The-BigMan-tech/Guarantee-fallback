<script lang='ts'>
    import { onMount } from 'svelte';
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    import Logo from './logo.svelte';
    import Warning from '../warning-window/Warning.svelte';

    import {Toplever,Tasklever} from '../levers/lever.svelte'
    let {isSideBarOn} = $props()
    let boardNumber:number = $state(0)
    let createBoard:boolean = $state(false)
    let createText:string = $state('')
    let newBoardName:string = $state('')
    let boards:BoardDefinition[] = $state([])
    let boardSelection:string[] = $state([])
    let boardIcons:boolean[] = $state([])
    let boardWidth:number = $state(19);
    let onEdit:boolean[] = $state([])
    let taskWindow:boolean[] = $state([])
    let warningMessage:string = $state('')

    async function processResponse(response:Response):Promise<void> {
        console.log('processing');
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            warningMessage = 'Board already exists!'
            throw new Error(responseErrorMessage)
        }
        warningMessage = ''
    }
    function toggleCreateBox():void {
        if (!createBoard) {
            createBoard = true
            createText = 'Cancel'
            return
        }
        createBoard = false
        createText = ''
    }
    function captureText(event:Event):void {
        const target = event.target as HTMLInputElement
        newBoardName = target.value
    }
    async function selectBoard(index:number,event:Event | null,boardName:string) {
        if (event) {
            const target = event.target as HTMLInputElement
            if (target.classList.contains('outline-none')) { //*this is to disable selecting a board when editing
                return 
            }
        }
        boardSelection = []
        boardIcons = []
        boardSelection[index] = 'bg-[#242340] rounded-r-3xl py-3 pl-[5.5rem] relative right-10 transition-all duration-75 ease-linear'
        boardIcons[index] = true
        await fetch(`http://localhost:3100/boards/pushBoard/${boardName}`,{method:'GET'})
        Toplever.set(true)
        Toplever.set(false)

        Tasklever.set(false)
        Tasklever.set(true)

        taskWindow[index] = true
        if (!taskWindow[index]) {
            Tasklever.set(false)
            return
        }
    }
    async function loadBoards() {
        const response:Response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        processResponse(response)
        boards = await response.json()
        boardNumber = boards.length
        let lastBoard = boards.at(-1)
        if (lastBoard) {
            let lastIndex = boards.indexOf(lastBoard)
            await selectBoard(lastIndex,null,lastBoard.name)
        }
    }
    async function createNewBoard() {
        const response:Response = await fetch('http://localhost:3100/boards/createBoard',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name:newBoardName})
        })
        await processResponse(response)
        console.log('Warning',warningMessage);
        if (warningMessage) {
            return
        }
        await loadBoards()
        toggleCreateBox()
        const index = boards.findIndex(board=>board.name===newBoardName)
        console.log('INDEX',index,'BOARD',boardSelection);
        if (boardSelection[index]) {
            await fetch(`http://localhost:3100/boards/pushBoard/${newBoardName}`,{method:'GET'})
            Toplever.set(true)
            Toplever.set(false)
        }
    }
    async function editBoard(index:number,oldName:string):Promise<void> {
        if (onEdit[index]) {
            onEdit[index] = false
            const response:Response = await fetch('http://localhost:3100/boards/editBoard',{
                method:'PUT',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({oldBoardName:oldName,newBoardName:newBoardName})
            })
            processResponse(response)
            loadBoards()
            return
        }
        onEdit[index] = true
    }
    $effect(()=>{
        let none = isSideBarOn
        loadBoards()
    })
    onMount(()=>{
        loadBoards();
    })
</script>

<aside class='flex flex-col bg-[#2c2c38] text-white h-[36.7rem] w-72'>
    <div class='flex flex-col ml-6'>
        <div class='flex gap-5 items-center mt-6 border-r border-[#3a3a46] mb-10 flex-wrap'>
            <Logo/>
            <h1 class='text-3xl font-bold font-space'>Kanban</h1>
        </div>
        <h1 class='text-[#6b6d7a] font-roboto font-[600] mb-7'>ALL BOARDS ( {boardNumber} )</h1>
    </div>
    <div class={`ml-6 overflow-y-scroll overflow-x-hidden pl-10 w-[${boardWidth}rem] relative right-10`}>
        <div class='flex flex-col gap-5'>
            {#each boards as board,index}
                <div class='flex relative w-[100rem]'>
                    <button id={`board${index}`} onclick={(event)=>selectBoard(index,event,board.name)} class={`flex gap-4 items-center pl-10 w-64 ${boardSelection[index]}`}>
                        {#if (!boardIcons[index])}
                            <img class="w-4" src="/chalkboard-solid-purple.svg" alt="">
                        {:else}
                            <img class="w-4" src="/chalkboard-solid.svg" alt="">
                        {/if}
                        {#if (!onEdit[index])}
                            <h1 class='font-sans'>{board.name}</h1>
                        {:else}
                            <input onchange={captureText} class='outline-none rounded-lg pl-3 font-sans w-32 bg-white text-black' type="text" placeholder={board.name}>
                        {/if}
                    </button>
                    <button onclick={()=>editBoard(index,board.name)}>
                        {#if (!onEdit[index])}
                            <img class="w-4 absolute left-0 top-1" class:top-4={boardSelection[index]}  src="/pen-to-square-regular.svg" alt="">
                        {:else}
                            <img class="w-4 absolute left-0 top-1" class:top-4={boardSelection[index]}  src="/square-check-regular(2).svg" alt="">
                        {/if}
                    </button>
                </div>
            {/each}
        </div>
        <div class='flex mt-7 gap-4'>
            {#if (createBoard)}
                <form onsubmit={createNewBoard}>
                    {#if (warningMessage)}
                        <input onchange={captureText} class='outline-none rounded-lg pl-3 font-sans w-44 bg-[#6144b8]' type="text" placeholder={warningMessage}>
                    {:else}
                        <input onchange={captureText} class='outline-none rounded-lg pl-3 font-sans w-44 text-white bg-[#6144b8]' type="text">
                    {/if}
                </form>
            {/if}
            <div class='flex mb-10'>
                <button onclick={toggleCreateBox}>
                    {#if (createText === 'Cancel')}
                        <img class='w-6' src="/circle-xmark-solid.svg" alt="">
                    {:else}
                        <img class="w-5 relative right-1" src="/circle-plus-solid.svg" alt="">
                    {/if}
                </button>
            </div>
        </div>
    </div>
</aside>