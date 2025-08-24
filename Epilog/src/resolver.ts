import { CharStream, CommonTokenStream, ConsoleErrorListener,Token } from "antlr4ng";
import { AliasDeclarationContext,DSLParser, FactContext,ProgramContext } from "./generated/DSLParser.js";
import { DSLLexer } from "./generated/DSLLexer.js";
import { DSLVisitor } from "./generated/DSLVisitor.js";
import chalk from "chalk";
import Denque from "denque";
import { cartesianProduct } from "combinatorial-generators";
import {distance} from "fastest-levenshtein";
import {Heap} from "heap-js";
import stringify from "safe-stable-stringify";
import { Rec } from "./type-helper.js";
import { AtomList } from "./type-helper.js";
import fs from 'fs/promises';
import path from 'path';

interface ResolvedSingleTokens {
    indices:number[],//i used an array because they may be multiple refs in a sentence to resolve
    tokens:Map<number,null | Token>//i used a map here to localize the tokens that resolves each ref
}
interface ResolvedGroupedTokens {
    indices:Heap<number>,//used a descending order heap to prevent insertion issues during iteration by looping backwards
    tokens:Map<number,(null | Token[])>
}
enum DslError{
    Semantic="Semantic Error at",
    Syntax="Syntax Error at",
    DoubleCheck="This is safe to ignore but double check"
}

const brown = chalk.hex("#ddcba0ff");
const lime = chalk.hex('adef1e');
const orange = chalk.hex('f09258f');
const darkGreen = chalk.hex('98ce25ff');



//todo:Make the fuctions more typesafe by replacing all the type shortcuts i made with the any type to concrete ones.and also try to make the predicates typed instead of dynamically sized arrays of either string or number.This has to be done in the dsl if possible.
class Essentials {
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext;

    
    public static report(errorType:string,lineCount:number,msg:string,checkLines?:number[]):void {
        function pushLine(line:number):void {
            messages.push(brown(Analyzer.inputArr[line]?.trim() + '\n'));
        }

        let title = chalk.underline(`\n${errorType} line ${lineCount+1}:`);//for 1-based line counting for the logs
        title = (errorType === DslError.DoubleCheck)?orange(title):chalk.red(title);
        
        const messages = [title,`\n${msg}`,];
        if (!checkLines) {
            messages.push(lime('\nCheck'),darkGreen('->'));
            pushLine(lineCount);
        }
        else{
            messages.push(lime.underline('\n\nCheck these lines:\n'));
            for (const line of checkLines) {
                messages.push(chalk.gray(`${line+1}.`));//for 1-based line counting for the logs
                pushLine(line);
            }
        }
        console.info(...messages);
        if ((errorType===DslError.Semantic) || (errorType===DslError.Syntax)) {
            Analyzer.terminate = true;
        }
    }
    public static loadEssentials(input:string):void {
        ConsoleErrorListener.instance.syntaxError = (recognizer:any, offendingSymbol:any, line: number, column:any, msg: string): void =>{
            Essentials.report(DslError.Syntax,line,msg);
        };
        Essentials.inputStream = CharStream.fromString(input);
        Essentials.lexer = new DSLLexer(Essentials.inputStream);
        Essentials.tokenStream = new CommonTokenStream(Essentials.lexer);
        Essentials.parser = new DSLParser(Essentials.tokenStream);
        Essentials.tree = Essentials.parser.program();
    }
}
function getOrdinalSuffix(n:number):string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function replaceLastOccurrence(str:string, search:string, replacement:string):string {
    const lastIndex = str.lastIndexOf(search);
    if (lastIndex === -1) return str; // string not found, return original
    return str.slice(0, lastIndex) + replacement + str.slice(lastIndex + search.length);
}
interface RefCheck {
    hasRef:boolean,
    line:number
}
class Analyzer extends DSLVisitor<void> {
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    public  records:Record<string,Rec> = {};
    private aliases = new Map<string,string>();

    private lineCount:number = 0;
    private targetLineCount:number = this.lineCount;

    public static terminate:boolean = false;

