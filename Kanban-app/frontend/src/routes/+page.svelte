<script lang='ts'>
    import SideBar from "./sidebar/SideBar.svelte";
    import TopBar from "./topbar/TopBar.svelte";
    import Body from "./body/Body.svelte";
    import { onDestroy } from 'svelte';
    import {lever} from "./levers/lever.svelte";

    let isOn:boolean = $state(false)
    const unsubscribe = lever.subscribe(value => isOn = value);
    onDestroy(unsubscribe);
</script>

<div class='flex'>
    <SideBar/>
    <div class='flex flex-col'>
        <TopBar {isOn}/>
        <Body/>
    </div>
</div>
