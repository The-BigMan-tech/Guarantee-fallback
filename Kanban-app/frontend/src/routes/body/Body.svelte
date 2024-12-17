<script lang='ts'>
    import type {BoardDefinition, GroupDTO,TaskDTO,EditTaskDTO} from '../interfaces/shared-interfaces'
    import Arrow from './arrow.svelte';

    let board:BoardDefinition = $state() as BoardDefinition
    let groups:GroupDTO[] = $state([])
    let globalGroup:string = $state('')
    let globalIndex:number = $state(0)


    let shouldView:boolean = $state(false)
    let viewTask:TaskDTO = $state() as TaskDTO
    let {isTopBarOn,shouldTaskReload} = $props()
    let tagColors:string[] = $state(['bg-[#f77373]','bg-[#fff75c]','bg-[#54cf91]'])
    let tagHex:string[] = $state(['#f77373','#fff75c','#54cf91'])

    let newTitle:string = $state('')
    let newDescription:string = $state('')
    let newStatus:string = $state('')

    let editTitle:boolean = $state(false)
    let editDescription:boolean = $state(false)
    let editStatus:boolean = $state(false)

    let deleteAction:boolean[] = $state([])
    let deleteActionGroup:boolean[] = $state([])

    let changeIndexArr:boolean[] = $state([])
    let changeIndexGroup:boolean[] = $state([])
    let changePlaceholder:string = $state('')
    function popDelete(index:number,gIndex:number) {
        if (!deleteAction[index]) {
            deleteAction = []
            deleteActionGroup = []
            deleteAction[index] = true
            deleteActionGroup[gIndex] = true
            return
        }
        deleteAction[index] = false
        deleteActionGroup[index] = false
    }
    function changeIndex(gIndex:number,index:number,title:string) {
        changePlaceholder = title
        popDelete(index,gIndex)
        if (!changeIndexArr[index]) {
            changeIndexArr = []
            changeIndexGroup = []
            changeIndexArr[index] = true
            changeIndexGroup[gIndex] = true
            return
        }
        changeIndexArr[index] = false
        changeIndexGroup[gIndex] = false
    }   
    async function processResponse(response:Response):Promise<void> {
        console.log('processing');
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseMessage)
        }
    }
    async function loadSelectedBoard():Promise<void> {
        const response:Response = await fetch('http://localhost:3100/boards/loadSelectedboard',{method:'GET'})
        await processResponse(response)
        board = await response.json()
        console.log('BOARD RECEIVED',board)
        groups = board.groups
    }
    async function deleteTask(boardName:string,groupName:string,index:number):Promise<void> {
        const response:Response = await fetch(`http://localhost:3100/tasks/deleteTask?boardName=${encodeURIComponent(boardName)}&groupName=${encodeURIComponent(groupName)}&index=${index}`,{method:'DELETE'})
        await processResponse(response)
        await loadSelectedBoard()
        deleteAction[index] = false
    }
    async function viewATask(boardName:string,groupName:string,index:number):Promise<void> {
        const response:Response = await fetch(`http://localhost:3100/tasks/viewTask?boardName=${encodeURIComponent(boardName)}&groupName=${encodeURIComponent(groupName)}&index=${index}`,{method:'GET'})
        await processResponse(response)
        viewTask = await response.json()
        globalGroup = groupName
        globalIndex = index
        newStatus = newStatus || viewTask.status
        shouldView = true
        console.log('SHOULD VIEW',shouldView,viewTask.title);
    }
    function handleChange(event:Event) {
        console.log('NEW STATUS',newStatus)
        const target = event.target as HTMLInputElement
        if (target.value !== viewTask.status) {
            editStatus = true
            return
        }
        editStatus = false
    }
    function cancel() {
        shouldView = false
        newTitle = ''
        newDescription = ''
        newStatus = ''
        editTitle = false
        editDescription = false
        editStatus = false
    }
    async function editTask():Promise<void> {
        console.log('BOARD TO EDIT',board.name,'GROUP',globalGroup,'INDEX',globalIndex,'NEW TITLE',newTitle);
        const newTaskObject:EditTaskDTO = {
            boardName:board.name,
            groupName:globalGroup,
            index:globalIndex,
            newTask:{
                title:newTitle || viewTask.title,
                description:newDescription || viewTask.description,
                status:newStatus || viewTask.status
            }
        }
        const response:Response = await fetch('http://localhost:3100/tasks/editTask',{
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(newTaskObject)
        })
        await processResponse(response)
        cancel()
        await loadSelectedBoard()
    }
    async function slideSideways(taskIndex:number,groupIndex:number,groupName:string,title:string,description:string):Promise<void> {
        globalGroup = groupName
        globalIndex = taskIndex
        newStatus = groups[groupIndex].name

        newTitle = title
        newDescription = description || 'no description'
        console.log('ORIGINAL TITLE',newTitle,'DESC',newDescription,'NEW STATUS',newStatus,'TASK INDEX',taskIndex,'GROUP NAME',globalGroup);
        await editTask()
    }
    $effect(()=>{
        let none = isTopBarOn
        let none1 = shouldTaskReload
        console.log('RELOADED');
        loadSelectedBoard().then(()=>console.log('BOARD DATA: ',board.name))
    })