    private printTokens(tokens:Token[]):void {
        const tokenDebug = tokens?.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('\n Tokens:',tokenDebug);
    }
    private logProgress(tokens:Token[] | null) {
        if ((tokens===null) && !this.seenAlias) return;//dont log anything if they are no tokens and no alias is declared
        const resolvedSentence = tokens?.map(token=>token.text!).join(' ') || '';
        const originalSrc  = Analyzer.inputArr.at(this.lineCount)?.trim() || '';//i used index based line count because 1-based line count works for error reporting during the analyzation process but not for logging it after the process

        if (!Analyzer.terminate) {
            if (originalSrc?.trim().length > 0) {
                let expansionText = stringify(this.expandedFacts);
                expansionText = replaceLastOccurrence(expansionText,']','\n]\n')
                    .replace('[','\n[\n')
                    .replaceAll(',[',',\n[')
                    .split('\n')
                    .map(line => {
                        const trimmed = line?.trim();
                        if (trimmed.startsWith('[') && (trimmed.endsWith(']') || trimmed.endsWith('],'))) {
                            return '  ' + trimmed; // trim original and add two spaces indentation
                        }
                        return line;
                    })
                    .join('\n');

                let successMessage = lime.underline(`\nProcessed line ${this.lineCount + 1}: `);//the +1 to the line count is because the document is numbered by 1-based line counts even though teh underlying array is 0-based
                successMessage += `\n-Sentence: ${brown(originalSrc)}`;
                successMessage += (this.prevRefCheck.hasRef)?`\n-With resolved references: ${brown(resolvedSentence)}`:'';//using prevRefCehck under the same loop accesses the ref check of the latest senetnce.

                if (this.predicateForLog) {//the condition is to skip printing this on alias declarations.The lock works because this is only set on facts and not on alias declarations.Im locking this on alias declarations because they dont need extra logging cuz there is no expansion data or any need to log the predicate separately.just the declaration is enough
                    const predicateFromAlias = this.aliases.get(this.predicateForLog || '');
                    successMessage += (predicateFromAlias)?`\n-Alias #${this.predicateForLog} -> *${predicateFromAlias}`:`\n-Predicate: *${this.predicateForLog}`;
                    successMessage += `\n-Expansion: ${brown(expansionText)}`; 
                };

                console.info(successMessage);
            }
        }
    }
    public visitProgram = (ctx:ProgramContext)=> {
        for (const child of ctx.children) {
            if (Analyzer.terminate) return;
            let tokens:Token[] | null = null;

            if (child instanceof FactContext) {
                tokens = this.visitFact(child);
            }else if (child instanceof AliasDeclarationContext) {
                this.visitAliasDeclaration(child);
            }else{
                const payload = child.getPayload();
                const isNewLine = (payload as Token).type === DSLLexer.NEW_LINE;
                if (isNewLine) this.targetLineCount += 1;//increment the line count at every empty new line
            }
            this.logProgress(tokens);//This must be logged before the line updates as observed from the logs.                 
            this.lineCount = this.targetLineCount;
            this.expandedFacts = null;
            this.predicateForLog = null;
            this.seenAlias = false;
        }
        return this.records;
    };
    public visitFact = (ctx:FactContext)=> {
        const tokens:Token[] = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.resolveRefs(tokens);
        if (!Analyzer.terminate) this.buildFact(tokens);//i checked for termination here because ref resolution can fail
        return tokens;
    };
    public visitAliasDeclaration = (ctx:AliasDeclarationContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.resolveAlias(tokens);
    };

    private getListTokensBlock(tokens:Denque<Token>,nList:number,listCount:[number]=[0]):Token[] | null {
        listCount[0] += 1;
        let list:Token[] = [];
        let lBrackets:number = 0;
        let rBrackets:number = 0;

        while (tokens.length !== 0) {
            const token = tokens.shift()!;
            const type = token.type;
            if (type === DSLLexer.LSQUARE) {
                list.push(token);
                lBrackets += 1;
            }
            else if (type === DSLLexer.RSQUARE) {
                list.push(token);
                rBrackets += 1;
                if (lBrackets === rBrackets) break;
            }else if (lBrackets > 0) {//ensures only tokens inside the array brackets are collected.
                list.push(token);
            }
        };
        if (listCount[0] !== nList) {
            list = this.getListTokensBlock(tokens,nList,listCount) || [];
        }
        return (list.length > 0)?list:null;
    }

