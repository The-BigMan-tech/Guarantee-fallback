<script lang='ts'>
    import SideBar from "./sidebar/SideBar.svelte";
    import TopBar from "./topbar/TopBar.svelte";
    import Body from "./body/Body.svelte";
    import TaskWindow from "./task-window/task-window.svelte";
    import { onDestroy } from 'svelte';
    import {Toplever,Sidelever,Tasklever} from "./levers/lever.svelte";


    let isTopBarOn:boolean = $state(false)
    let isSideBarOn:boolean = $state(false)
    let isTaskOn:boolean = $state(false)

    const unsubscribe1 = Toplever.subscribe(value => isTopBarOn = value);
    const unsubscribe2 = Sidelever.subscribe(value => isSideBarOn = value);
    const unsubscribe3 = Tasklever.subscribe(value => isTaskOn = value);
    onDestroy(()=>{
            unsubscribe1();unsubscribe2();unsubscribe3();
        }
    );
</script>

<div class='relative flex justify-center items-center'>
    <div class='flex'>
        <SideBar {isSideBarOn}/>
        <div class='flex flex-col'>
            <TopBar {isTopBarOn}/>
            <Body/>
        </div>
    </div>
    <TaskWindow {isTaskOn}/>
</div>