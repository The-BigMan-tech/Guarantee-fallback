<script lang='ts'>
    import type {BoardDefinition, GroupDTO,TaskDTO} from '../interfaces/shared-interfaces'
    import { TaskName } from '../levers/lever.svelte';
    let board:BoardDefinition = $state() as BoardDefinition
    let groups:GroupDTO[] = $state([])
    let tasks:TaskDTO[] = $state([])

    let {isTopBarOn,shouldTaskReload} = $props()

    async function processResponse(response:Response):Promise<void> {
        console.log('processing');
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    async function loadSelectedBoard():Promise<void> {
        const response:Response = await fetch('http://localhost:3100/boards/loadSelectedBoard',{method:'GET'})
        await processResponse(response)
        board = await response.json()
        groups = board.groups
    }
    $effect(()=>{
        let none = isTopBarOn
        let none1 = shouldTaskReload
        loadSelectedBoard().then(()=>console.log('BOARD DATA: ',board.name))
    })
</script>

<div class='bg-[#21212d] h-[31.7rem] relative overflow-x-scroll'>
    <div class='absolute flex flex-col left-16 mt-4'>
        <div class='flex text-[#848a9a] gap-24'>
            {#each groups as group} 
                <div class='flex flex-col w-56 mb-20'>
                    <h1 class='font-sans font-[550] mb-6'>{group.name} ( <span class='text-[#a59bf5] font-space'> {group.tasks.length} </span> )</h1>
                    <div class='flex flex-col gap-7 overflow-y-scroll'>
                        {#each group.tasks as task}
                            <div class='flex gap-5'>
                                <img class='w-4' src="/trash-can-regular.svg" alt="">
                                <button class='bg-[#2c2c38] py-3 w-[100%] text-white rounded-xl text-xl text-left pl-4 font-roboto shadow-md'>{task.title}</button>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>