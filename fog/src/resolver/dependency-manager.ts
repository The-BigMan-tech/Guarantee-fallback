import { DSLVisitor } from "../generated/DSLVisitor.js";
import { DSLLexer } from "../generated/DSLLexer.js";
import { Token } from "antlr4ng";
import { ParseTree } from "antlr4ng";
import { ProgramContext,FactContext,AliasDeclarationContext } from "../generated/DSLParser.js";
import { isWhitespace,ReportKind,xand } from "../utils/utils.js";
import { Resolver } from "./resolver.js";
import { ParseHelper } from "./parse-helper.js";

export interface Dependent {
    includeDependency:boolean,
    uniqueKey:string,
    srcLine:string,//good to keep in handy for debugging
    line:number,
    reference:boolean,
    alias:string | null,//a sentence can only have one alias.
    names:Set<string>,
    settledRef:boolean,
    settledAlias:boolean,
    unsettledNames:Set<string>
}
export class DependencyManager extends DSLVisitor<boolean | undefined> {
    public static dependents:(Dependent | null)[] = [];
    public static encounteredAliasLine:number | null = null;

    public satisfiedDependents:Dependent[] = [];//this one unlike dependents collects dependents for the particular dependency
    private includeAsDependency:boolean = false;

    private line:number;
    private srcLine:string;
    private srcLines:string[];
    private inCache:boolean;
    private uniqueKey:string;

