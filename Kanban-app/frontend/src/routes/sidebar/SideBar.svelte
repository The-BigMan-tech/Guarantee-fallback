<script lang='ts'>
    import { onMount } from 'svelte';
    import type {BoardDefinition} from '../interfaces/shared-interfaces'

    let boardNumber:number = $state(0)
    let createBoard:boolean = $state(false)
    let createText:string = $state('+ Create new board')
    let createTextStyle:string = $state('')
    let newBoardName:string = $state('')
    let boards:BoardDefinition[] = $state([])
    let boardSelection:string[] = $state([])

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
        createTextStyle = ''
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
        boardSelection[index] = 'bg-[#645fc6] py-3 w-72 rounded-r-3xl px-10 relative right-10'
    }
    onMount(()=>{
        loadBoards()
    })
</script>

<aside class='flex flex-col bg-[#2c2c38] text-white h-[36.7rem] w-72 overflow-scroll'>
    <div class='flex gap-5 items-center ml-6 mt-4 border-r border-[#3a3a46] mb-10'>
        <div class='flex gap-1'>
            <div class='bg-[#6360c9] rounded-xl w-[0.3rem] text-transparent'>0</div>
            <div class='bg-[#5553a2] rounded-xl w-[0.3rem] text-transparent'>0</div>
            <div class='bg-[#48457e] rounded-xl w-[0.3rem] text-transparent'>0</div>
        </div>
        <h1 class='text-3xl font-bold font-[Consolas]'>Kanban</h1>
    </div>
    <div class='ml-6'>
        <h1 class='text-[#6b6d7a] font-[Verdana] font-[600] text-sm mb-7'>ALL BOARDS ( {boardNumber} )</h1>
        <div class='flex flex-col gap-5'>
            {#each boards as board,index}
                <button onclick={()=>selectBoard(index)} class={`flex gap-4 items-center ${boardSelection[index]}`}>
                    <img class='w-4' src="/film-solid.svg" alt="">
                    <h1 class='font-[Arial]'>{board.name}</h1>
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
                <button onclick={toggleCreateBox} class={`text-[#6558df] ${createTextStyle}`}>{createText}</button>
            </div>
        </div>
    </div>
</aside>