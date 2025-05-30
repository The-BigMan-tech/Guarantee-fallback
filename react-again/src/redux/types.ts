import { FsResult,FsNode } from "../utils/rust-fs-interface";
import Heap from "heap-js";
import { Queries } from "../utils/search-resumability";
import { AppThunk } from "./store";

export type shouldSkip = boolean;
export type DirResult = FsResult<(Promise<FsNode>)[] | Error | null> | FsResult<FsNode[]>
export type DeferredSearch = {path:string,priority:number}
export type Cache = Record<NodePath,FsNode[]>;
export type CachePayload = {path:NodePath,data:FsNode[]}
export type CachingState = 'pending' | 'success';
export type HomeTabsToValidate = 'Home' | 'Desktop'|'Downloads' | 'Documents' | 'Pictures' | 'Music' |'Videos'
export type HomeTab = HomeTabsToValidate | 'Recent'
export type invalidationData = {tabName:HomeTabsToValidate}
export type NodePath = string;
export type Queue = NodePath[];
export type SortingOrder = 'name' | 'date' | 'type' | 'size';
export type View = 'xl' | 'l' | 'md' | 'sm' | 'list' | 'details' | 'tiles' | 'content';

export interface HeuristicsArgs {
    deferredPaths:Record<string,boolean>,
    currentSearchPath:string,
    rootPath:string,
    processHeavyFolders:boolean,
    heavyFolderQueue:string[],
    deferredHeap: Heap<DeferredSearch>,
    searchQuery:string,
    nodeResult:Promise<FsNode>[] | FsNode[]
}
export interface ReuseQueryArgs {
    key:string,
    currentSearchPath:string,
    sizeBonus:number,
    deferredPaths:Record<string,boolean>,
    deferredHeap:Heap<DeferredSearch>,
    cachedQueries:Queries
}
export interface longQueryArgs {
    quickSearch:boolean,
    fsNodes:FsNode[],
    searchQuery:string,
    isQueryLong:boolean
}
export interface UpdateSearchArgs {
    fsNode:FsNode,
    fsNodes:FsNode[],
    searchQuery:string,
    isLastFsNode:boolean,
    processedBatches:number[]
}
export interface searchInBreadthArgs {
    rootPath:string,
    searchQuery:string,
    heavyFolderQueue:string[],
    processHeavyFolders:boolean,
    startTime:number
}
export interface searchInModeArgs {
    quickSearch:boolean,
    batchThunk:AppThunk<Promise<void>>,
    isLastFsNode:boolean,
    node:FsNode,
    searchQuery:string
}
export interface  TabCacheInvalidation {
    Home:boolean,
    Desktop:boolean,
    Downloads:boolean,
    Documents:boolean,
    Pictures:boolean,
    Music:boolean,
    Videos:boolean
}
export interface Message {
    id:string,
    message:string | null
}
export interface NodeProgress {
    path:string | null,
    save:boolean
}
export interface SearchResult {
    node:FsNode,
    score:number
}
export interface processingSliceState {//by using null unions instead of optional types,i ensure that my app doesnt accidenteally worked with an undefined value
    currentPath:string,//as breadcrumbs
    tabNames:string[],//home tabs
    fsNodes:FsNode[] | null,//current files loaded
    cache:Cache,
    invalidatedTabCache:TabCacheInvalidation,
    searchResults:SearchResult[] | null,
    terminateSearch:boolean,
    isDisplayingCaching:boolean,
    freezeNodes:boolean,
    freezeBars:boolean,
    quickSearch:boolean,
    nodeProgress:NodeProgress,//This is for number of nodes that have been searched during a search recursion
    selectedFsNodes:FsNode[] | null,//for selecting for deleting,copying or pasting
    error:Message//for writing app error
    notice:Message,//for writing app info
    sortBy:SortingOrder,//sorting order of the files
    viewBy:View,//changes the layout of the folder content
    showDetailsPane:boolean//to show extra details like charts or disk usage,
    openedFile:string | null,
    openedNode:FsNode | null
}