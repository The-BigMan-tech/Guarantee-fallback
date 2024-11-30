<script lang="ts">
    import AddButton from "./AddButton.svelte";

    let task:string | undefined = $state()
    function typingTask(event:Event):void {
        const target = event.target as HTMLInputElement
        task = target.value
    }
    function addTask():void {
        console.log(task);
    }
</script>
<div class="flex relative">
    <div class="mt-10">
    <form action="">
        <input onchange={typingTask} value={task} class="py-3 px-6 border-[#B7D8E8] w-[35rem] border rounded-3xl text-xl font-[Consolas] outline-none bg-transparent text-[#B7D8E8]" type="text" placeholder="You can write anything here">
        <button onclick={addTask}>
            <AddButton/>
        </button>
    </form>
</div>
</div>