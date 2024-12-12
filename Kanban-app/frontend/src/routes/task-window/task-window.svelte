<script>
    let {isTaskOn} = $props()

    $effect(()=>{
        console.log('Task flicked',isTaskOn);
    })
</script>

{#if (isTaskOn)}
    <div class='absolute text-white'>
        00
    </div>
{/if}