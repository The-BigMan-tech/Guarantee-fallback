<script lang='ts'>
    import type {BoardDefinition,GroupDTO,TaskDetailsDTO} from '../interfaces/shared-interfaces'
    import {setIndex} from '../levers/lever.svelte'

    let {isTaskOn,sharedName} = $props()
    let boards:BoardDefinition[] = $state([])
    let board:BoardDefinition = $state() as BoardDefinition
    let groups:GroupDTO[] = $state([]);

    let title:string = $state('');
    let description:string = $state('')
    let status:string = $state('');
    let taskCreated:boolean = $state(false)

    async function processResponse(response:Response):Promise<void> {
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    async function loadBoards():Promise<void> {
        let response:Response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        processResponse(response)
        boards = await response.json()

        //I didnt want to bring this here but it is essential for loading the task statuses
        response = await fetch('http://localhost:3100/boards/loadSelectedBoard',{method:'GET'})
        processResponse(response);
        board = await response.json()
        groups = board.groups
    }
    function cancel(index:number):void { 
        setIndex(index,false)
    }
    async function createTask(boardName:string) {
        const taskObject:TaskDetailsDTO = {
            boardName:boardName,
            taskInfo:{
                title:title,
                description:description,
                status:status
            }
        }
        const response:Response = await fetch('http://localhost:3100/tasks/addTask',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(taskObject)
        })
        await processResponse(response)
        console.log('Task details',taskObject);
        taskCreated = true
    }
    $effect(()=>{
        console.log('Task flicked',isTaskOn);
        loadBoards()
    })
</script>

{#each boards as value,index}
    {#if (isTaskOn[index] && value.name === sharedName)}
        {#if (!taskCreated)}
            <div class='absolute text-white w-96 bg-[#26262e] h-[34rem] rounded-xl shadow-xl'>
                <div class='flex flex-col relative left-9 top-7'>
                    <div class='flex flex-col gap-4'>
                        <div class='flex gap-5 relative w-80 items-center'>
                            <img class="w-4"  src="/chalkboard-solid.svg" alt="">
                            <h1 class='font-roboto text-sm'>Board:</h1>
                            <h1 class='font-bold text-sm'>{value.name}</h1>
                            <button onclick={()=>cancel(index)} class='absolute right-4'>
                                <img class='w-6' src="/circle-xmark-solid.svg" alt="">
                            </button>
                        </div>
                        <h1 class='text-xl font-bold font-space'>Add New Task</h1>
                    </div>
                    <form class="flex flex-col gap-14 relative" action="">
                        <div class='relative top-3 flex flex-col mt-3'>
                            <label class="font-roboto" for="">Title</label>
                            <input bind:value={title} class='relative top-3 w-80 py-1 outline-none rounded-sm pl-4 text-white bg-transparent outline-[#4e4e5c] font-[600]' type="text" placeholder='eg Do my homework'>
                        </div>
                        <div class='relative top-3 flex flex-col'>
                            <label class='font-mono' for="">Description</label>
                            <textarea bind:value={description} class='resize-none relative top-3 w-80 py-1 outline-none rounded-sm pl-4 text-white bg-transparent outline-[#4e4e5c] h-20' name="" id="" placeholder='eg I have to go research on advanced calculus for this one'></textarea>
                        </div>
                        <div class='relative top-3 flex flex-col gap-4'>
                            <label class='font-mono' for="">Status</label>
                            <select bind:value={status} class='text-purple-600 font-[540] bg-transparent border border-[#4e4e5c] w-80 pl-2 py-2 rounded-sm font-sans' name="" id="">
                                {#each groups as group}
                                    <option value={group.name} class='pl-2'>{group.name}</option>
                                {/each}
                            </select>
                        </div>
                    </form>
                </div>
                <button onclick={()=>createTask(value.name)} class='absolute bottom-4 left-[5.5rem] bg-[#4d3bbc] py-3 px-14 rounded-3xl'>Create Task</button>
            </div>
        {:else}
            <div class='absolute text-white w-96 bg-[#26262e] h-[34rem] rounded-xl shadow-xl'>Task created</div>
        {/if}
    {/if}
{/each}