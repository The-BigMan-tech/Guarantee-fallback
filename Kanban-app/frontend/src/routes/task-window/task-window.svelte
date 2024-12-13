<script lang='ts'>
    import type {BoardDefinition} from '../interfaces/shared-interfaces'
    let {isTaskOn} = $props()
    let board:BoardDefinition = $state() as BoardDefinition

    async function processResponse(response:Response):Promise<void> {
        if (!response.ok) {
            const responseMessage = await response.text()
            const responseErrorMessage = JSON.parse(responseMessage).message
            throw new Error(responseErrorMessage)
        }
    }
    async function getSelectedBoard():Promise<void> {
        const response:Response = await fetch('http://localhost:3100/boards/loadSelectedBoard',{method:'GET'})
        processResponse(response);
        board = await response.json()
    }

    $effect(()=>{
        console.log('Task flicked',isTaskOn);
        getSelectedBoard()
    })
</script>

{#if (isTaskOn)}
    <div class='absolute text-white'>
        {board.name}
    </div>
{/if}