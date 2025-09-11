import CustomQueue from "./custom-queue.js";
import { LRUCache } from "lru-cache";
import { createKey, isWhitespace } from "../utils/utils.js";
import { DependencyManager } from "./dependency-manager.js";
import { Resolver } from "./resolver.js";
import { ParseHelper } from "./parse-helper.js";

//the cache used by the purger should map src lines to whatever value they are meant to hold
//It expects the cache to have a particular key format as defined in the createKey function
//It mutates the cache in place
interface PurgeResult<V> {
    unpurgedSrcText:string,
    purgedEntries:V[]
}
export class Purger {
    public static purge<V extends object>(srcText:string,srcPath:string,cache:LRUCache<string,V>,emptyValue:V):PurgeResult<V> {
        const srcLines = Resolver.createSrcLines(srcText);
        const unpurgedSrcLines = new CustomQueue<string>([]);
        const srcKeysAsSet = new Set(srcLines.map((content,line)=>createKey(line,content)));
        
        const entries = [...cache.keys()];
        const purgedEntries:V[] = [];
        const unpurgedKeys = new Set<string>();

        console.log('🚀 => :929 => updateStaticVariables => srcKeysAsSet:', srcKeysAsSet);

        for (const entry of entries) {
            const isNotInSrc = !srcKeysAsSet.has(entry);
            if (isNotInSrc) {
                if (!Resolver.wasTerminated) {//the was terminated flag allows diagnotics to remain even when other errors show up
                    cache.delete(entry);
                }
            }
        }
        //it purges the src text backwards to correctly include sentences that are dependencies of others.But the final purged text is still in the order it was written because i insert them at the front of another queue.backwards purging prevents misses by ensuring that usage is processed before declaration.
        for (let line = (srcLines.length - 1 ); line >= 0 ;line--) {
            const srcLine = srcLines[line];
            const key = createKey(line,srcLine);
            const inCache = cache.has(key);

            const inSameDocument = srcPath === Resolver.lastDocumentPath;//i tied the choice to purge to whether the document path has changed.This is to sync it properly with static variables that are also tied to te document's path

            const manager = new DependencyManager({key,line,srcLine,srcLines,inCache});
            ParseHelper.parse(srcLine);

            const isADependency = manager.visit(ParseHelper.tree!);
            const shouldPurge = inSameDocument && inCache && !isADependency;
        
            if (shouldPurge) {//if this condition is true,then this line will be purged out(not included) in the final text
                purgedEntries.push(cache.get(key)!);
                unpurgedSrcLines.unshift(" ");//i inserted whitespaces in place of the purged lines to preserve the line ordering
            }else {
                console.log('\nunshifting src line: ',key,'isDependency: ',isADependency,'inCache: ',inCache);   
                unpurgedSrcLines.unshift(srcLine);
                cache.delete(key);//remove from the cache entry since its going to be reanalyzed
                unpurgedKeys.add(key);

                //This block only includes the dependents of this src line if it is part of the lines that changed(by chdcking its presence in the cache),it is unpurged and its dependents are not unpurged already.
                if (!inCache) {//without this particular check,the purger will create a cascading effect where a changed line will load its dependencies,which in turn,will load all their dependents,which in turn will also load their dependencies and so fort,creating a ripple effect where a wide range of the document will be relaoded from one line alone.
                    const satisfiedDependents = manager.satisfiedDependents;
                    for (const dependent of satisfiedDependents) {
                        if (!unpurgedKeys.has(dependent.uniqueKey)) {//this prevents depencies from wiping out the progress of dependnets
                            console.log('Inserting dependent: ',dependent.uniqueKey);
                            cache.delete(dependent.uniqueKey);
                            unpurgedSrcLines.set(dependent.line-line,dependent.srcLine);
                        }
                    }
                }
            }
            //Initiate all src lines into the cache with empty diagnostics to mark the lines as visited.It must be done after deciding to purge it and before calling the resolver function.This is because this it intializes all keys in the cache with empty diagnostics and as such,purging after this will falsely prevent every text from entering the purged text to be analyzed.
            if (!isWhitespace(key) && !cache.has(key)) {//we dont want to override existing entries
                cache.set(key,emptyValue);
            }
        }
        const unpurgedSrcText:string = unpurgedSrcLines.array().join('\n');
        return {unpurgedSrcText,purgedEntries};
    }
}