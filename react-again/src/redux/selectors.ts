import { RootState } from "./store";
import { FsNode } from "../utils/rust-fs-interface";
import { Message,SortingOrder,View,NodeProgress,TabCacheInvalidation,Cache, SearchResult} from "./types";

export const selectCurrentPath = (store:RootState):string => store.processing.currentPath;
export const selectTabNames = (store:RootState):string[] => store.processing.tabNames;
export const selectFsNodes = (store:RootState):FsNode[] | null => store.processing.fsNodes;
export const selectSelectedFsNodes = (store:RootState):FsNode[] | null => store.processing.selectedFsNodes;
export const selectError = (store:RootState):Message => store.processing.error;
export const selectNotice = (store:RootState):Message => store.processing.notice;
export const selectSearchResults = (store:RootState):SearchResult[] | null => store.processing.searchResults;
export const selectSearchResultLen =  (store:RootState):number | undefined => store.processing.searchResults?.length;
export const selectSortBy = (store:RootState):SortingOrder => store.processing.sortBy;
export const selectViewBy = (store:RootState):View => store.processing.viewBy;
export const selectShowDetails = (store:RootState):boolean => store.processing.showDetailsPane;
export const selectSearchTermination = (store:RootState):boolean =>store.processing.terminateSearch;
export const selectQuickSearch = (store:RootState):boolean=>store.processing.quickSearch;
export const selectNodeProgress = (store:RootState):NodeProgress=>store.processing.nodeProgress;
export const selectOpenedFile = (store:RootState):string | null =>store.processing.openedFile;
export const selectCache = (store:RootState):Cache =>store.processing.cache;
export const selectIvalidatedTabs = (store:RootState):TabCacheInvalidation=>store.processing.invalidatedTabCache
export const selectIsDisplayingCache = (store:RootState)=>store.processing.isDisplayingCaching;
export const selectFreezeNodes = (store:RootState)=>store.processing.freezeNodes;
export const selectFreezeBars = (store:RootState)=>store.processing.freezeBars;