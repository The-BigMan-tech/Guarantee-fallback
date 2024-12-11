<script lang='ts'>
    import { onMount } from 'svelte';
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    import Logo from './logo.svelte';

    let boardNumber:number = $state(0)
    let createBoard:boolean = $state(false)
    let createText:string = $state('+ Create new board')
    let createTextStyle:string = $state('text-[#e964f3]')
    let newBoardName:string = $state('')
    let boards:BoardDefinition[] = $state([])
    let boardSelection:string[] = $state([])
    let boardIcons:boolean[] = $state([])
    let boardWidth:number = $state(19);
    let onEdit:boolean[] = $state([])

    async function processResponse(response:Response):Promise<void> {
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    function toggleCreateBox():void {
        if (!createBoard) {
            createBoard = true
            createText = 'Cancel'
            createTextStyle = 'text-[#ff5a5a]'
            return
        }
        createBoard = false
        createText = '+ Create new board'
        createTextStyle = 'text-[#e964f3]'
    }
    function captureText(event:Event):void {
        const target = event.target as HTMLInputElement
        newBoardName = target.value
    }
    async function loadBoards() {
        const response:Response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        processResponse(response)
        boards = await response.json()
        boardNumber = boards.length
    }
    async function createNewBoard() {
        const response:Response = await fetch('http://localhost:3100/boards/createBoard',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name:newBoardName})
        })
        processResponse(response)
        loadBoards()
        toggleCreateBox()
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
    function selectBoard(index:number,event:Event) {
        const target = event.target as HTMLInputElement
        if (target.classList.contains('outline-none')) { //*this is to disable selecting a board when editing
            return 
        }
        boardSelection = []
        boardIcons = []
        boardSelection[index] = 'bg-[#645fc6] rounded-r-3xl py-3 w-64 pl-16 relative right-10 transition-all duration-75 ease-linear'
        boardIcons[index] = true

    }
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
    <div class={`ml-6 overflow-y-scroll pl-10 w-[${boardWidth}rem] relative right-10`}>
        <div class='flex flex-col gap-5'>
            {#each boards as board,index}
                <div class='flex relative'>
                    <button id={`board${index}`} onclick={(event)=>selectBoard(index,event)} class={`flex gap-4 items-center ${boardSelection[index]}`}>
                        {#if (!boardIcons[index])}
                            <img class="w-4" src="/chalkboard-solid-purple.svg" alt="">
                        {:else}
                            <img class="w-4" src="/chalkboard-solid.svg" alt="">
                        {/if}
                        {#if (!onEdit[index])}
                            <h1 class='font-sans'>{board.name}</h1>
                        {:else}
                            <input onchange={captureText} class='outline-none rounded-lg pl-3 font-sans w-36 bg-white text-black' type="text">
                        {/if}
                    </button>
                    <button onclick={()=>editBoard(index,board.name)}>
                        {#if (!onEdit[index])}
                            <img class="w-4 absolute right-7 top-1" class:top-4={boardSelection[index]}  src="/pen-to-square-solid(1).svg" alt="">
                        {:else}
                            <img class="w-4 absolute right-7 top-1" class:top-4={boardSelection[index]}  src="/square-check-regular(1).svg" alt="">
                        {/if}
                    </button>
                </div>
            {/each}
        </div>
        <div class='flex mt-7 gap-4'>
            {#if (createBoard)}
                <form onsubmit={createNewBoard} action="">
                    <input onchange={captureText} class='outline-none rounded-lg pl-3 font-sans w-44 text-white bg-[#6144b8]' type="text">
                </form>
            {/if}
            <div class='flex mb-10'>
                <button onclick={toggleCreateBox} class={`${createTextStyle} font-roboto`}>
                    {#if (createText === 'Cancel')}
                        <img class='w-6' src="/circle-xmark-solid.svg" alt="">
                    {:else}
                        {createText}
                    {/if}
                </button>
            </div>
        </div>
    </div>
</aside>