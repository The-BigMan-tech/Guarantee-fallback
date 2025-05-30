import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { processingSliceState,Cache,CachePayload,invalidationData,SortingOrder,View, SearchResult} from './types'
import {v4 as uniqueID} from 'uuid';
import { FsNode } from '../utils/rust-fs-interface';

const initialState:processingSliceState = {
    currentPath:"",
    tabNames:['Desktop','Downloads','Documents','Pictures','Music','Videos'],//Home and recent are only local to sidebar cuz there is no dir named home and recent on the fs
    fsNodes:null,
    cache:{},
    invalidatedTabCache:{Home:true,Desktop:true,Downloads:true,Documents:true,Pictures:true,Music:true,Videos:true},
    selectedFsNodes:null,
    error:{id:"",message:null},//the ids is to ensure that the same error can pop up twice
    notice:{id:"",message:null},
    searchResults:null,
    nodeProgress:{path:'',save:false},
    isDisplayingCaching:false,//used as ui control to prevent the fsnodes from slicing when caching is taking place
    terminateSearch:true,
    quickSearch:true,
    freezeNodes:false,
    freezeBars:false,
    sortBy:'name',
    viewBy:'details',
    showDetailsPane:true,
    openedFile:null
}
export const processingSlice = createSlice({
    name: 'processing',
    initialState,
    reducers: {
        setCurrentPath(state,action:PayloadAction<string>) {
            state.currentPath = action.payload
        },
        setFsNodes(state,action:PayloadAction<FsNode[] | null>) {
            state.fsNodes = action.payload
        },
        spreadToFsNodes(state,action:PayloadAction<FsNode[]>) {
            state.fsNodes = [...(state.fsNodes || []),...action.payload]
        },
        setCache(state,action:PayloadAction<Cache>) {
            state.cache = action.payload
        },
        recordInCache(state,action:PayloadAction<CachePayload>) {
            state.cache[action.payload.path] = action.payload.data
        },
        //its the same effect as shifting but it does this starting from index 8 so that the ones that are cached ahead of time will be preserved on the cache threshold
        shiftCache(state) {
            const ninthKey = Object.keys(state.cache)[9];
            if (ninthKey !== undefined) {
                state.cache = Object.fromEntries(
                    Object.entries(state.cache).filter(([key]) => key !== ninthKey)
                );
            }
        },
        invalidateTabCache(state,action:PayloadAction<invalidationData>) {
            state.invalidatedTabCache[action.payload.tabName] = true
            console.log("Invalidated the tab",state.invalidatedTabCache[action.payload.tabName]);
        },
        validateTabCache(state,action:PayloadAction<invalidationData>) {
            state.invalidatedTabCache[action.payload.tabName] = false
        },
        setSearchTermination(state,action:PayloadAction<boolean>) {
            state.terminateSearch = action.payload
        },
        setQuickSearch(state,action:PayloadAction<boolean>) {
            state.quickSearch = action.payload
        },
        setSearchResults(state,action:PayloadAction<SearchResult[] | null>) {
            state.searchResults = action.payload
        },
        spreadToSearch(state,action:PayloadAction<SearchResult[]>) {
            state.searchResults = [...(state.searchResults || []),...action.payload]
        },
        pushToSearch(state,action:PayloadAction<SearchResult>) {
            state.searchResults = state.searchResults || []
            state.searchResults.push(action.payload)
        },
        resetNodeProgress(state) {
            state.nodeProgress = {path:'',save:false}
        },
        clearNodeProgress(state) {
            state.nodeProgress = {path:null,save:false}
        },
        saveNodeProgress(state) {
            state.nodeProgress.save = true
        },
        setNodePath(state,action:PayloadAction<string>) {
            state.nodeProgress.path = action.payload
        },
        setError(state,action:PayloadAction<string>) {
            state.error.id = uniqueID();
            state.error.message = action.payload;
        },
        setNotice(state,action:PayloadAction<string>) {
            state.notice.id = uniqueID();
            state.notice.message = action.payload
        },
        setSortBy(state,action:PayloadAction<SortingOrder>) {
            state.sortBy = action.payload
        },
        setView(state,action:PayloadAction<View>) {
            state.viewBy = action.payload
        },
        setShowDetails(state,action:PayloadAction<boolean>) {
            state.showDetailsPane = action.payload
        },
        setOpenedFile(state,action:PayloadAction<FsNode | null>) {
            state.openedFile = action.payload
        },
        setIsDisplayingCache(state,action:PayloadAction<boolean>) {
            state.isDisplayingCaching = action.payload
        },
        setFreezeNodes(state,action:PayloadAction<boolean>) {
            state.freezeNodes = action.payload
        },
        setFreezeBars(state,action:PayloadAction<boolean>) {
            state.freezeBars = action.payload
        }
    },
})

export const {
    setCurrentPath,
    setFsNodes,
    spreadToFsNodes,
    setCache,
    recordInCache,
    shiftCache,
    invalidateTabCache,
    validateTabCache,
    setError,
    setNotice,
    setSearchResults,
    setSearchTermination,
    setQuickSearch,
    spreadToSearch,
    pushToSearch,
    resetNodeProgress,
    clearNodeProgress,
    saveNodeProgress,
    setNodePath,
    setSortBy,
    setView,
    setShowDetails,
    setOpenedFile,
    setIsDisplayingCache,
    setFreezeNodes,
    setFreezeBars
} = processingSlice.actions;


export default processingSlice.reducer;