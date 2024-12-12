<script lang='ts'>
    import SideBar from "./sidebar/SideBar.svelte";
    import TopBar from "./topbar/TopBar.svelte";
    import Body from "./body/Body.svelte";
</script>

<div class='flex'>
    <SideBar/>
    <div class='flex flex-col'>
        <TopBar/>
        <Body/>
    </div>
</div>
