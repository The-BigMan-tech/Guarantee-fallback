import Heap from "heap-js";
import { AppThunk } from "../store";
import { selectQuickSearch } from "../selectors";
import { FsNode,readDirectory,FsResult} from "../../utils/rust-fs-interface";
import { getMatchScore } from "../../utils/fuzzy-engine";
import { setQuickSearch,setSearchTermination,clearNodeProgress,resetNodeProgress,setNodePath,saveNodeProgress,setSearchResults,spreadToSearch ,pushToSearch} from "../slice";
import { normalizeString } from "../../utils/string-utils";
import { longQueryArgs,UpdateSearchArgs,shouldSkip,ReuseQueryArgs,HeuristicsArgs,DirResult,Cache,searchInBreadthArgs,Queue,DeferredSearch, searchInModeArgs, SearchResult} from "../types";
import { Queries,heuristicsCache,RelevanceData,searchCache} from "../../utils/search-resumability";
import { isFolderHeavy } from "../../utils/folder-utils";
import { preprocessQuery,spellEngine } from "../../utils/spell-engine";
import { memConsoleLog } from "../../utils/log-config";
import { roundToTwo } from "../../utils/math-utils";
import { selectCache,selectFsNodes,selectSearchTermination,selectCurrentPath} from "../selectors";
import { aggressiveFilter } from "../../utils/string-utils";
import {toast,Flip} from 'react-toastify';
import { toastConfig} from "../../utils/toast-configs";
import { flushBatch } from "../../utils/search-resumability";

const searchHeap:Heap<SearchResult> = new Heap((a:SearchResult,b:SearchResult)=>b.score-a.score);
searchHeap.init([]);

