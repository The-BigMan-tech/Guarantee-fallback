<script lang='ts'>
    import type {BoardDefinition, GroupDTO,TaskDTO} from '../interfaces/shared-interfaces'
    let board:BoardDefinition = $state() as BoardDefinition
    let groups:GroupDTO[] = $state([])

    let shouldView:boolean = $state(false)
    let viewTask:TaskDTO = $state() as TaskDTO
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
    async function deleteTask(boardName:string,groupName:string,index:number):Promise<void> {
        const response:Response = await fetch(`http://localhost:3100/tasks/deleteTask?boardName=${encodeURIComponent(boardName)}&groupName=${encodeURIComponent(groupName)}&index=${index}`,{method:'DELETE'})
        await processResponse(response)
        await loadSelectedBoard()
    }
    async function viewATask(boardName:string,groupName:string,index:number):Promise<void> {
        const response:Response = await fetch(`http://localhost:3100/tasks/viewTask?boardName=${encodeURIComponent(boardName)}&groupName=${encodeURIComponent(groupName)}&index=${index}`,{method:'GET'})
        await processResponse(response)
        viewTask = await response.json()
        shouldView = true
        console.log('SHOULD VIEW',shouldView,viewTask.title);
    }
    $effect(()=>{
        let none = isTopBarOn
        let none1 = shouldTaskReload
        loadSelectedBoard().then(()=>console.log('BOARD DATA: ',board.name))
    })
</script>

<div class='bg-[#21212d] h-[31.7rem] relative overflow-x-scroll overflow-y-clip'>
    <div class='absolute flex flex-col left-16 mt-4'>
        <div class='flex text-[#848a9a] gap-24'>
            {#each groups as group} 
                <div class='flex flex-col w-56 mb-20'>
                    <div class='flex gap-3'>
                        <h1 class={`text-transparent bg-[hsl(150,56%,57%)] w-3 h-3 rounded-full relative top-[0.4rem]`}>0</h1>
                        <h1 class='font-sans font-[550] mb-6'>{group.name} ( <span class='text-[#a59bf5] font-space'> {group.tasks.length} </span> )</h1>
                    </div>
                    <div class='flex flex-col gap-7 overflow-y-scroll h-[26rem]'>
                        {#each group.tasks as task,index}
                            <div class='flex gap-5'>
                                <button onclick={()=>deleteTask(board.name,group.name,index)}>
                                    <img class='w-5' src="/trash-can-regular.svg" alt="">
                                </button>
                                <button onclick={()=>viewATask(board.name,group.name,index)} class='bg-[#2c2c38] py-3 w-[100%] text-white rounded-xl text-xl text-left pl-4 font-roboto shadow-md'>{task.title}</button>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
<div class='text-white z-20 absolute left-[50vw] top-[50vh]'>
    {#if shouldView}
        <h1>{viewTask.title}</h1>
    {/if}
</div>