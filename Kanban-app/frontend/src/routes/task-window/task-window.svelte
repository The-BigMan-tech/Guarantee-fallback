<script lang='ts'>
    import type {BoardDefinition,GroupDTO} from '../interfaces/shared-interfaces'
    let {isTaskOn,sharedName} = $props()
    let boards:BoardDefinition[] = $state([])
    let board:BoardDefinition = $state() as BoardDefinition
    let groups:GroupDTO[] = $state([]) 

    async function processResponse(response:Response):Promise<void> {
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    async function loadBoards() {
        let response:Response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        processResponse(response)
        boards = await response.json()

        //I didnt want to bring this here but it is essential for loading the task statuses
        response = await fetch('http://localhost:3100/boards/loadSelectedBoard',{method:'GET'})
        processResponse(response);
        board = await response.json()
        groups = board.groups
    }
    $effect(()=>{
        console.log('Task flicked',isTaskOn);
        loadBoards()
    })
</script>

{#each boards as value,index}
    {#if (isTaskOn[index] && value.name === sharedName)}
        <div class='absolute text-white w-96 bg-[#503cc4] h-[32rem] rounded-xl shadow-xl'>
            <div class='flex flex-col relative left-9 top-7'>
                <div class='flex flex-col gap-4'>
                    <div class='flex gap-5'>
                        <h1>Board:</h1>
                        <h1>{value.name}</h1>
                    </div>
                    <h1 class='text-xl font-bold'>Add New Task</h1>
                </div>
                <form class="flex flex-col gap-10 relative" action="">
                    <div class='relative top-3 flex flex-col'>
                        <label for="">Title</label>
                        <input class='relative top-3 w-80 py-1 outline-none rounded-sm pl-4 text-black' type="text">
                    </div>
                    <div class='relative top-3 flex flex-col'>
                        <label for="">Description</label>
                        <textarea class='resize-none relative top-3 w-80 py-1 outline-none rounded-sm pl-4 text-black h-20' name="" id=""></textarea>
                    </div>
                    <div class='relative top-3 flex flex-col gap-4'>
                        <label for="">Status</label>
                        <select class='text-black w-80 pl-2 py-1 rounded-sm' name="" id="">
                            {#each groups as group}
                                <option class='pl-2' value={group.name}>{group.name}</option>
                            {/each}
                        </select>
                    </div>
                </form>
            </div>
            <button class='absolute bottom-4 left-[5.5rem] bg-[#21212d] py-3 px-14 rounded-3xl'>Create Task</button>
        </div>
    {/if}
{/each}