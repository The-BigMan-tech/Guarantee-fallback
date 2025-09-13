import CustomQueue from "./custom-queue.js";
import { LRUCache } from "lru-cache";
import { createKey,isWhitespace } from "../utils/utils.js";
import { DependencyManager } from "./dependency-manager.js";
import { Resolver } from "./resolver.js";
import { ParseHelper } from "./parse-helper.js";
import { ConsoleErrorListener } from "antlr4ng";

//The purger takes in a src document and by using a cache that maps each line to any arbitary data,the purger will compare it against the cached keys and return a purged src document which only contains the lines that changed and all other lines that the change depends on and the lines that also depends on that change.

//The caller should handle the responsibility of adding items to the cache.The purger just uses it to purge the input.

// It expects the cache to have a particular key format.So ensure the cache uses the createKey function in the utils to make the keys.It also manages stale entries and initializes new ones by using the given src document.So there is no need to manage that yourself but expect it to be mutated.

export class Purger {
    public static dependencyToDependents:Record<string,Set<string>> = {};
    
    private static refreshDependents(cache:LRUCache<string,any>,entry:string):void {
        const dependentsAsKeys = Purger.dependencyToDependents[entry];
        if (dependentsAsKeys) {
            console.log('\nDependents upon deletion: ',dependentsAsKeys);
            for (const dependentAsKey of dependentsAsKeys) {
                cache.delete(dependentAsKey);
            }
        }
    }
    private static deleteFromDependents(key:string):void {
        const refreshedMap:Record<string,Set<string>> = {};
        Object.entries(Purger.dependencyToDependents).forEach(([k,v])=>{
            if (k !== key) refreshedMap[k] = v;
        });
        Purger.dependencyToDependents = refreshedMap;
    }
    private static prepareDependencyMap(cache:LRUCache<string,any>,srcKeysAsSet:Set<string>):void {
        const dependencyKeys = [...Object.keys(Purger.dependencyToDependents),...Object.keys(Resolver.lineToAffectedLines)];
        const refreshedMap:Record<string,Set<string>> = {};
        
        for (const dependencyKey of dependencyKeys) {
            const regularDependents = Purger.dependencyToDependents[dependencyKey] || [];
            const dependentsAffectedFromErr = Resolver.lineToAffectedLines[dependencyKey] || [];
            const dependentKeys =  [...regularDependents,...dependentsAffectedFromErr];
            refreshedMap[dependencyKey] = new Set(dependentKeys);
            if (dependentKeys.some(key=>!srcKeysAsSet.has(key))) {
                cache.delete(dependencyKey);//refresh the dependeny if any of the dependents change.but this doesnt mean that the dependency isnt in the src.It may still be in the src,but we want it to be reanalyzed.If its still in the src,the effect of this is to reanalyze only this line without reanalyzing all its dependents.So a change in dependent will only reanalyze the dependency without hacving to reanalyze all other depdnents
            }
        }
        Purger.dependencyToDependents = refreshedMap;
        Resolver.lineToAffectedLines = {};//clear it because its only needed for merging into the main one and it shouldnt linger any longer to prevent stale entries
    }
    public static purge<V extends object>(srcText:string,srcPath:string,cache:LRUCache<string,V>,emptyValue:V):string {
        let syntaxError:boolean = false;
        ConsoleErrorListener.instance.syntaxError = ():void =>{syntaxError = true;};

        const srcLines = Resolver.createSrcLines(srcText);
        const srcKeysAsSet = new Set(srcLines.map((content,line)=>createKey(line,content)));
        
        const unpurgedSrcLines = new CustomQueue<string>([]);
        const unpurgedKeys = new Set<string>();
        Purger.prepareDependencyMap(cache,srcKeysAsSet);//this must be called before the below for loop
        
        console.log('🚀 => :929 => updateStaticVariables => srcKeysAsSet:', srcKeysAsSet);
        
        const uniqueKeys = [...cache.keys()];
        for (const key of uniqueKeys) {
            const isNotInSrc = !srcKeysAsSet.has(key);
            if (isNotInSrc) {
                console.log('\nEntry not in src: ',key);
                cache.delete(key);
                Purger.refreshDependents(cache,key);//this block will cause all dependents to be reanalyzed upon deletetion.This must be done right before the key is deleted from the depedency map.
                Purger.deleteFromDependents(key);//afterwards,remove it from the map.
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
        
            const isADependency:boolean | undefined = (syntaxError)?undefined:manager.visit(ParseHelper.tree!);
            const shouldPurge = !syntaxError && inSameDocument && inCache && (isADependency === false);
        
            if (shouldPurge) {//if this condition is true,then this line will be purged out(not included) in the final text
                unpurgedSrcLines.unshift(" ");//i inserted whitespaces in place of the purged lines to preserve the line ordering
            }else {
                console.log('\nunshifting src line: ',key,'isDependency: ',isADependency,'inCache: ',inCache,'syntax err: ',syntaxError);   
                unpurgedSrcLines.unshift(srcLine);
                cache.delete(key);//remove from the cache entry since its going to be reanalyzed
                unpurgedKeys.add(key);

                //This block only includes the dependents of this src line if it is part of the lines that changed(by chdcking its presence in the cache),it is unpurged and its dependents are not unpurged already.
                if (!inCache) {//without this particular check,the purger will create a cascading effect where a changed line will load its dependencies,which in turn,will load all their dependents,which in turn will also load their dependencies and so fort,creating a ripple effect where a wide range of the document will be relaoded from one line alone.
                    const satisfiedDependents = manager.satisfiedDependents;
                    const dependentKeys:string[] = [];

                    for (const dependent of satisfiedDependents) {
                        dependentKeys.push(dependent.uniqueKey);
                        if (!unpurgedKeys.has(dependent.uniqueKey)) {//this prevents depencies from wiping out the progress of dependnets
                            console.log('Inserting dependent: ',dependent.uniqueKey);
                            cache.delete(dependent.uniqueKey);
                            unpurgedSrcLines.set(dependent.line - line,dependent.srcLine);
                        }
                    }
                    Purger.dependencyToDependents[key] = new Set(dependentKeys);
                }
            }
            //Initiate all src lines into the cache with empty diagnostics to mark the lines as visited.It must be done after deciding to purge it and before calling the resolver function.This is because this it intializes all keys in the cache with empty diagnostics and as such,purging after this will falsely prevent every text from entering the purged text to be analyzed.
            if (!isWhitespace(key) && !cache.has(key)) {//we dont want to override existing entries
                cache.set(key,emptyValue);
            }
            syntaxError = false;
        }
        const unpurgedSrcText:string = unpurgedSrcLines.array().join('\n');
        console.log('\nDependency to dependents: ',Purger.dependencyToDependents);
        console.log('🚀 => :1019 => analyzeDocument => unpurgedSrcText:', unpurgedSrcText);
        return unpurgedSrcText;
    }
}