    private lastSentenceTokens:Token[] = [];
    private prevRefCheck:RefCheck = {hasRef:false,line:0};//for debugging purposes.It tracks the sentences that have refs in them and it is synec with lastTokenForSIngle.It assumes that the same tokens array will be used consistently and not handling duplicates to ensure that the keys work properly
    private usedNames:Record<string,number> = {};//ive made it a record keeping track of how many times the token was discovered
    
    private resolveRefs(tokens: Token[]) {
        const resolvedSingleTokens:ResolvedSingleTokens = {indices:[],tokens:new Map()};
        const resolvedGroupedTokens:ResolvedGroupedTokens = {indices:new Heap((a:number,b:number)=>b-a),tokens:new Map()};//used a descending order heap so that insertion during resolution doesnt cause index shift that will unexpectedly affect the final result

        const objectRefs = new Set(['him','her','it','them','their']);
        const nounRefs = ['He','She','It','They',...objectRefs];

        const encounteredNames:string[] = [];

        let hasRef = false;
        let encounteredName:boolean = false;//for use in ensurig safety
        
        const extractNumFromRef = (text:string):number=> {
            const num =  Number(text.split(":")[1].slice(0,-1));
            if (!Number.isInteger(num)) Essentials.report(DslError.Semantic,this.lineCount,`-The reference; ${chalk.bold(text)} must use an integer`);
            if (num > 3) Essentials.report(DslError.DoubleCheck,this.lineCount,`-Are you sure you can track what this reference; ${chalk.bold(text)} is pointing to?`);
            return num;
        };
        const checkForRefAmbiguity = ()=> {
            if (this.prevRefCheck.hasRef && hasRef) {
                let message = `-Be sure that you have followed how you are referencing a member from a sentence that also has a ref.`;
                message += `\n-You may wish to write the name or array explicitly in ${chalk.bold('line:'+ (this.prevRefCheck.line+1))} to avoid confusion.`;
                Essentials.report(DslError.DoubleCheck,this.lineCount,message,[this.prevRefCheck.line,this.lineCount]);
            }
        };
        const applyResolution = ()=> {
            const numOfRefs = (resolvedSingleTokens.indices.length + resolvedGroupedTokens.indices.length);
            if (numOfRefs  > 2) {
                Essentials.report(DslError.DoubleCheck,this.lineCount,`-Be careful with how multiple references are used in a sentence and be sure that you know what they are pointing to.`);
            }
            for (const index of resolvedSingleTokens.indices) {//resolve the single ref
                const resolvedToken = resolvedSingleTokens.tokens.get(index)!;
                tokens[index] = resolvedToken;
            }
            for (const index of resolvedGroupedTokens.indices) {//this is a heap unlike the one for single tokens which is an array.so it will be consumed after this iteration
                const resolvedTokens = resolvedGroupedTokens.tokens.get(index)!;
                tokens.splice(index,1,...resolvedTokens);
            }
        };
        function getMembers(sentenceTokens:Token[]) {
            const membersFromSentence:Token[] = [];
            const bracketCount = {l:0,r:0};
            for (const token of sentenceTokens) {
                if (token.type === DSLLexer.LSQUARE) {//capturing the [] brackets collects arrays
                    bracketCount.l += 1;
                    membersFromSentence.push(token);
                }else if (token.type === DSLLexer.RSQUARE) {
                    bracketCount.r += 1;
                    membersFromSentence.push(token);
                }else if (token.type === DSLLexer.NAME) {
                    membersFromSentence.push(token);
                }else if (token.type === DSLLexer.COMMA) {
                    if (bracketCount.l !== bracketCount.r) {//only capture commas that are within the bounds of an array
                        membersFromSentence.push(token);
                    }
                }
            }
            return membersFromSentence;
        };
        const getNthMember = (nthIndex:number)=>{
            const membersFromSentence:Token[] = getMembers(this.lastSentenceTokens);
            const stepToReach = nthIndex;  

            let nthMember:Token | null = null;
            let lastEncounteredList: Token[] | null = null;

            let step = 0;
            let increment = 1;
            let nthArray = 1;

            for (let i=0; i<membersFromSentence.length; i+=increment) {
                step += 1;//must be incremeneted before any other operation
                const memberToken = membersFromSentence[i];

                if (memberToken.type === DSLLexer.LSQUARE) {//must update before the conditional break
                    lastEncounteredList = this.getListTokensBlock(new Denque(membersFromSentence),nthArray);
                }
                if (step === stepToReach) {
                    nthMember = memberToken;
                    break;
                }
                else if (memberToken.type === DSLLexer.LSQUARE) {
                    increment = lastEncounteredList!.length;
                    nthArray += 1;
                }else if (memberToken.type === DSLLexer.NAME) {
                    increment = 1;
                }
            }
            return {nthMember,lastEncounteredList};
        };
        const isRefValid = (member:Token | null,refTarget:'single' | 'group' | 'any',refType:'object' | 'subject' | 'generic',ref:string,nthIndex:number):boolean=> {
            if (!member) {
                if (refType === "object") {
                    Essentials.report(DslError.Semantic,this.lineCount,`-Failed to resolve the reference ${chalk.bold(ref)}. \n-Be sure that there is a ${getOrdinalSuffix(nthIndex! + 1)} member in the prior sentence.`,[this.lineCount-1,this.lineCount]);
                }else if (refType === "subject") {
                    Essentials.report(DslError.Semantic,this.lineCount,`-Failed to resolve the reference ${chalk.bold(ref)}. \n-Be sure that there is a sentence prior to the reference.`,[this.lineCount-1,this.lineCount]);
                }else if (refType === "generic") {
                    Essentials.report(DslError.Semantic,this.lineCount,`-Failed to resolve the reference ${chalk.bold(ref)}. \n-Be sure that there is a sentence prior to the reference and it has a ${getOrdinalSuffix(nthIndex! + 1)} member.`,[this.lineCount-1,this.lineCount]);
                }
                return false;
            }
            else if (refType === "generic")  {
                return true;
            }
            else if ((refType === 'object') && (extractNumFromRef(ref) === 1)) {
                Essentials.report(DslError.Semantic,this.lineCount,`-The reference ${chalk.bold(ref)} must point to an object and not the subject.\n-If thats the intention,then use <He>,<She> or <It>.`);
                return false;
            }
            else if ((refType === "object") && !encounteredName && !hasRef) {
                Essentials.report(DslError.Semantic,this.lineCount,`An object reference can not be the subject of a sentence.`);
                return false;
            }else if ((refType === "subject") && (encounteredName || hasRef)) {
                Essentials.report(DslError.Semantic,this.lineCount,`An subject reference can not be the object of a sentence.`);
                return false;
            }
            else if (refTarget === 'single') {
                if (member?.type === DSLLexer.NAME) {
                    return true;
                }else {
                    Essentials.report(DslError.Semantic,this.lineCount,`-Failed to resolve the reference ${chalk.bold(ref)}.\n-It can only point to a name of the previous sentence but found an array.`,[this.lineCount-1,this.lineCount]);
                    return false;
                }
            }
            else if (refTarget === 'group') {
                if (member?.type === DSLLexer.LSQUARE) {
                    return true;
                }else {
                    Essentials.report(DslError.Semantic,this.lineCount,`-Failed to resolve the reference ${chalk.bold(ref)}.\n-It can only point to an array of the previous sentence but found a name.`,[this.lineCount-1,this.lineCount]);
                    return false;
                }
            }
            return false;
        };

        for (const [index,token] of tokens.entries()){//I did no breaks here to allow all refs in the sentence to resolve
            const text = token.text!;
            const type = token.type;
            
            if ((type === DSLLexer.SINGLE_SUBJECT_REF) || (type === DSLLexer.SINGLE_OBJECT_REF)) {
                const isObjectRef = (type === DSLLexer.SINGLE_OBJECT_REF);
                const nthIndex = isObjectRef?extractNumFromRef(text):1;
                if (Analyzer.terminate) return;
                
                const member = getNthMember(nthIndex).nthMember;
    
                if (isRefValid(member,'single',(isObjectRef)?'object':'subject',text,nthIndex)) {
                    resolvedSingleTokens.indices.push(index);
                    resolvedSingleTokens.tokens.set(index,member);
                }else return;
                hasRef = true;
            }


            else if ((type === DSLLexer.GROUP_SUBJECT_REF) || (type === DSLLexer.GROUP_OBJECT_REF)) {
                const isObjectRef = (type === DSLLexer.GROUP_OBJECT_REF);
                const nthIndex = isObjectRef?extractNumFromRef(text):1;
                if (Analyzer.terminate) return;
                
                const result = getNthMember(nthIndex);
                const member = result.nthMember;

                if (isRefValid(member,'group',(isObjectRef)?'object':'subject',text,nthIndex)) {
                    resolvedGroupedTokens.indices.push(index);
                    resolvedGroupedTokens.tokens.set(index,result.lastEncounteredList);
                }else return;
                hasRef = true;
            }
            
            else if (type === DSLLexer.GENERIC_REF) {
                const nthIndex = extractNumFromRef(text);
                if (Analyzer.terminate) return;

                const result = getNthMember(nthIndex);
                const member = result.nthMember;

                if (isRefValid(member,'any','generic',text,nthIndex)) {
                    if (member!.type === DSLLexer.NAME) {
                        resolvedSingleTokens.indices.push(index);
                        resolvedSingleTokens.tokens.set(index,member);
                    }else if (member!.type === DSLLexer.LSQUARE) {
                        resolvedGroupedTokens.indices.push(index);
                        resolvedGroupedTokens.tokens.set(index,result.lastEncounteredList);
                    }
                }else return;
                hasRef = true;
            }


            else if (type === DSLLexer.NAME) {//this must be called for every name to capture them
                const str = this.stripMark(text);
                const isLoose = text.startsWith(':');
                if (isLoose && !(str in this.usedNames)) this.usedNames[str] = 0;//we dont want to reset it if it has already been set by a previous sentence
                encounteredNames.push(token.text!);
                encounteredName = true;
            }


            else if (type === DSLLexer.PLAIN_WORD) {//this branch is to warn users if they forgot to place angle brackets around the ref and may have also added a typo on top of that.If they made a typo within the angle brackets,it will be caught as a syntax error.This one catches typos not within the bracket as a warning
                for (const nounRef of nounRefs) {
                    const normText = (text.length > 2)?text.toLowerCase():text;//by only lower casing the text if its more than two letters,i prevent the text from being treated leniently when its too small(since lower casing the inputs reduces distance).Else,it will falsely match words that are few distances away but are not semantically similar.
                    const normNounRef = (nounRef.length > 2)?nounRef.toLowerCase():nounRef;
                    const dist = distance(normText,normNounRef);
                    const exclude = new Set(['is']);
                    if ((dist < 2) && !exclude.has(normText)) {//to exclude is from getting suggestions.
                        const suggestion = (objectRefs.has(nounRef))?'object ref, <'+nounRef+':n>':'subject ref, <'+nounRef+'>';
                        Essentials.report(DslError.DoubleCheck,this.lineCount,`-Did you mean to use the ${suggestion} instead of the filler,${chalk.bold(text)}?`);
                    }
                }
            }
        };   
        checkForRefAmbiguity();//this must be checked before updating the refCheck state
        for (const name of encounteredNames) this.validateNameUsage(name);//this has to happen before the refs are resolved.else,the names that expanded into those refs will trigger warnings.
        this.lastSentenceTokens = tokens;
        this.prevRefCheck = {hasRef,line:this.lineCount};
        applyResolution();
    }
    private stripMark(text:string) {
        return text.slice(1);// Remove the leading '*' or '#' or : or !
    }
    private seenAlias:boolean = false;//i used this to control progress logging
    private resolveAlias(tokens:Token[]) {
        let alias = '';
        let predicate = '';
        
        tokens.forEach(token=>{
            const text = token.text!;
            const type = token.type;

            if (type === DSLLexer.PLAIN_WORD) {
                alias = text;
            }
            else if (type === DSLLexer.PREDICATE) {
                predicate = this.stripMark(text);
                if (!this.records[predicate]) this.records[predicate] = new Rec([]);
            }
            else if ((type === DSLLexer.TERMINATOR)) {
                if (text.endsWith('\n')) this.targetLineCount += 1;//increment the count at every new line created at the end of the sentence
            }
        });
        this.records[alias] = this.records[predicate] || new Rec([]);//the fallback is for when aliases are declared using the shorthand where the predicate isnt inlined with the declaration.The shorthand is for invalidating predicates
        this.aliases.set(alias,predicate || alias);
        this.seenAlias = true;
        if (this.builtAFact) {
            Essentials.report(DslError.DoubleCheck,this.lineCount,`-It is best to declare aliases at the top to invalidate the use of their predicate counterpart early.\n-This will help catch errors sooner.`);
        }
    }
    private expandRecursively(input:any[][],flatSequences:any[][] = []):any[][] {
        for (const product of cartesianProduct(...input)) {
            if (product.some(value=>value instanceof Array)) {
                const boxedProduct = product.map(value=>{
                    if (!(value instanceof Array)) return [value];
                    return value;
                });
                this.expandRecursively(boxedProduct,flatSequences);
            }else {
                flatSequences.push(product);
            }
        } 
        return flatSequences;
    }
    private recommendAlias(text:string):string | null {
        for (const alias of this.aliases.values()) {
            if (distance(alias,text!) < 4) {
                return alias;
            }
        }
        return null;
    }
    private validatePredicateType(token:Token):void {
        const isAlias = this.aliases.has(this.stripMark(token.text!));//the aliases set stores plain words
        
        if (isAlias && ! token.text!.startsWith('#')) {
            Essentials.report(DslError.Semantic,this.lineCount,`-Aliases are meant to be prefixed with ${chalk.bold('#')} but found ${chalk.bold(token.text)}. Did you mean: #${chalk.bold(this.stripMark(token.text!))}?`);
        }
        if (!isAlias && ! token.text!.startsWith("*")) {
            let message:string = `-Predicates are meant to be prefixed with ${chalk.bold('*')} but found ${chalk.bold(token.text)}.\n-Did you forget to declare it as an alias? `;
            const recommendedAlias = this.recommendAlias(token.text!);
            message += (recommendedAlias)?`Or did you mean to type #${recommendedAlias}?`:'';
            Essentials.report(DslError.Semantic,this.lineCount,message);
        }
    }
    private predicateForLog:string | null = null;
    private getPredicate(tokens:Token[]):string | null {
        let predicate:string | null = null;
        tokens.forEach(token => {
            const text = token.text!;
            const type = token.type;
            if ((type === DSLLexer.PREDICATE) || (type === DSLLexer.ALIAS) ) {
                if (predicate !== null) {
                    Essentials.report(DslError.Semantic,this.lineCount,`-They can only be one alias or predicate in a sentence but found ${chalk.bold('*'+predicate)} and ${chalk.bold(text)} being used at the same time.`);
                }
                this.validatePredicateType(token);
                predicate = this.stripMark(text);
                this.predicateForLog = predicate;
            }
        });
        if (predicate === null) {
            Essentials.report(DslError.Semantic,this.lineCount,'-A sentence must have one predicate or alias.');
        }
        return predicate;
    }

