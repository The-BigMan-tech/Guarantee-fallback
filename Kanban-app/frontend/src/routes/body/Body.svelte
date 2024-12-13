<script lang='ts'>
    import type {BoardDefinition, GroupDTO} from '../interfaces/shared-interfaces'
    let board:BoardDefinition = $state() as BoardDefinition
    let groups:GroupDTO[] = $state([])
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

<div class='bg-[#21212d] h-[31.7rem] relative'>
    <div class='absolute flex flex-col left-16 mt-4'>
        <div class='flex text-[#848a9a] gap-72'>
            {#each groups as group} 
                <h1 class='font-sans font-[550]'>{group.name} ( <span class='text-[#a59bf5] font-space'> {group.tasks.length} </span> )</h1>
            {/each}
        </div>
    </div>
</div>