</script>

<div class='bg-[#21212d] h-[31.7rem] relative overflow-x-scroll overflow-y-clip'>
    <div class='absolute flex flex-col left-16 mt-4'>
        <div class='flex text-[#848a9a] gap-24'>
            {#each groups as group,gIndex} 
                <div class='flex flex-col w-56 mb-20'>
                    <div class='flex gap-3'>
                        <h1 class={`text-transparent ${tagColors[gIndex]} w-3 h-3 rounded-full relative top-[0.4rem]`}>0</h1>
                        <h1 class='font-sans font-[550] mb-6'>{group.name} ( <span class='text-[#bf57fc] font-space'> {group.tasks.length} </span> )</h1>
                    </div>
                    <div class='flex flex-col gap-7 overflow-y-scroll h-[26rem] w-56'>
                        {#each group.tasks as task,index}
                            <div class='flex flex-col'>
                                <div class='flex relative gap-3 items-center'>
                                    <div class='flex flex-col justify-center absolute right-14 z-10'>
                                        <button onclick={()=>popDelete(index,gIndex)} class='flex gap-1 text-transparent group'>
                                            <h1 class='bg-slate-200 h-1 w-1 rounded-full group-hover:bg-[#bf57fc]'>0</h1>
                                            <h1 class='bg-slate-200 h-1 w-1 rounded-full group-hover:bg-[#bf57fc]'>0</h1>
                                            <h1 class='bg-slate-200 h-1 w-1 rounded-full group-hover:bg-[#bf57fc]'>0</h1>
                                        </button>
                                        {#if (deleteAction[index] && deleteActionGroup[gIndex])}
                                            <div class='flex items-center gap-6'>
                                                <button class='flex-shrink-0 absolute top-5' onclick={()=>deleteTask(board.name,group.name,index)}>
                                                    <img class='w-4 bg-[#29282a]' src="/trash-can-regular.svg" alt="">
                                                </button>
                                                <button onclick={()=>changeIndex(gIndex,index,task.title)} class='absolute top-4 left-9'>S</button>
                                            </div>
                                        {/if}
                                    </div>
                                    <div class='flex flex-shrink-0 w-[100%] gap-2 relative'>
                                        {#if tagHex[gIndex - 1]}
                                            <button onclick={()=>slideSideways(index,gIndex - 1,group.name,task.title,task.description)} class='rotate-180'>
                                                <Arrow color={tagHex[gIndex - 1]}/>
                                            </button>
                                        {/if}
                                        {#if (changeIndexArr[index] && changeIndexGroup[gIndex])}
                                            <button onclick={()=>viewATask(board.name,group.name,index)} class='bg-[#2c2c38] border border-[#fff75c] py-3 w-[80%] text-white rounded-xl text-lg text-left pl-4 font-roboto shadow-sm break-words pr-2'>{task.title}</button> 
                                        {:else}
                                            <button onclick={()=>viewATask(board.name,group.name,index)} class='bg-[#2c2c38] py-3 w-[80%] text-white rounded-xl text-lg text-left pl-4 font-roboto shadow-sm break-words pr-2'>{task.title}</button> 
                                        {/if}
                                        {#if tagHex[gIndex + 1]}
                                            <button onclick={()=>slideSideways(index,gIndex + 1,group.name,task.title,task.description)}>
                                                <Arrow color={tagHex[gIndex + 1]}/>
                                            </button>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            {#if changeIndexGroup[gIndex]}
                                <button class='bg-transparent hover:border hover:border-[#bd57fc] text-left pl-4 py-0 h-0 hover:py-3 hover:h-auto w-[80%] rounded-xl shadow-sm text-transparent relative text-lg left-5 hover:text-white'>{changePlaceholder}</button> 
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

{#if shouldView}
    <div class='flex flex-col gap-8 text-white z-20 absolute left-[40vw] top-[40vh] bg-[#26262e] w-96 text-left pl-7 pt-5 rounded-lg shadow-md'>
        <div class='flex relative'>
            <div class='flex gap-2 flex-wrap w-64 '>
                <button onclick={()=>editTitle=editTitle?false:true}>
                    {#if !editTitle}
                        <img class="w-4" src="/pen-to-square-regular.svg" alt="">
                    {:else}
                        <img class="w-4" src="/square-check-regular(2).svg" alt="">
                    {/if}
                </button>
                <h1 class='font-roboto'>Title:</h1>
                {#if !editTitle}
                    <h1 class='font-sans break-words'>{newTitle || viewTask.title}</h1>
                {:else}
                    <input bind:value={newTitle} class='outline-none w-40 bg-transparent border-2 border-[#4e4e5c] pl-3 rounded-lg' type="text" placeholder={viewTask.title}>
                {/if}
            </div>
            <button onclick={cancel}>
                <img class='w-6 absolute right-5 top-0' src="/circle-xmark-solid.svg" alt="">
            </button>
        </div>
        <div class='flex gap-2 w-80 flex-wrap'>
            <button onclick={()=>editDescription=editDescription?false:true}>
                {#if !editDescription}
                    <img class="w-4" src="/pen-to-square-regular.svg" alt="">
                {:else}
                    <img class="w-4" src="/square-check-regular(2).svg" alt="">
                {/if}
            </button>
            <h1 class='font-roboto'>Description:</h1>
            {#if !editDescription}
                <p class='break-words'>{newDescription || viewTask.description}</p>
            {:else}
                <textarea bind:value={newDescription} class='resize-none relative top-3 w-80 py-1 outline-none rounded-sm pl-4 text-white bg-transparent outline-[#4e4e5c] h-16' name="" id="" placeholder={viewTask.description}></textarea>
            {/if}
        </div>
        <div class='flex gap-2 items-center mb-3'>
            <h1 class='font-roboto'>Status: </h1>
            <select bind:value={newStatus} onchange={handleChange} class='text-[#b979de] font-[540] bg-transparent border border-[#4e4e5c] w-40 pl-2 py-2 rounded-sm font-sans' name="" id="">
                {#each groups as group}
                    {#if (group.name == viewTask.status)}
                        <option selected value={group.name} class='pl-2'>{group.name}</option>
                    {:else}
                        <option value={group.name} class='pl-2'>{group.name}</option>
                    {/if}
                {/each}
            </select>
        </div>
        {#if (newTitle || newDescription || editStatus)}
            {#if ((!editTitle && !editDescription))}
                <button onclick={editTask} class='mb-4 relative bottom-2 font-sans bg-[#4dde78] w-40 py-2 rounded-2xl font-[550] items-center text-black'>Apply changes</button>
            {:else}
                <h1 class='relative bottom-4 text-[#ffee38]'>Click on all check buttons to apply changes</h1>
            {/if}
        {/if}
    </div>
{/if}