    private expandedFacts:AtomList[] | null = null;
    private builtAFact:boolean = false;

    private buildFact(tokens:Token[]) {
        const predicate = this.getPredicate(tokens);
        if (predicate === null) return;
        const tokenQueue = new Denque(tokens);
        const groupedData = this.inspectRelevantTokens(tokenQueue,false);
        if (Analyzer.terminate) return;

        this.expandedFacts = this.expandRecursively(groupedData!);

        for (const fact of this.expandedFacts) {;
            if (fact.length === 0) {
                Essentials.report(DslError.Semantic,this.lineCount,'-A sentence must contain at least one atom.');
            }
            if (!this.records[predicate]) {
                this.records[predicate] = new Rec([]);
            }
            this.records[predicate].add(fact);
        }
        this.builtAFact = true;
    }
    private validateNameUsage(text:string) {
        const isStrict = text.startsWith('!');
        const str = this.stripMark(text);

        if (isStrict && !(str in this.usedNames)) {
            Essentials.report(DslError.Semantic,this.lineCount,`-Could not find an existing usage of the name; ${chalk.bold(str)}.\n-Did you meant to type: ${chalk.bold(':'+str)} instead? Assuming that this is the first time it is used.`);
        }else if (!isStrict && this.usedNames[str] > 0) {//only give the recommendation if this is not the first time it is used
            Essentials.report(DslError.DoubleCheck,this.lineCount,`-You may wish to type ${chalk.bold("!"+str)} rather than loosely as ${chalk.bold(":"+str)}. \n-It signals that it has been used before here and it prevents errors early.`);
        }
        if (str in this.usedNames) {
            this.usedNames[str] += 1;
        }
    }
    private inspectRelevantTokens(tokens:Denque<Token>,readOnly:boolean=true,level:[number]=[0],visitedNames=new Set<string>(),shouldClone:boolean=true) {
        if (Analyzer.terminate) return;
        const tokenQueue = shouldClone ? new Denque(tokens.toArray()) : tokens;//to prevent unwanted mutation if the queue is to be reused elsewhere
        const list:any[] = [];
        const inRoot = level[0] === 0;
        while (tokenQueue.length !== 0) {
            const token = tokenQueue.shift()!;
            const type = token.type;
            const text = token.text!;
            if (type === DSLLexer.NAME) {
                const str = this.stripMark(text);
                if (!readOnly) {
                    if (visitedNames.has(str)) {
                        Essentials.report(DslError.Semantic,this.lineCount,`-The same name cannot be used more than once in a sentence but found; ${chalk.bold(text)} used again.`);
                        if (Analyzer.terminate) return;
                    }
                    visitedNames.add(str);
                    if (Analyzer.terminate) return;
                }
                list.push((inRoot)?[str]:str);
            }
            else if (type === DSLLexer.NUMBER) {
                const num = Number(text);
                list.push((inRoot)?[num]:num);
            }
            else if (type === DSLLexer.LSQUARE) {
                level[0] += 1;
                list.push(this.inspectRelevantTokens(tokenQueue,readOnly,level,visitedNames,false));// explicitly pass false for shouldClone, so that the method uses the existing queue directly without cloning.
            }
            else if (type === DSLLexer.RSQUARE) {
                level[0] -= 1;
                break;
            }else if (type === DSLLexer.PLAIN_WORD) {
                const capitalLetter = text.toUpperCase()[0];
                const exclude = new Set(['A','I']);
                if (text.startsWith(capitalLetter) && !exclude.has(text)) {
                    Essentials.report(DslError.DoubleCheck,this.lineCount,`-Did you mean to write the name,${chalk.bold(":"+text)} instead of the filler,${chalk.bold(text)}?`);
                }
            }else if ((type === DSLLexer.TERMINATOR) && !readOnly) {
                if (text.endsWith('\n')) this.targetLineCount += 1;//increment the count at every new line created at the end of the sentence
            }
        };
        return list;
    }
    public static inputArr:string[] = [];
    public createSentenceArray(input:string) {
        Analyzer.inputArr = input.split('\n');
    }
}
function genStructures(input:string):Record<string,Rec> | undefined {
    const visitor = new Analyzer();
    visitor.createSentenceArray(input);
    Essentials.loadEssentials(input);
    visitor.visit(Essentials.tree);
    if (!Analyzer.terminate) return visitor.records;
}
function omitJsonKeys(key:string,value:any) {
    if ((key === "set") ||  (key === "indexMap")) {
        return undefined; // exclude 'password'
    }
    return value; // include everything else
}

async function resolveDocToJson(filePath:string,outputFolder?:string):Promise<void> {
    try {
        const src = await fs.readFile(filePath, 'utf8');
        const resolvedData = genStructures(src);
        if (!Analyzer.terminate) {
            const json = stringify(resolvedData,omitJsonKeys,4) || '';
            const jsonFilePath = path.basename(filePath, path.extname(filePath)) + '.json';

            const outputPath = outputFolder || path.dirname(filePath);
            const fullJsonPath = path.join(outputPath,jsonFilePath);
            await fs.writeFile(fullJsonPath, json);

            Analyzer.terminate = false;//reset it for subsequent analyzing
            console.log(`\n${lime('Successfully wrote JSON output to: ')} ${jsonFilePath}\n`);
        }
    } catch (err) {
        console.error('Error processing file:', err);
    }
}
import { Command } from 'commander';

const program = new Command();

program
    .name('epilog')
    .description('Example CLI that calls a function using flags/options')
    .version('1.0.0');

program
    .description('Run the resolve function with options')
    .requiredOption('--src <srcPath>', 'path to DSL file')
    .option('--out <outputPath>', 'folder to output the DSL data structure')
    .action(async (options) => {
        await resolveDocToJson(options.src, options.out);
    });

program.parse(process.argv);