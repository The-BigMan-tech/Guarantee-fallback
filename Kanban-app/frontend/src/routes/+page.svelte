<script lang='ts'>
    import SideBar from "./sidebar/SideBar.svelte";
    import TopBar from "./topbar/TopBar.svelte";
    import Body from "./body/Body.svelte";
    import { onDestroy } from 'svelte';
    import {Toplever,Sidelever} from "./levers/lever.svelte";

    let isTopBarOn:boolean = $state(false)
    let isSideBarOn:boolean = $state(false)

    const unsubscribe1 = Toplever.subscribe(value => isTopBarOn = value);
    const unsubscribe2 = Sidelever.subscribe(value => isSideBarOn = value);
    onDestroy(()=>{
            unsubscribe1();unsubscribe2()
        }
    );
</script>

<div class='flex'>
    <SideBar {isSideBarOn}/>
    <div class='flex flex-col'>
        <TopBar {isTopBarOn}/>
        <Body/>
    </div>
</div>
