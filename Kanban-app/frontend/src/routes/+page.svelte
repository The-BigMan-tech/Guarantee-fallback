<script lang='ts'>
    import SideBar from "./sidebar/SideBar.svelte";
    import TopBar from "./topbar/TopBar.svelte";
    import Body from "./body/Body.svelte";
    import TaskWindow from "./task-window/task-window.svelte";
    import { onDestroy } from 'svelte';
    import {Toplever,Sidelever,Tasklever,Indexlever,TaskName,ReloadTask} from "./levers/lever.svelte";


    let isTopBarOn:boolean = $state(false)
    let isSideBarOn:boolean = $state(false)
    let isTaskOn:boolean[] = $state([])
    let sharedIndex:number = $state(0)
    let sharedName:string = $state('')
    let shouldTaskReload:boolean = $state(false)

    const unsubscribe1 = Toplever.subscribe(value => isTopBarOn = value);
    const unsubscribe2 = Sidelever.subscribe(value => isSideBarOn = value);
    const unsubscribe3 = Tasklever.subscribe(value => isTaskOn = value);
    const unsubscribe4 = Indexlever.subscribe(value => sharedIndex = value);
    const unsubscribe5 = TaskName.subscribe(value => sharedName = value);
    const unsubscribe6 = ReloadTask.subscribe(value => shouldTaskReload = value);

    onDestroy(()=>{
            unsubscribe1();unsubscribe2();unsubscribe3();unsubscribe4();unsubscribe5();unsubscribe6()
        }
    );
</script>

<div class='relative flex justify-center items-center'>
    <div class='flex'>
        <SideBar {isSideBarOn}/>
        <div class='flex flex-col'>
            <TopBar {isTopBarOn}/>
            <Body {isTopBarOn} {shouldTaskReload}/>
        </div>
    </div>
    <TaskWindow {isTaskOn} {sharedName}/>
</div>