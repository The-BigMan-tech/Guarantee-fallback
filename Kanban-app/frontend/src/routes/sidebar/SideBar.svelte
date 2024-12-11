<script lang='ts'>
    import type {BoardDefinition} from '../interfaces/shared-interfaces'

    let boardNumber:number = $state(0)
    let createBoard:boolean = $state(false)
    let createText:string = $state('+ Create new board')
    let createTextStyle:string = $state('')
    let newBoardName:string = $state('')
    let boards:BoardDefinition[] = $state([])

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
    async function createNewBoard() {
        const response = await fetch('http://localhost:3100/boards/createBoard',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name:newBoardName})
        })
        const responseMessage = await response.text()
        if (!response.ok) {
            throw new Error(JSON.parse(responseMessage).message)
        }
        console.log(responseMessage);
    }
</script>

<aside class='flex flex-col bg-[#2c2c38] text-white h-[40rem] w-64'>
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
        <div class='flex gap-4 items-center'>
            <img class='w-4' src="/film-solid.svg" alt="">
            <h1 class='text-lg font-[Arial]'>Some board</h1>
        </div>
        <div class='flex flex-col mt-7 gap-4'>
            {#if (createBoard)}
                <form onsubmit={createNewBoard} action="">
                    <input onchange={captureText} class='outline-none text-black w-44' type="text">
                </form>
            {/if}
            <div class='flex'>
                <img src="" alt="">
                <button onclick={toggleCreateBox} class={`text-[#6558df] ${createTextStyle}`}>{createText}</button>
            </div>
        </div>
    </div>
</aside>