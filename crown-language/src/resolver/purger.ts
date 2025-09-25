import { LRUCache } from "lru-cache";
import { createKey } from "../utils/utils.js";
import { DependencyManager } from "./dependency-manager.js";
import { Resolver } from "./resolver.js";
import { ParseHelper } from "./parse-helper.js";
import { ConsoleErrorListener } from "antlr4ng";
import Denque from "denque";
import { phaseManager, ResolutionState, state } from "./state.js";

//The purger takes in a src document and by using a cache that maps each line to any arbitary data,the purger will compare it against the cached keys and return a purged src document which only contains the lines that changed and all other lines that the change depends on and the lines that also depends on that change.

//The caller should handle the responsibility of adding items to the cache.The purger just uses it to purge the input.

// It expects the cache to have a particular key format.So ensure the cache uses the createKey function in the utils to make the keys.It also manages stale entries and initializes new ones by using the given src document.So there is no need to manage that yourself but expect it to be mutated.

//The purger may be one line change late in delivering updates because of the operation order but is required for predictability and correctness.

//Although it is robust for incremental resolution,its more stable to use for live analysis where some of its limitations are acceptable than to produce incremental output
export class Purger<V extends object> {
    public static dependencyToDependents:Record<string,Set<string>> = {};
    private dependents:ResolutionState['dependents'];

    private inSameDocument:boolean;
    private cache:LRUCache<string,V>;
    private syntaxError:boolean = false;
    private unpurgedSrcLines = new Denque<string>();
    public static srcKeysAsSet = new Set<string>();
    private srcLines:string[];

    constructor(srcText:string,srcPath:string,cache:LRUCache<string,V>) {
        phaseManager.sendToActor('READ');
        this.dependents = state('dependents');
        this.cache = cache;
        this.srcLines = Resolver.createSrcLines(srcText);
        Purger.srcKeysAsSet = new Set(this.srcLines.map((content,line)=>createKey(line,content as string)));
        this.inSameDocument = srcPath === Resolver.lastDocumentPath;//i tied the choice to purge to whether the document path has changed.This is to sync it properly with static variables that are also tied to te document's path
        ConsoleErrorListener.instance.syntaxError = ():void =>{this.syntaxError = true;};
    }
    private prepareDependencyMap():void {
        const dependencyKeys = [...Object.keys(Purger.dependencyToDependents),...Object.keys(Resolver.lineToAffectedLines)];
        const refreshedMap:Record<string,Set<string>> = {};
        
        for (const dependencyKey of dependencyKeys) {
            const regularDependents = Purger.dependencyToDependents[dependencyKey] || [];
            const dependentsAffectedFromLine = Resolver.lineToAffectedLines[dependencyKey] || [];
            const dependentKeys =  [...regularDependents,...dependentsAffectedFromLine];
            refreshedMap[dependencyKey] = new Set(dependentKeys);
            if (dependentKeys.some(key=>!Purger.srcKeysAsSet.has(key))) {
                this.cache.delete(dependencyKey);//refresh the dependeny if any of the dependents change.but this doesnt mean that the dependency isnt in the src.It may still be in the src,but we want it to be reanalyzed.If its still in the src,the effect of this is to reanalyze only this line without reanalyzing all its dependents.So a change in dependent will only reanalyze the dependency without hacving to reanalyze all other depdnents
            }
        }
        Purger.dependencyToDependents = refreshedMap;
        Resolver.lineToAffectedLines = {};//clear it because its only needed for merging into the main one and it shouldnt linger any longer to prevent stale entries
    }
    private refreshDependents(key:string):void {
        const dependentsAsKeys = Purger.dependencyToDependents[key];
        if (dependentsAsKeys) {
            for (const dependentAsKey of dependentsAsKeys) {
                console.log('\nremoved dependent: ',dependentAsKey);
                this.cache.delete(dependentAsKey);
            }
        }
    }
    private updateCache():void {
        const uniqueKeys = [...this.cache.keys()];
        for (const key of uniqueKeys) {
            const isInSrc = Purger.srcKeysAsSet.has(key);
            const sentencesAreEmpty = Resolver.visitedSentences.size === 0;
            if (sentencesAreEmpty || !isInSrc || Resolver.linesWithIssues.has(key)) {
                console.log('\nEntry to refresh: ',key,'in src: ',isInSrc,'issues: ',Resolver.linesWithIssues.has(key));
                this.cache.delete(key);
                this.refreshDependents(key);//this block will cause all dependents to be reanalyzed upon deletetion.This must be done right before the key is deleted from the depedency map.
                delete Purger.dependencyToDependents[key];//afterwards,remove it from the map.
                if (!isInSrc) Resolver.linesWithIssues.delete(key);//this is to ensure it only deletes it when it isnt in the src not just because it has a semantic error.This state is also updated elseqhere in the resolver to keep it up to date.
            }
        }
    }
    private produceFinalSrc():void {
        phaseManager.sendToActor('UPDATE');
        //it purges the src text backwards to correctly include sentences that are dependencies of others.But the final purged text is still in the order it was written because i insert them at the front of another queue.backwards purging prevents misses by ensuring that usage is processed before declaration.
        for (let line = (this.srcLines.length - 1 ); line >= 0 ;line--) {
            const srcLine = this.srcLines[line];
            ParseHelper.parse(srcLine);

            const key = createKey(line,srcLine);
            const inCache = this.cache.has(key);//notice that i used inCache and not inSrc to determine the purge decision here.This is because (inCache == inSrc) but (inSrc !== inCache).The presence in the cache is the ultimate factor because it needs to be synchronized completely with what is actually in the cache to avoid state bugs.

            const manager = new DependencyManager({key,line,srcLine,srcLines:this.srcLines,inCache,dependents:this.dependents});
            const isADependency:boolean | undefined = (this.syntaxError)?undefined:manager.visit(ParseHelper.tree!);        
            
            const shouldPurge = !this.syntaxError && this.inSameDocument && inCache && (isADependency === false);
            if (shouldPurge) {//if this condition is true,then this line will be purged out(not included) in the final text
                this.unpurgedSrcLines.unshift(" ");//i inserted whitespaces in place of the purged lines to preserve the line ordering
            }else {
                console.log('\nunshifting src line: ',key,'isDependency: ',isADependency,'inCache: ',inCache,'syntax err: ',this.syntaxError);   
                this.unpurgedSrcLines.unshift(srcLine);
            }
            Purger.dependencyToDependents[key] = new Set(manager.satisfiedDependents.map(dependent=>dependent.uniqueKey));
            this.syntaxError = false;
            state('updateDependents')(this.dependents);
        }
    }
    public purge():string {//the order of operations here is very important.
        this.prepareDependencyMap();
        this.updateCache();
        this.produceFinalSrc();
        const unpurgedSrcText:string = this.unpurgedSrcLines.toArray().join('\n');

        console.log('🚀 => :929 => updateStaticVariables => srcKeysAsSet:',Purger.srcKeysAsSet);
        console.log('\nDependency to dependents: ',Purger.dependencyToDependents);
        console.log('🚀 => :1019 => analyzeDocument => unpurgedSrcText:', unpurgedSrcText);
        return unpurgedSrcText;
    }
}
