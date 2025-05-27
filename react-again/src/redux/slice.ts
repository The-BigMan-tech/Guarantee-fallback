import { createSlice,PayloadAction} from '@reduxjs/toolkit'
import { processingSliceState,Cache,CachePayload,invalidationData,CachingState,SortingOrder,View} from './types'
import {v4 as uniqueID} from 'uuid';
import { FsNode } from '../utils/rust-fs-interface';

const initialState:processingSliceState = {
    currentPath:"",
    tabNames:['Desktop','Downloads','Documents','Pictures','Music','Videos'],//Home and recent are only local to sidebar cuz there is no dir named home and recent on the fs
    fsNodes:null,
    cache:{},
    aheadCachingState:'pending',
    invalidatedTabCache:{Home:true,Desktop:true,Downloads:true,Documents:true,Pictures:true,Music:true,Videos:true},
    selectedFsNodes:null,
    error:{id:"",message:null},//the ids is to ensure that the same error can pop up twice
    notice:{id:"",message:null},
    loadingMessage:"loading",//no id here because only one thing can be loaded at a time
    searchResults:null,
    searchScores:[],
    nodeProgress:{path:'',save:false},
    terminateSearch:true,
    quickSearch:true,
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
        setAheadCachingState(state,action:PayloadAction<CachingState>) {
            state.aheadCachingState = action.payload
        },
        invalidateTabCache(state,action:PayloadAction<invalidationData>) {
            state.invalidatedTabCache[action.payload.tabName] = true
            console.log("Invalidated the tab",state.invalidatedTabCache[action.payload.tabName]);
        },
        validateTabCache(state,action:PayloadAction<invalidationData>) {
            state.invalidatedTabCache[action.payload.tabName] = false
        },
        setSearchResults(state,action:PayloadAction<FsNode[] | null>) {
            state.searchResults = action.payload
        },
        setSearchTermination(state,action:PayloadAction<boolean>) {
            state.terminateSearch = action.payload
        },
        setQuickSearch(state,action:PayloadAction<boolean>) {
            state.quickSearch = action.payload
        },
        spreadToSearch(state,action:PayloadAction<FsNode[]>) {
            state.searchResults = [...(state.searchResults || []),...action.payload]
        },
        pushToSearch(state,action:PayloadAction<FsNode>) {
            state.searchResults = state.searchResults || []
            state.searchResults.push(action.payload)
        },
        pushToSearchScores(state,action:PayloadAction<number>) {
            state.searchScores.push(action.payload)
        },
        setSearchScores(state,action:PayloadAction<number[]>) {
            state.searchScores = action.payload
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
        setLoadingMessage(state,action:PayloadAction<string | null>) {
            state.loadingMessage = action.payload
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
    setAheadCachingState,
    invalidateTabCache,
    validateTabCache,
    setError,
    setNotice,
    setLoadingMessage,
    setSearchResults,
    setSearchTermination,
    setQuickSearch,
    spreadToSearch,
    pushToSearch,
    pushToSearchScores,
    setSearchScores,
    resetNodeProgress,
    clearNodeProgress,
    saveNodeProgress,
    setNodePath,
    setSortBy,
    setView,
    setShowDetails,
    setOpenedFile
} = processingSlice.actions;


export default processingSlice.reducer;