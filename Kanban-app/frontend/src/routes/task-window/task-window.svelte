<script lang='ts'>
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    let {isTaskOn,sharedName} = $props()
    let boards:BoardDefinition[] = $state([])

    async function processResponse(response:Response):Promise<void> {
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    async function loadBoards() {
        const response:Response = await fetch('http://localhost:3100/boards/loadmyBoards',{method:'GET'})
        processResponse(response)
        boards = await response.json()
    }
    $effect(()=>{
        console.log('Task flicked',isTaskOn);
        loadBoards()
    })
</script>

{#each boards as value,index}
    {#if (isTaskOn[index])}
        <div class='absolute text-white flex'>
            <h1>{value.name}</h1>
        </div>
    {/if}
{/each}