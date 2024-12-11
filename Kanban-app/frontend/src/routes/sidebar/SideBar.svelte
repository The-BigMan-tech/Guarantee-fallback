<script lang='ts'>
    import { onMount } from 'svelte';
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    import Logo from './logo.svelte';

    let boardNumber:number = $state(0)
    let createBoard:boolean = $state(false)
    let createText:string = $state('+ Create new board')
    let createTextStyle:string = $state('text-[#e964f3] ')
    let newBoardName:string = $state('')
    let boards:BoardDefinition[] = $state([])
    let boardSelection:string[] = $state([])
    let boardIcons:boolean[] = $state([])
    
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
            createTextStyle = 'text-red-600'
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
    function selectBoard(index:number) {
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
        <div class='flex gap-5 items-center mt-6 border-r border-[#3a3a46] mb-10'>
            <Logo/>
            <h1 class='text-3xl font-bold font-space'>Kanban</h1>
        </div>
        <h1 class='text-[#6b6d7a] font-roboto font-[600] text-lg mb-7'>ALL BOARDS ( {boardNumber} )</h1>
    </div>
    <div class='ml-6 overflow-y-scroll pl-10 w-[19rem] relative right-10'>
        <div class='flex flex-col gap-5'>
            {#each boards as board,index}
                <button id={`board${index}`} onclick={()=>selectBoard(index)} class={`flex gap-4 items-center ${boardSelection[index]}`}>
                    {#if (!boardIcons[index])}
                        <img class="w-4" src="/chalkboard-solid-purple.svg" alt="">
                    {:else}
                        <img class="w-4" src="/chalkboard-solid.svg" alt="">
                    {/if}
                    <h1 class='font-sans'>{board.name}</h1>
                </button>
            {/each}
        </div>
        <div class='flex flex-col mt-7 gap-4'>
            {#if (createBoard)}
                <form onsubmit={createNewBoard} action="">
                    <input onchange={captureText} class='outline-none text-black w-44' type="text">
                </form>
            {/if}
            <div class='flex mb-10'>
                <img src="" alt="">
                <button onclick={toggleCreateBox} class={`${createTextStyle}`}>{createText}</button>
            </div>
        </div>
    </div>
</aside>