    constructor(args:{key:string,line:number,srcLine:string,srcLines:string[],inCache:boolean}) {
        const {line,srcLine,srcLines,inCache,key} = args;
        super();
        this.line = line;
        this.srcLine = srcLine;
        this.inCache = inCache;
        this.srcLines = srcLines;
        this.uniqueKey = key;
    }
    //please note that the properties on the dependnet,although looking identical to the ones under the current this context,arent the same.the ones on the this context used here is for the potential dependency but a dependency can also be a dependnent which is why the this context is used when adding it as a dependent
    private checkIfDependency(dependentIndex:number,contributed:boolean):void {
        const dependent = DependencyManager.dependents[dependentIndex]!;//this function is called under branches where the dependent isnt null.so we can safely asser it here.
        const {settledRef,settledAlias,unsettledNames} = dependent;

        const hasRef = dependent.reference;
        const hasAlias = dependent.alias !== null;

        const isFullySatisfied = xand(hasRef,settledRef) && xand(hasAlias,settledAlias) && (unsettledNames.size === 0);
        const isPartiallySatisfied = xand(hasRef,settledRef) || xand(hasAlias,settledRef) || (unsettledNames.size < dependent.names.size);
        
        if (contributed && (isPartiallySatisfied || isFullySatisfied)) {
            this.satisfiedDependents.push(dependent);
            if (dependent.includeDependency) this.includeAsDependency = true;//i gated the inclusion of dependencies for the deoendents to a flag to prevent them from polluting the final text if they are unrelated to the change.
            if (isFullySatisfied) {
                DependencyManager.dependents[dependentIndex] = null;//Using null to remove the dependent from further processing instead of direct deleting prevents index shifts and improves performance.
            }
        }
    }
    private checkForDependencies(tokens:Token[]):void {
        const includeDependency = (!this.inCache || this.includeAsDependency);
        const dependent:Dependent =  {
            includeDependency,
            uniqueKey:this.uniqueKey,
            srcLine:this.srcLine,
            line:this.line,
            reference:false,
            alias:null,
            names:new Set(),
            settledRef:false,
            settledAlias:false,
            unsettledNames:new Set()
        };
        for (const token of tokens) {
            const type = token.type;
            const text = token.text!;

            const refTypes = new Set([DSLLexer.SINGLE_SUBJECT_REF,DSLLexer.SINGLE_OBJECT_REF,DSLLexer.GROUP_SUBJECT_REF,DSLLexer.GROUP_OBJECT_REF,DSLLexer.GENERIC_REF]);

            if (!dependent.reference && refTypes.has(type)) {
                dependent.reference = true;
            }
            if (!dependent.alias && ((type === DSLLexer.ALIAS) || (type === DSLLexer.PREDICATE))) {//i made them be dependent because of their predicate so that alias declarations with the same name can reload them as dependents which will help catch the error of a predicate with the same name as an alias.This will essentially make all lines dependent and they wont be null unless there is a counter alias declaration.But it wont cause unnecessary reanalysis of lines.This is required for correctness
                dependent.alias = Resolver.stripMark(text);
            }
            if ((type === DSLLexer.NAME) && Resolver.isStrict(text)) {
                dependent.names.add(Resolver.stripMark(text));
            }
        }
        dependent.unsettledNames = new Set(dependent.names);//clone the set
        const isDependent =  (dependent.reference === true) || (dependent.alias !== null) || (dependent.unsettledNames.size > 0);
        if (isDependent) {
            DependencyManager.dependents.push(dependent);
        }
    }
    private settleDependents(tokens:Token[]):void {//this function doesnt try settling alias dependencies because they can only be done by alias declarations
        for (let i=0; i < DependencyManager.dependents.length; i++) {
            const dependent = DependencyManager.dependents[i];
            if (dependent === null) continue;

            let contributed = false;
            if (dependent.reference) {
                let checkLine = dependent.line! - 1;
                while ((checkLine > this.line) && isWhitespace(this.srcLines[checkLine])) {
                    checkLine--; // skip whitespace lines above dependent
                }
                if (checkLine === this.line) {
                    dependent.settledRef = true;
                    contributed = true;
                }
            }
            if (dependent.unsettledNames.size > 0) {
                for (const token of tokens) {
                    const text = token.text!;
                    const type = token.type;
                    const isLooseName = (type === DSLLexer.NAME) && !Resolver.isStrict(text);
                    const strippedName = Resolver.stripMark(text);
                    if (isLooseName && dependent.unsettledNames.has(strippedName)) {
                        dependent.unsettledNames.delete(strippedName);
                        contributed = true;
                    }
                }
            }
            this.checkIfDependency(i,contributed);
        }
        if (DependencyManager.encounteredAliasLine) {//this will help warn against defining a fact before declaring all of the aliases
            Resolver.castReport({
                kind:ReportKind.Warning,
                line:DependencyManager.encounteredAliasLine,
                msg:`-It is best to declare aliases at the top to invalidate the use of their predicate counterpart early.\n-This will help catch errors sooner.`,
                srcText:this.srcLines[DependencyManager.encounteredAliasLine],
                usingSrcLines:this.srcLines
            });
        }
    }
    private settleAliasDependents(tokens:Token[]):void {
        DependencyManager.encounteredAliasLine = this.line;
        let alias:string | null = null;
        for (const token of tokens) {
            const text = token.text!;
            const type = token.type;
            if (type === DSLLexer.PLAIN_WORD) {
                alias = text;//no need to strip the text here since its directly a plain word
                break;
            }
        }
        for (let i=0; i < DependencyManager.dependents.length; i++) {
            const dependent = DependencyManager.dependents[i];
            if (dependent === null) continue;
            
            let contributed = false;
            if ((dependent.alias !== null) && (dependent.alias === alias)) {
                dependent.settledAlias = true;
                contributed = true;
                this.checkIfDependency(i,contributed);
            }
        }
        if (this.satisfiedDependents.length === 0) {
            Resolver.castReport({
                line:this.line,
                msg:'This is unused',
                kind:ReportKind.Warning,
                srcText:alias!,
                usingSrcLines:this.srcLines
            });
        }
    }
    public visitFact = (ctx:FactContext):undefined => {
        const tokens:Token[] = ParseHelper.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.settleDependents(tokens);//its important that this line settles any dependents if it can,before finally checking for its own dependencies.Else,it will end up trying to settle its own dependencies with itself
        this.checkForDependencies(tokens);
        return undefined;
    };
    public visitAliasDeclaration = (ctx:AliasDeclarationContext):undefined => {
        const tokens = ParseHelper.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.settleAliasDependents(tokens);
        return undefined;
    };
    public visitProgram = (ctx:ProgramContext):undefined => {
        for (const child of ctx.children) {
            if (child instanceof FactContext) {
                this.visitFact(child);
            }else if (child instanceof AliasDeclarationContext) {
                this.visitAliasDeclaration(child);
            }
        }
        return undefined;
    };
    //this algorithm is intended to be called per line for correctness and precision and not a whole src text.
    public visit = (tree: ParseTree):boolean => {//The purger checks for dependencies and settles dependents in one visit per src line its called on.So there are no separate processes of dependency recording and then, dependency settlement
        if (tree instanceof ProgramContext) {
            this.visitProgram(tree); // Pass the context directly
        }
        return this.includeAsDependency;
    };
}