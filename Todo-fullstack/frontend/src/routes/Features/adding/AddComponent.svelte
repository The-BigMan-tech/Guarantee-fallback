<script lang="ts">
    interface TaskData {
        name?:string | undefined
    }
    let task:string = $state('')
    let taskData:TaskData[] = $state([])
    
    function typingTask(event:Event):void {
        const target = event.target as HTMLInputElement
        task = target.value
    }
    async function addTask() {
        console.log(task);
        await fetch('http://localhost:4000/addTask',
            {
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({name:task})
            }
        )
        const response = await fetch('http://localhost:4000/getTask',{method:'GET'})
        if (!response.ok) throw new Error('Got an error on response')
        taskData = await response.json()
        taskData = taskData.filter((task)=>task.name != '')
        console.log("Gotten Task",taskData);
    }
    addTask()
    async function deleteTask(removeTask:TaskData) {
        console.log('Called it',removeTask);
        await fetch(`http://localhost:4000/deleteTask/${removeTask}`,{method:'GET'})
    }
</script>
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
        {#each taskData as addedTask}
            <div class="flex bg-[#29dcf0] relative rounded-2xl py-4 px-6 ">
                <h1 class="text-xl">{addedTask.name}</h1>
                <button onclick={()=>deleteTask(addedTask)} class="absolute right-4 top-4">
                    <h1>Delete</h1>
                </button>
            </div> 
        {/each}
    </div>
</div>
</div>