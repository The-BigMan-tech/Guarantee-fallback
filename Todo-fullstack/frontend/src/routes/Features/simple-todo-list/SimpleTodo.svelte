<script lang="ts">
    import { onMount } from "svelte";

    interface TaskData {
        name?:string
    }
    let task:string = $state('')
    let taskData:TaskData[] = $state([])
    let checked:string[] = $state([])
    let cross:string[] = $state([])
    let edit:boolean[] = $state([])
    let edit_or_done:string = $state('EDIT')

    function toggleCrossTask(index:number):void {
        if (checked[index]) {
            cross[index] = 'line-through text-[#4c4c4c]'
            return
        }
        cross[index] = ''
    }
    function toggleCheckedTask(index:number):void {
        if (!checked[index]){
            checked[index] = 'bg-[#031E6F]'
            toggleCrossTask(index)
            return
        }
        checked[index] = ''
        toggleCrossTask(index)
    }
    function typingTask(event:Event):void {
        const target = event.target as HTMLInputElement
        task = target.value
    }
    async function saveTask() {
        const response = await fetch('http://localhost:4000/getTask',{method:'GET'})
        if (!response.ok) throw new Error('Got an error on response')
        taskData = await response.json()
    }
    onMount(()=>{
        saveTask()
    })
    async function addTask() {
        if (!task.length) return
        await fetch('http://localhost:4000/addTask',
        {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name:task})
        })
        saveTask()
    }
    async function deleteTask(removeTask:TaskData,index:number) {
        await fetch(
            `http://localhost:4000/deleteTask/${encodeURIComponent(JSON.stringify(removeTask))}`,
            {method:'DELETE'}
        )
        saveTask()
        if (checked[index]) toggleCheckedTask(index)
    }
    function toggleEditTask(index:number):void {
        if (edit[index]) {
            edit[index] = false
            edit_or_done = 'EDIT'
            return
        }
        edit[index] = true
        edit_or_done = 'DONE'
        
    }
</script>
<div class="flex justify-center relative top-24">
    <div class="flex flex-col items-center">
        <h1 class="text-[#00e5ff] text-7xl font-[800]">TODO APP</h1>
        <div class="flex relative">
            <div class="mt-10">
                <form action="">
                    <input onchange={typingTask} value={task} class="py-3 px-6 border-[#B7D8E8] w-[35rem] border rounded-3xl text-xl font-[Consolas] outline-none bg-transparent text-[#B7D8E8]" type="text" placeholder="You can write anything here">
                    <button onclick={addTask}>
                        <div class="bg-[#00e5ff] py-3 px-8 font-[600] text-lg rounded-3xl absolute right-0 top-[2.55rem]">
                            <h1>ADD</h1>
                        </div>
                    </button>
                </form>
                <div class="flex flex-col gap-5 relative mt-8">
                    {#each taskData as addedTask,index}
                        <div class="flex bg-[#98D9E3] relative rounded-2xl py-4 px-6 items-center gap-5">
                            <button onclick={()=>toggleCheckedTask(index)} class={`border-2 border-[#031E6F] h-6 w-6 rounded-sm text-transparent ${checked[index]}`}>0</button>
                            {#if (edit[index])}
                                <input value={addedTask.name} class={`text-xl outline-none ${cross[index]}`}/>
                            {:else}
                                <h1 class={`text-xl outline-none bg-[#98d9e3] ${cross[index]}`}>{addedTask.name}</h1>
                            {/if}
                            <div class="flex absolute right-4 gap-5">
                                <button onclick={()=>toggleEditTask(index)}>
                                    <h1 class="bg-[#031E6F] text-white py-3 px-4 rounded-xl">{edit_or_done}</h1>
                                </button>
                                <button onclick={()=>deleteTask(addedTask,index)}>
                                    <h1 class="bg-[#780707] text-white py-3 px-4 rounded-xl">DELETE</h1>
                                </button> 
                            </div>
                        </div> 
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