function isLongQuery(searchQuery:string):boolean {
    return searchQuery.length >= 15;
}
function searchMatchScore(searchQuery:string,node:FsNode,minThreshold=15):number {
    const score1 = getMatchScore(searchQuery,node.primary.nodeName,minThreshold);
    let score2 = 0
    if (searchQuery.includes(".")) {
        score2 = getMatchScore(searchQuery,(node.primary.fileExtension || ""),minThreshold);
    }
    return (score2>score1)?score2:score1;
}
function getAcceptableScore(searchQuery:string):number {
    if (searchQuery.length <= 6) {
        return 20
    }
    return 40
}
function searchUtil(fsNodes:FsNode[],searchQuery:string):AppThunk<Promise<void>> {
    return async (dispatch,getState) => {//it uses the fuzzy engine to know which results to display
        console.log("FSNODES VALUE NOW",fsNodes);
        if (fsNodes) {
            const quickSearch:boolean = selectQuickSearch(getState());
            const matchedNodes:SearchResult[] = [] 
            const acceptableScore = getAcceptableScore(searchQuery)
            for (const node of fsNodes) {
                const score = searchMatchScore(searchQuery,node);
                console.log("MATCH SCORE","NODE:",node.primary.nodeName,"|SCORE:",score);
                if (score >= acceptableScore) {
                    const result = ({node,score})
                    matchedNodes.push(result);
                    if (!quickSearch) searchHeap.push(result);//only push to the heap for sorting when not in quick search mode
                }
            }
            console.log("MATCHED FS NODES",matchedNodes);
            if (matchedNodes.length) {//to reduce ui flickering,only spread to the search results if something matched
                dispatch(spreadToSearch(matchedNodes));
            };
        }
    }
}
function longQueryOptimization(args:longQueryArgs):AppThunk<boolean> {
    return (dispatch):boolean=>{
        //This early termination is done at the batch level
        const {quickSearch,fsNodes,searchQuery,isQueryLong} = args;
        if (quickSearch && isQueryLong) {//only performing this loop if quick search is on.it will be a waste if it runs on full search
            let anyRoughMatches:boolean = false
            for (const fsNodeInBatch of fsNodes) {
                const normalizedNode = normalizeString(fsNodeInBatch.primary.nodeName);//making it insensitive to file extensions because the node can be a folder or a file and he search query can target either depending on whether an extension was included or not
                const normalizedQuery = normalizeString(searchQuery);
                const isRoughMatch = (normalizedNode.startsWith(normalizedQuery))
                console.log("Quick search",quickSearch,"Query length",searchQuery.length,"Exact match",isRoughMatch,"trimmed node",normalizedNode,"trimmed query",normalizedQuery);
                if (isRoughMatch) {
                    console.log("Found early result!!");
                    dispatch(pushToSearch({node:fsNodeInBatch,score:0}));//the score here doesnt matter cuz this is used in quick search mode which doesnt use scores for sorting
                    anyRoughMatches = true
                }
            }
            return anyRoughMatches
        }
        return false
    }
}
function updateSearchResults(args:UpdateSearchArgs):AppThunk<Promise<void>> {
    return async (dispatch,getState) => {
        const {fsNode,fsNodes,searchQuery,isLastFsNode,processedBatches} = args;
        const quickSearch:boolean = selectQuickSearch(getState());
        const isQueryLong:boolean = isLongQuery(searchQuery);
        const processedBatchCount = processedBatches[0];
        let searchBatchSize:number = 1;//default batch size when no items have been processed

        if (processedBatchCount == 1) {//when one item has been processed
            searchBatchSize = 5
        }else if (processedBatchCount == 2) {//when two items have been processed
            searchBatchSize = 10
        }else if (processedBatchCount == 3) {//when three items have been processed
            searchBatchSize = 15
        }
        memConsoleLog('Search batch size: ',searchBatchSize,'fsnodes',processedBatchCount);
        fsNodes.push(fsNode)//push the files
        if ((fsNodes.length >= searchBatchSize) || (isLastFsNode)) {
            const anyRoughMatches:boolean = dispatch(longQueryOptimization({quickSearch,fsNodes,searchQuery,isQueryLong}))
            if (anyRoughMatches) {//i believe that this means that when it reaches the last node of the batch,it will check if there were any exact matches.if so,terminate and return else,proceed with fuzzy search
                console.log("Terminated early!!");
                dispatch(setSearchTermination(true));
                fsNodes.length = 0;
                return;//since it terminates the search,there is no need to keep track of batch counts.
            }else if (quickSearch && !(anyRoughMatches) && isQueryLong) {
                console.log("Discarded this batch");
                fsNodes.length = 0//prevents stale data
                processedBatches[0] += 1//increase the batch count that was processed
                return;
            }else {
                await dispatch(searchUtil(fsNodes,searchQuery));
                fsNodes.length = 0//prevents stale data
                processedBatches[0] += 1//increase the batch count that was processed
                return;
            }
        }
    }
}
function reuseQuery(args:ReuseQueryArgs):shouldSkip {
    const {key,currentSearchPath,sizeBonus,deferredPaths,deferredHeap,cachedQueries} = args
    const relevanceData = cachedQueries[key]
    const shouldDefer:boolean = relevanceData.shouldDefer;
    const relevancePercent = relevanceData.relevancePercent
    if (shouldDefer) {
        console.log("DEFERRED EARLY: ",currentSearchPath);
        deferredPaths[currentSearchPath] = true
        deferredHeap.push({path:currentSearchPath,priority:relevancePercent + sizeBonus})
        return true//skip the current iteration of the outer while loop of the caller
    }else {
        console.log("PROCESSED EARLY: ",currentSearchPath);
        return false//dont skip the current iteration of the outer while loop of the caller
    }
}
async function heuristicsAnalysis(args:HeuristicsArgs):Promise<shouldSkip> {
    const {deferredPaths,currentSearchPath,rootPath,processHeavyFolders,heavyFolderQueue,deferredHeap,searchQuery,nodeResult} = args;
    const isDeferred:boolean = deferredPaths[currentSearchPath] || false;
    console.log((!isDeferred)?`CURRENT SEARCH PATH ${currentSearchPath}`:`CURRENTLY PROCESSING DEFERRED PATH: ${currentSearchPath}`);
    if ((currentSearchPath === rootPath) || isDeferred) {//only perform heuristics on sub folders of the root path cuz if not,the root path will be forever deferred if it doesnt match the heuristics not to mention its a waste of runtime to do it on the root since the root must always be searched and i also dont want it to perform relvance calc on something that has already gone through it like deferred paths when the deferred queue has its turn.    
        return false
    }
    const totalNodes = nodeResult.length || 1;//fallback for edge cases where totalNodes may be zero
    const sizeBonus:number = roundToTwo( (1 / (1 + totalNodes)) * 5);//added size bonus to make ones with smaller sizes more relevant and made it range from 0-5 so that it doesnt negligibly affects the relevance score

    //utilizing the resumability cache before falling back to computing heuristics
    const cachedQueries:Queries = await heuristicsCache.get(currentSearchPath) || {};
    console.log('SEARCH PATH: |',currentSearchPath,'|CACHED QUERIES: |',JSON.stringify(cachedQueries,null,2));
    const reuseQueryArgs:ReuseQueryArgs = {key:"",currentSearchPath,sizeBonus,deferredPaths,deferredHeap,cachedQueries}
    if (searchQuery in cachedQueries) {
        return reuseQuery({...reuseQueryArgs,key:searchQuery})
    }else {
        for (const queryKey of Object.keys(cachedQueries)) {
            const similarityThreshold = 40
            const querySimilarity = getMatchScore(searchQuery,queryKey,10)
            console.log(' processingSlice.ts:636 => heuristicsAnalysis => querySimilarity:', querySimilarity);
            if (querySimilarity > similarityThreshold) {//reusing the heuristics of previous similar queries
                return reuseQuery({...reuseQueryArgs,key:queryKey})
            }
        }
    }


    //static heuristics 
    if (!processHeavyFolders) {//this reads that if the search loop shouldnt process any heavy folders,then push it to the heavy folder queue for the next search loop
        if (isFolderHeavy(currentSearchPath)) {
            console.log("Deferred heavy folder:",currentSearchPath);
            heavyFolderQueue.push(currentSearchPath);
            return true//it can only match one path at a given time so we dont need to process the rest
        }
    }

    //dynamic heuristics.it uses the fuzzy engine to know which folder to prioritize first
    const relevanceThreshold = 50;
    const matchPercentThreshold = 80;

    let relevantNodes:number = 0;
    let relevancePercent:number = 0;
    //it defers the parent folder if its children arent relevant enough not that it defers its children.each child will have their own time
    for (const node of nodeResult) {
        const awaitedNode = await node;
        const matchScore = searchMatchScore(searchQuery,awaitedNode);
        const acceptableScore = getAcceptableScore(searchQuery)
        // console.log("MATCH SCORE","NODE:",awaitedNode.primary.nodeName,"|SCORE:",matchScore);
        
        if (matchScore >= acceptableScore) {//the number of matches increases qualitative relevance
            relevantNodes += 1
            relevancePercent = roundToTwo( (relevantNodes / totalNodes) * 100 )//to ensure that the relevance percent is always updated upon looping
            
            if ((relevancePercent >= relevanceThreshold) || (matchScore >= matchPercentThreshold)) { //the match score is used to check for the quality of the relevance
                console.log("SEARCH PATH:",currentSearchPath,"IS BEING PROCESSED IMMEDIATELY");
                const relevanceData:RelevanceData = {shouldDefer:false,relevancePercent}
                await heuristicsCache.set(currentSearchPath,{...cachedQueries,[searchQuery]:relevanceData});
                return false//early termination once enough relevance has been reached
            }
        };
    }
    console.log("HEURISTIC ANALYSIS OF ",currentSearchPath,"RELEV SCORE",relevancePercent);
    if ((relevancePercent + sizeBonus) < relevanceThreshold) {//defer if it isnt relevant enough or if it isnt flagged to process immediately
        console.log("DEFERRED SEARCH PATH: ",currentSearchPath,'PRIORITY',relevancePercent,"WITH SIZE BONUES",relevancePercent + sizeBonus);
        deferredPaths[currentSearchPath] = true
        deferredHeap.push({path:currentSearchPath,priority:relevancePercent + sizeBonus});//defer for later.it defers the current search path unlike the static heuristics
        const relevanceData:RelevanceData = {shouldDefer:true,relevancePercent}
        await heuristicsCache.set(currentSearchPath,{...cachedQueries,[searchQuery]:relevanceData});
        return true; // Skip processing now
    }else {
        return false
    }
}
function getDirResult(currentSearchPath:string,rootPath:string):AppThunk<Promise<DirResult>> {
    return async (_,getState)=>{
        const cache:Cache = selectCache(getState());
        const searchedData = await searchCache.get(currentSearchPath);
        console.log(' processingSlice.ts:682 => return => searchedData:', searchedData);
        if (currentSearchPath === rootPath) {//since the rootpath is the currentpath opened in the app,it will just select the fsnodes directly from the app state if its processing the rootpath
            console.log("SEARCHING ROOT PATH");
            return FsResult.Ok(selectFsNodes(getState()) || [])

        }else if (currentSearchPath in cache) {//fallback to the ui cache if its not currently opened
            console.log("USING CACHED FSNODES FOR", currentSearchPath);
            searchCache.delete(currentSearchPath)//removes it from the search cache since its in the ui cache to preserve memory
            return FsResult.Ok(cache[currentSearchPath]);

        }else if (searchedData) {//check if it has been searched before.the search cache is an in memory cache unlike my ui cache thats serialized to local storage so once the app is closed,the data is lost so its a last resort to not reading from the disk
            console.log("USING SEARCHED FSNODES FOR", currentSearchPath);
            return FsResult.Ok(searchedData)

        }else {//if none of the cases were fulfilled,read it from the disk
            const dirResult = await readDirectory(currentSearchPath,'arbitrary');//arbritrayry order is preferred here since it uses its own heuristic to prioritize folders over metadata like size.ill still leave the other options in the tauri side in case of future requirements
            if ((dirResult.value !== null) && !(dirResult.value instanceof Error)) {//cache before return so that it caches as it searches
                const result = await Promise.all(dirResult.value)
                await searchCache.set(currentSearchPath,result);
            };
            return dirResult;
        }
    }
}
//*This is the new async thunk pattern ill be using from hence forth,ill refactor the old ones once ive finsihed the project
function searchInBreadth(args:searchInBreadthArgs):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        const {rootPath,searchQuery,heavyFolderQueue,processHeavyFolders,startTime} = args;
        const queue:Queue = (processHeavyFolders)?heavyFolderQueue:[rootPath];//switch to heavy folders as called by the searchDir
        const deferredPaths:Record<string,boolean> = {};
        const deferredHeap = new Heap((a:DeferredSearch, b:DeferredSearch) => b.priority - a.priority);
        deferredHeap.init([]);

        while ((queue.length > 0) || !(deferredHeap.isEmpty())) {
            console.log("Queue value:",queue);
            const shouldTerminate:boolean = selectSearchTermination(getState());
            if (shouldTerminate) {
                await dispatch(cleanUp(startTime))
                return
            }
            const currentSearchPath = queue.shift()!;
            const dirResult:DirResult = await dispatch(getDirResult(currentSearchPath,rootPath))
            pushDeferredPaths(queue,deferredHeap);
            console.log("DIR RESULT",dirResult.value);

            if ((dirResult.value !== null) && !(dirResult.value instanceof Error)) {
                const nextIteration:shouldSkip = await heuristicsAnalysis({deferredPaths,currentSearchPath,rootPath,processHeavyFolders,heavyFolderQueue,deferredHeap,searchQuery,nodeResult:dirResult.value});
                if (nextIteration) {console.log("Continued the loop");continue}

                const fsNodes:FsNode[] = []//this is the batch used per dir level so that it doesnt directly call fuse on every node but rather in batches
                const processedBatches:number[] = [0];//im using this to track the number of batches per path to dynamically increase it for the best ux and perf.i had to make it an array to make all calls to the batch thunk under the path to mutate it.its safe here cuz its local per path
                const quickSearch:boolean = selectQuickSearch(getState());
                dispatch(displayPath(quickSearch,currentSearchPath));
                
                for (const [localIndex,fsNode] of dirResult.value.entries()) {
                    if (shouldTerminate) {
                        await dispatch(cleanUp(startTime))
                        return
                    }
                    const isLastFsNode = localIndex == (dirResult.value.length-1);
                    const awaitedFsNode = await fsNode;
                    const batchThunk = updateSearchResults({fsNode:awaitedFsNode,fsNodes,searchQuery,isLastFsNode,processedBatches});

                    console.log("Is last fsnode",isLastFsNode);
                    if (awaitedFsNode.primary.nodeType == "File") {//passing islast is necessary for quick search even if it matches or not because it needs to terminate the batch if the one that survived is the only match for example and not the last at the same time
                        await dispatch(searchInMode({quickSearch,batchThunk,isLastFsNode,searchQuery,node:awaitedFsNode}))
                    }else if (awaitedFsNode.primary.nodeType == "Folder") {
                        await dispatch(searchInMode({quickSearch,batchThunk,isLastFsNode,searchQuery,node:awaitedFsNode}))
                        queue.push(awaitedFsNode.primary.nodePath);//push the folder to the queue after processing.it may be deferred by the algorithm based on heuristics
                    }
                }
                dispatch(sortSearchResults(quickSearch,shouldTerminate))
                dispatch(saveNodeProgress());
                deferredPaths[currentSearchPath] = false//this is just a cleanup and it wont affect the flow because it has been processed and shifted from the queue so it isnt possible for it to enter the queue and be deferred again
            }
        }
    }
}
export function searchDir(searchQuery:string,startTime:number):AppThunk<Promise<void>> {
    return async (dispatch,getState)=>{
        console.log("SEARCH QUERY LENGTH",searchQuery.length);
        //debouncing this function never works so what i did to prevent spamming is to terminate the previoud search before instatiating this new one
        dispatch(setSearchTermination(true));
        dispatch(setSearchTermination(false));
        dispatch(setSearchResults([]));
        searchHeap.clear();

        const quickSearch = selectQuickSearch(getState());
        const currentPath:string = selectCurrentPath(getState());
        const heavyFolderQueue:string[] = [];
        searchQuery = runSpellChecker(searchQuery,quickSearch)

        await dispatch(searchInBreadth({rootPath:currentPath,searchQuery,heavyFolderQueue,processHeavyFolders:false,startTime}));
        if (!quickSearch) {//only run the second search loop in full search mode
            await dispatch(searchInBreadth({rootPath:currentPath,searchQuery,heavyFolderQueue,processHeavyFolders:true,startTime}));
        }
        const forceTermination:boolean = selectSearchTermination(getState());
        if (!forceTermination) {//only run this if the user didsnt forcefully terminate the search as the search termination check in the search in breadth function already does this when the user terminates the search midway
            console.log("REGULAR SEARCH TERMINATION");
            await dispatch(cleanUp(startTime))
            dispatch(setSearchTermination(true));
        }
    }
}
export function clearSearchResults():AppThunk {
    return (dispatch)=>{
        dispatch(setSearchResults(null));
        dispatch(setSearchTermination(true));
    }
}
function displaySearchTime(startTime:number) {
    const endTime = performance.now();
    const timeInMs = endTime - startTime;
    const timeInSeconds = (timeInMs / 1000).toFixed(3);
    toast.dismiss();
    toast.success(`Done searching in ${timeInSeconds} seconds`,{...toastConfig,autoClose:500,transition:Flip,position:"bottom-right"});
}
function cleanUp(startTime:number):AppThunk<Promise<void>> {
    return async (dispatch)=>{
        console.log("FORCEFUL SEARCH TERMINATION");
        dispatch(clearNodeProgress());
        displaySearchTime(startTime);
        await flushBatch();//flush the batch so that setters to the local storage can work
        return
    }
}
function displayPath(quickSearch:boolean,currentSearchPath:string):AppThunk {
    return (dispatch)=>{
        if (!quickSearch) {//only show progress of crawled folders on full search
            dispatch(resetNodeProgress());
            dispatch(setNodePath(currentSearchPath));
        }
    }
}
function searchInMode(args:searchInModeArgs):AppThunk<Promise<void>> {
    return async (dispatch)=>{
        const {quickSearch,node,searchQuery,batchThunk,isLastFsNode} = args;
        if (quickSearch) {
            if (isLastFsNode || aggressiveFilter(node.primary.nodeName,searchQuery) || aggressiveFilter(node.primary.fileExtension,searchQuery)) {
                console.log("PASSED YOUR NODE TO UPDATE",node.primary.nodePath);
                await dispatch(batchThunk)
            }else { console.log("Filtered out the NODE:",node.primary.nodePath);}
        }else {//update regardless
            await dispatch(batchThunk)
        }
    }
}
function pushDeferredPaths(queue:Queue,deferredHeap: Heap<DeferredSearch>) {
    if (queue.length === 0) {//add all deferred items to the queue after the queue for the dir level has been processed
        console.log("DEFERRED QUEUE",deferredHeap);
        for (const item of deferredHeap) {//This moves the deferred folders to main queue for processing
            queue.push(item.path)
        }
        deferredHeap.clear() // Clear deferred queue
    }
}
function runSpellChecker(searchQuery:string,quickSearch:boolean):string {
     //im only adding query preprocessing and spell correction only on full search mode because full search mode doesnt apply a cheap filter thats typo intolerant
    if (!spellEngine.correct(searchQuery) && !(quickSearch)) {//embedding typo checking and cleaning before taking it to the search engine
        memConsoleLog('Previous searchQuery:', searchQuery);
        const preprocessedQuery = preprocessQuery(searchQuery)
        const suggestions = spellEngine.suggest(preprocessedQuery);//only make a suggestion on the preprocessed query separately so that the original query wont me mutated if no suggestion was found
        searchQuery = (suggestions.length)?suggestions[0]:preprocessedQuery
        memConsoleLog(' Suggestions:', suggestions);
        memConsoleLog(`New Search query "${searchQuery}":`);
    }
    return searchQuery
}
function sortSearchResults(quickSearch:boolean,forceTermination:boolean):AppThunk {
    return (dispatch)=>{
        if (!(quickSearch) && !(forceTermination)) {
            const sortedResults:SearchResult[] = [];
            for (const result of searchHeap) {//This moves the deferred folders to main queue for processing
                sortedResults.push(result)
            }
            dispatch(setSearchResults(sortedResults));
        }
    }
}
export function terminateSearch():AppThunk {
    return (dispatch)=>{
        dispatch(setSearchTermination(true))
        toast.dismiss();
        toast.info("Search terminated",{...toastConfig,autoClose:500,transition:Flip});
    }
}
export function toggleQuickSearch():AppThunk {
    return (dispatch,getState)=>{
        const quickSearch:boolean = selectQuickSearch(getState());
        dispatch(setQuickSearch(!(quickSearch)))
    }
}