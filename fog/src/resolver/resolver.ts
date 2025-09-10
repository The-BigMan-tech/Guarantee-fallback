import { CharStream, CommonTokenStream, ConsoleErrorListener,ParseTree,Token } from "antlr4ng";
import { AliasDeclarationContext,DSLParser, FactContext,ProgramContext } from "../generated/DSLParser.js";
import { DSLLexer } from "../generated/DSLLexer.js";
import { DSLVisitor } from "../generated/DSLVisitor.js";
import chalk, { ChalkInstance } from "chalk";
import Denque from "denque";
import { cartesianProduct } from "combinatorial-generators";
import {distance} from "fastest-levenshtein";
import {Heap} from "heap-js";
import stringify from "safe-stable-stringify";
import { FullData,convMapToRecord,Rec, ResolutionResult, Result,lspAnalysis, lspSeverity, lspDiagnostics, isWhitespace } from "../utils/utils.js";
import { AtomList } from "../utils/utils.js";
import fs from 'fs/promises';
import path from 'path';
import stripAnsi from 'strip-ansi';
import { LRUCache } from "lru-cache";
import CustomQueue from "./custom-queue.js";


const brown = chalk.hex("#ddcba0ff");
const lime = chalk.hex('adef1e');
const orange = chalk.hex('f09258f');
const darkGreen = chalk.hex('98ce25ff');


interface ResolvedSingleTokens {
    indices:number[],//i used an array because they may be multiple refs in a sentence to resolve
    tokens:Map<number,null | Token>//i used a map here to localize the tokens that resolves each ref
}
interface ResolvedGroupedTokens {
    indices:Heap<number>,//used a descending order heap to prevent insertion issues during iteration by looping backwards
    tokens:Map<number,(null | Token[])>
}
function mapToColor(kind:ReportKind):ChalkInstance | null {
    switch (kind) {
    case(ReportKind.Semantic): {
        return chalk.red;
    }
    case (ReportKind.Syntax): {
        return chalk.red;
    }
    case (ReportKind.Warning): {
        return orange;
    }
    }
    return null;
}

enum ReportKind {
    Semantic="Semantic Error at",
    Syntax="Syntax Error at",
    Warning="Double check",
    Hint="Hint at"
}
enum EndOfLine {
    value=-1//i used a number for better type safety by allowing ts to differentiate it from the other src text that are strings
}
type InlineSrcText = string | string[] | EndOfLine;

interface Report {
    kind:ReportKind,
    line:number,//this is 0-based
    lines?:number[]
    msg:string,
    srcText:InlineSrcText
}
class Essentials {
    //these properties have to be long lived(static) for it to work.else,it will cause bugs
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext | null;

    public static parse(input:string):void {
        ConsoleErrorListener.instance.syntaxError = (recognizer:any, offendingSymbol:any, line: number, column:number, msg: string): void =>{
            const zeroBasedLine = line - 1;//the line returned by this listenere is 1-based so i deducted 1 to make it 0-based which is the correct form the pogram understands
            const srcLine = Resolver.srcLine(zeroBasedLine);
            const srcText = ((srcLine)?srcLine[column]:undefined) || EndOfLine.value;

            console.log('src txt',srcText);
            Essentials.castReport({
                kind:ReportKind.Syntax,
                line:zeroBasedLine,
                srcText,
                msg,
            });
        };
        Essentials.inputStream = CharStream.fromString(input);
        Essentials.lexer = new DSLLexer(Essentials.inputStream);
        Essentials.tokenStream = new CommonTokenStream(Essentials.lexer);
        Essentials.parser = new DSLParser(Essentials.tokenStream);
        Essentials.tree = Essentials.parser.program();
    }
    public static buildDiagnosticsFromReport(report:Report):void {
        if (Resolver.lspAnalysis===null) return;//dont generate lsp analysis if not required

        const diagnostics:lspDiagnostics[] = [];
        const buildDiagnostic = (targetLine: number, text:string | EndOfLine,message:string):lspDiagnostics => {
            const sourceLine = Resolver.srcLine(targetLine) || "";
            const cleanedSourceLine = sourceLine.replace(/\r+$/, ""); // remove trailing \r
            
            let startChar:number;
            let endChar:number;

            if (text !== EndOfLine.value) {
                const charPos = cleanedSourceLine.indexOf(text);//it doesnt strip out carriage return like in the src line cuz the text can be a slice into any piece of the src and altering its formatting can lead to issues
                startChar = (charPos < 0)?0:charPos;
                endChar = startChar + text.length;
            }else {
                startChar = cleanedSourceLine.length - 1;
                endChar = startChar;
            }
            return {
                range: {
                    start: { line: targetLine, character: startChar },
                    end: { line: targetLine, character: endChar }
                },
                severity,
                message
            };
        }; 
        function registerDiagnostics(key:string):void {
            Resolver.lspAnalysis!.diagnostics.push(...diagnostics);
            const diagnosticsAtKey = Resolver.lspDiagnosticsCache.get(key) || [];
            Resolver.lspDiagnosticsCache.set(key,[...diagnosticsAtKey,...diagnostics]);//the reason why im concatenating the new diagonostics to a previously defined one is because its possible for there to be multiple sentences in a line,and overrding on each new sentence will remove the diagonosis of the prior sentences on the same line
        }
        const {kind,line,lines,msg,srcText} = report;//line is 0-based
        const srcLine:string = Resolver.srcLine(line)!;

        const mapToSeverity =  {
            [ReportKind.Semantic]:lspSeverity.Error,
            [ReportKind.Syntax]:lspSeverity.Error,
            [ReportKind.Warning]:lspSeverity.Warning,
            [ReportKind.Hint]:lspSeverity.Hint
        };

        const severity = mapToSeverity[kind];
        const modifiedMsg = msg.split('\n').map(str=>str.replace('-','')).join('');//this removes the leading - sign in each sentence of the message.I use them when logging the report to a file for clarity but for in editor reports,it is unnecessary.
        const cleanMsg = stripAnsi(modifiedMsg.replace(/\r?\n|\r/g, " "));//strip ansi codes and new lines
        
        const key = Essentials.createKey(line,srcLine);
        if (!lines && ((typeof srcText === "string") || (srcText === EndOfLine.value))) {
            diagnostics.push(buildDiagnostic(line,srcText,cleanMsg));
            registerDiagnostics(key);
        }
        else if (lines && Array.isArray(srcText)){
            for (let i = 0; i < lines.length; i++) {
                const targetLine = lines[i];
                const text = srcText[i];
                const isMainLine = (targetLine===line);
                const message = isMainLine?cleanMsg:`This line is involved in an issue with line ${line + 1}.`;
                diagnostics.push(buildDiagnostic(targetLine,text,message));
                if (isMainLine) {
                    registerDiagnostics(key);
                }else {
                    registerDiagnostics(Essentials.createKey(targetLine,Resolver.srcLines[targetLine]));
                }
            }
        }
    }
    public static createKey(line:number,content:string):string {
        const contentNoWhitespaces = content.replace(/\s+/g, '');  // Remove all whitespaces
        const key = `${line}|${contentNoWhitespaces}`;
        return key;
    }
    public static isWhitespace(str?: string | null): boolean {
        return !str || str.trim().length === 0;
    }
    public static castReport(report:Report):void {
        Essentials.buildDiagnosticsFromReport(report);
        const {kind,line,lines,msg} = report;
        const messages = [];

        console.log('🚀 => :78 => pushLine => line:', line);
        const pushLine = (line:number):void => {messages.push(brown(Resolver.srcLine(line)?.trim() + '\n'));};
        const errTitle = chalk.underline(`\n${kind} line ${line + 1}:`);
        const coloredTitle = mapToColor(kind)!(errTitle);

        const subTitle1 = [chalk.green('\nCheck'),darkGreen('->')];
        const subTitle2 = chalk.green.underline('\n\nCheck these lines:\n');

        messages.push(coloredTitle);
        messages.push(`\n${msg}`);

        if (!lines) {
            messages.push(...subTitle1);
            pushLine(line);
        }
        else{
            messages.push(subTitle2);
            for (const line of lines) {
                messages.push(chalk.gray(`${line+1}.`));//These show the line count on the side.
                pushLine(line);
            }
        }
        messages.push('\n');
        console.info(...messages);
        Resolver.logs?.push(...messages);

        const errForTermination = (kind===ReportKind.Semantic) || (kind===ReportKind.Syntax);
        if (errForTermination) {
            Resolver.terminate = true;
            Resolver.wasTerminated = true;
        }
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
    encounteredRef:null | 'subject' | 'object' | 'generic',
    line:number
}
interface VisitedSentence {
    line:number,
    uniqueKey:string//the unique key is used to identify itself in relative to the src which is used to invalidate the entry if its stale
}
export class Resolver extends DSLVisitor<Promise<undefined | Token[]>> {
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    public records:Record<string,Rec> = {};
    public aliases = new Map<string,string>();//this is used for semantic safety by usin it to know which relations are declared as aliases or not so as to enforce checks when resolving the document.its also used in conjuction with the predicates map to clarify which records need full fact data to themselves and to build the final predicate map
    public predicates = new Map<string,string>();//this is used in conjuction with the aliases map to understand what records need their facts built into their own record.This mechanism ensures that only preidcates get a built record of facts to themsleves and aliases dont.it is comined with the alias map into a single oobject that maps the relations(predicates or aliases) to the conccrete predicates they refer to.This allows the json document to contain info about what record points to what(in the case of aliases).This greatly reduces the document size by having alias records completely empty and all the facts that belongs to the are transferred to the concrete proedicate.so at loading time,the fact chcekcer can know what they point to by using the predicate map.

    //the reason why im explicitly managing the line count instead of the index at every program context visit iteration is because that method assumes that the each context is a line which isnt the case when there are multiple snetences in a line.
    private lineCount:number = 0;//this meant to be read-only by all methods but only mutated once at the end of each resolution step to be equal to the mutable line count
    private targetLineCount:number = this.lineCount;//this is the mutable line count that is safe to increment by any method that inspects tokens and at every new line.Its not meant to be done by every method that inspects tokens but only a few.and here,only three pieces of the codebase does this.This is to prevent incorrect state bugs.

    public static terminate:boolean = false;//this is the flag that controls the termination of the resolver
    public static wasTerminated:boolean = false;//this is just a flag for any part of the codebase to know when it forcefully terminated

    public static logFile:string | null = null;
    public static logs:string[] | null = null;
    public static linesToLogAtATime:number = 10;
    public static srcLines:string[] = [];

    private expandedFacts:AtomList[] | null = null;
    private builtAFact:boolean = false;

    private lastSentenceTokens:Token[] = [];
    private prevRefCheck:RefCheck = {encounteredRef:null,line:0};//for debugging purposes.It tracks the sentences that have refs in them and it is synec with lastTokenForSIngle.It assumes that the same tokens array will be used consistently and not handling duplicates to ensure that the keys work properly
    private usedNames:Record<string,number> = {};//ive made it a record keeping track of how many times the token was discovered
    private predicateForLog:string | null = null;

    public static visitedSentences = new Map<string,VisitedSentence>();
    public static lspAnalysis:lspAnalysis | null = null;
    public static lspDiagnosticsCache = new LRUCache<string,lspDiagnostics[]>({max:500});//i cant clear this on every resolution call like the rest because its meant to be persistent
    public static lastDocumentPath:string | null = null;

    //this method expects that the line is 0-based
    public static srcLine = (line:number):string | undefined => Resolver.srcLines.at(line);
    private printTokens(tokens:Token[] | null):void {
        const tokenDebug = tokens?.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('\n Tokens:',tokenDebug);
    }
    private logProgress(tokens:Token[] | null) {
        if ((tokens===null) || Resolver.terminate) return;
        const resolvedSentence = tokens?.map(token=>token.text!).join(' ') || '';//the tokens received at the time this method is called is after the senence has been resolved
        const originalSrc  = Resolver.srcLine(this.lineCount)?.trim() || '';//i used index based line count because 1-based line count works for error reporting during the analyzation process but not for logging it after the process
        
        let expansionText = stringify(this.expandedFacts);
        expansionText = replaceLastOccurrence(expansionText,']','\n]\n')
            .replace('[','\n[\n')
            .replaceAll(',[',',\n[')
            .split('\n')
            .map(line => {
                const trimmed = line?.trim();
                if (trimmed.startsWith('[') && (trimmed.endsWith(']') || trimmed.endsWith('],'))) {
                    return trimmed.padStart(trimmed.length + 4,' '); // trim original and add two spaces indentation
                }
                return line;
            })
            .join('\n');

        const resolveRefMessage = `\n-Resolves to ${brown(resolvedSentence)}`;
        let successMessage = lime.underline(`\nProcessed line ${this.lineCount + 1}: `);//the +1 to the line count is because the document is numbered by 1-based line counts even though teh underlying array is 0-based
        successMessage += `\n-Sentence: ${brown(originalSrc)}`;

        if (this.prevRefCheck.encounteredRef) {//using prevRefCehck under the same loop accesses the ref check of the latest senetnce.
            successMessage += resolveRefMessage;
            Essentials.buildDiagnosticsFromReport({
                kind:ReportKind.Hint,
                line:this.lineCount,
                msg:resolveRefMessage,
                srcText:Resolver.srcLine(this.lineCount)!
            });
        }
        if (this.predicateForLog) {//the condition is to skip printing this on alias declarations.The lock works because this is only set on facts and not on alias declarations.Im locking this on alias declarations because they dont need extra logging cuz there is no expansion data or any need to log the predicate separately.just the declaration is enough
            const predicateFromAlias = this.aliases.get(this.predicateForLog || '');
            if (predicateFromAlias) {
                const aliasMsg = `\n-Alias #${this.predicateForLog} -> *${predicateFromAlias}`;
                successMessage += aliasMsg;
                Essentials.buildDiagnosticsFromReport({
                    kind:ReportKind.Hint,
                    line:this.lineCount,
                    msg:aliasMsg,
                    srcText:`#${this.predicateForLog}`
                });
            }else {
                successMessage += `\n-Predicate: *${this.predicateForLog}`;
            }
            successMessage += `\n-Expansion: ${brown(expansionText)}`; 
        };
        successMessage += '\n';
        console.info(successMessage);
        Resolver.logs?.push(successMessage);
    }
    public static async flushLogs() {
        if (Resolver.logs && Resolver.logFile) {
            const logs = Resolver.logs.join('');
            if (logs.length > 0) {
                await fs.appendFile(Resolver.logFile,logs);
                Resolver.logs.length = 0;//clear the batch
            }
        }
    }
    private checkForRepetition(tokens:Token[] | null,aliasDeclaration:boolean) {//twi sentences are structurally identical if they have the same predicate or alias and the same number of atoms in the exact same order regardless of fillers.The resolver will flag this to prevent the final document from being bloated with unnecessary duplicate information.
        if ((tokens===null) || (tokens.length === 0)) return;
        //im using a queue because it will be inserting predicates to the front of the array.This is because no matter the position of the predicate in a sentence,it always produces the same output meaning that the semantic meaning of the sentence is the same.So by inserting them to the front and not pushing them to the ends,i ensure that the position of the predicate doesnt affect its reasoning of duplicates because they will always be at the front
        const tokenNames = new Denque<string>([]);//im going to be checking against the token names and not the raw objects to make stringofying computationally easier
        tokens.forEach(token =>{
            const isTerminator = (token.type === DSLLexer.TERMINATOR);
            const isFiller = ((token.type === DSLLexer.PLAIN_WORD) && !aliasDeclaration);//the condition for alias declaration prevents it from conidering the name of the alias as filler just because its a plain word
            
            if (!isTerminator && !isFiller){//the for alias check is to ensure that the plain words in alias declarations are considered
                let name:string = token.text!;
                if (!aliasDeclaration && ((token.type === DSLLexer.ALIAS) || (token.type === DSLLexer.PREDICATE))) {//locking it to whether its an alias declaration prevents it from flagging an alias declaration as a duplicate sentence because the alias declaration itself is essentially a duplicate since it refers to a predicate and its meant to be that way.so the resolver should respect this
                    name = Resolver.stripMark(name);//strip their prefixes
                    name = this.aliases.get(name) || name;//the fallback is for the case of predicates
                    tokenNames.unshift(name);
                }else {
                    tokenNames.push(name);
                }
            }
        });
        if (tokenNames.length === 0) {
            return;//this prevents the case of an empty array string from being the key which happens when the tokens dont make a meaningful sentence.
        }
        const stringifiedNames = stringify(tokenNames.toArray());
        const repeatedSentence = Resolver.visitedSentences.get(stringifiedNames);

        
        const srcLine = Resolver.srcLine(this.lineCount)!;
        console.log('🚀 => :346 => checkForRepetition => repeatedSentence:',stringifiedNames,'src: ',srcLine);
        
        if (repeatedSentence && (repeatedSentence.line !== this.lineCount)) {//the second condition is possible because viitedSentences is persistent meaning that subsequent analysis can encounter the same line as a repeated sentence
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                srcText:[Resolver.srcLine(repeatedSentence.line)!,srcLine],
                msg:`-This sentence is semantically identical to line ${repeatedSentence.line + 1}.\n-It is repetitive, so remove it to improve resolution speed and reduce the final document size.`,
                lines:[repeatedSentence.line,this.lineCount]
            });
        }else {
            const uniqueKey = Essentials.createKey(this.lineCount,srcLine);
            Resolver.visitedSentences.set(stringifiedNames,{line:this.lineCount,uniqueKey});//i mapped it to its line in the src for error reporting
        }
    }
    private async resolveLine(child:ParseTree) {
        let tokens:Token[] | null = null;
        let declaredAlias = false;
        if (child instanceof FactContext) {
            tokens = await this.visitFact(child);
        }else if (child instanceof AliasDeclarationContext) {
            tokens = await this.visitAliasDeclaration(child);
            declaredAlias = true;
        }else{
            const payload = child.getPayload();
            const isNewLine = (payload as Token).type === DSLLexer.NEW_LINE;
            if (isNewLine) this.targetLineCount += 1;//increment the line count at every empty new line
        }
        if (this.lineCount === (Resolver.srcLines.length-1)) {//this block is to increment the line count at the end of the file.This is because i dont directly have the eof token in the tokens array which is because they only contain sentences.so without that,the line count at the end of the file will always be a count short which s why im checking it against the input array.length - 1.Explicitly incrementing it under tis conditin fixes that.
            this.targetLineCount += 1;
        }
        this.checkForRepetition(tokens,declaredAlias);
        this.logProgress(tokens);//This must be logged before the line updates as observed from the logs.   
        this.lineCount = this.targetLineCount;
        this.expandedFacts = null;
        this.predicateForLog = null;
    }
    public visitProgram = async (ctx:ProgramContext)=> {
        for (const child of ctx.children) {
            if (Resolver.terminate) return;
            await this.resolveLine(child);
            const EOF = this.lineCount===Resolver.srcLines.length;
            const shouldFlushLogs = Resolver.terminate || EOF || ((this.lineCount % Resolver.linesToLogAtATime)===0);
            if (shouldFlushLogs) {
                await Resolver.flushLogs();
            }
        }
        return undefined;
    };
    public visit = async (tree: ParseTree)=> {
        console.log('visited the code');
        if (tree instanceof ProgramContext) {
            await this.visitProgram(tree); // Pass the context directly
        };
        return undefined;
    };
    public visitFact = async (ctx:FactContext)=> {
        const tokens:Token[] = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.resolveRefs(tokens);
        if (!Resolver.terminate) this.buildFact(tokens);//i checked for termination here because ref resolution can fail
        return tokens;
    };
    public visitAliasDeclaration = async (ctx:AliasDeclarationContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.resolveAlias(tokens);
        return tokens;
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
    private resolveRefs(tokens: Token[]) {
        const resolvedSingleTokens:ResolvedSingleTokens = {indices:[],tokens:new Map()};
        const resolvedGroupedTokens:ResolvedGroupedTokens = {indices:new Heap((a:number,b:number)=>b-a),tokens:new Map()};//used a descending order heap so that insertion during resolution doesnt cause index shift that will unexpectedly affect the final result

        const objectRefs = new Set(['him','her','it','them','their']);
        const nounRefs = ['He','She','It','They',...objectRefs];

        const encounteredNames:string[] = [];

        let encounteredRef:RefCheck['encounteredRef'] = null;
        let encounteredName:boolean = false;//for use in ensurig safety
        
        const extractNumFromRef = (text:string):number=> {
            const num =  Number(text.split(":")[1].slice(0,-1));
            const report = (kind:ReportKind,msg:string):Report => ({
                kind,
                line:this.lineCount,
                msg,
                srcText:text
            });
            if (!Number.isInteger(num)) Essentials.castReport(report(ReportKind.Semantic,`-The reference; ${chalk.bold(text)} must use an integer`));
            if (num > 3) Essentials.castReport(report(ReportKind.Warning,`-Are you sure you can track what this reference ${chalk.bold(text)} is pointing to?`));
            return num;
        };
        const checkForRefAmbiguity = ()=> {
            if (this.prevRefCheck.encounteredRef && encounteredRef) {
                let msg = `-Be sure that you have followed how you are referencing a member from a sentence that also has a ref.`;
                msg += `\n-You may wish to write the name or array explicitly in ${chalk.bold('line:'+ (this.prevRefCheck.line+1))} to avoid confusion.`;
                Essentials.castReport({
                    kind:ReportKind.Warning,
                    line:this.lineCount,
                    msg,
                    srcText:[Resolver.srcLine(this.prevRefCheck.line)!,Resolver.srcLine(this.lineCount)!],
                    lines:[this.prevRefCheck.line,this.lineCount]
                });
            }
        };
        const applyResolution = ()=> {
            const numOfRefs = (resolvedSingleTokens.indices.length + resolvedGroupedTokens.indices.length);
            if (numOfRefs  > 2) {
                Essentials.castReport({
                    kind:ReportKind.Warning,
                    line:this.lineCount,
                    srcText:Resolver.srcLine(this.lineCount)!,
                    msg:`-Be careful with how multiple references are used in a sentence and be sure that you know what they are pointing to.`
                });
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
        const getNthMember = (nthIndex:number,tokens:Token[])=>{
            const membersFromSentence:Token[] = getMembers(tokens);
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
            const report = (msg:string,srcText?:string | string[],):Report=>({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg,
                srcText:srcText || ref
            });
            const linesReport = (msg:string):Report=>({
                ...report(msg,[Resolver.srcLine(this.lineCount-1)!,ref]),
                lines:[this.lineCount-1,this.lineCount]
            });
            if (!member) {
                if (refType === "object") {
                    Essentials.castReport(report(`-Failed to resolve the reference ${chalk.bold(ref)}. \n-Be sure that there is a ${getOrdinalSuffix(nthIndex!)} member in the prior sentence.`,));
                }else {
                    Essentials.castReport(report(`-Failed to resolve the reference ${chalk.bold(ref)}. \n-Be sure that there is a sentence prior to the reference and it has a ${getOrdinalSuffix(nthIndex!)} member.`));
                }
                return false;
            }
            else if (refType === "generic")  {
                return true;
            }
            else if ((refType === 'object') && (extractNumFromRef(ref) === 1)) {
                Essentials.castReport(report(`-The reference ${chalk.bold(ref)} must point to an object of the prior sentence,not the subject.\n-If that is the intention,then use <He>,<She> or <It>.`));
                return false;
            }
            else if ((refType === "object") && !encounteredName && !encounteredRef) {
                Essentials.castReport(report(`-An object reference can not be the subject of a sentence.`));
                return false;
            }
            else if ((refType === "object") && (encounteredRef==="object")) {
                Essentials.castReport(report(`-A sentence can not have more than one object reference.`));
                return false;
            }
            else if ((refType === "subject") && (encounteredName || encounteredRef)) {
                if (encounteredRef === "subject") {
                    Essentials.castReport(report(`A sentence can not have more than one subject reference.`));
                }else {
                    Essentials.castReport(report(`A subject reference can not be the object of a sentence.`));
                }
                return false;
            }
            else if (refTarget === 'single') {
                if (member?.type === DSLLexer.NAME) {
                    return true;
                }else {
                    Essentials.castReport(linesReport(`-Failed to resolve the reference ${chalk.bold(ref)}.\n-It can only point to a name of the previous sentence but found an array.`));
                    return false;
                }
            }
            else if (refTarget === 'group') {
                if (member?.type === DSLLexer.LSQUARE) {
                    return true;
                }else {
                    Essentials.castReport(linesReport(`-Failed to resolve the reference ${chalk.bold(ref)}.\n-It can only point to an array of the previous sentence but found a name.`));
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
                if (Resolver.terminate) return;
                
                const member = getNthMember(nthIndex,this.lastSentenceTokens).nthMember;
                const refType = (isObjectRef)?'object':'subject';

                if (isRefValid(member,'single',refType,text,nthIndex)) {
                    resolvedSingleTokens.indices.push(index);
                    resolvedSingleTokens.tokens.set(index,member);
                }else return;
                encounteredRef = refType;
            }


            else if ((type === DSLLexer.GROUP_SUBJECT_REF) || (type === DSLLexer.GROUP_OBJECT_REF)) {
                const isObjectRef = (type === DSLLexer.GROUP_OBJECT_REF);
                const nthIndex = isObjectRef?extractNumFromRef(text):1;
                if (Resolver.terminate) return;
                
                const result = getNthMember(nthIndex,this.lastSentenceTokens);
                const member = result.nthMember;
                const refType = (isObjectRef)?'object':'subject';

                if (isRefValid(member,'group',refType,text,nthIndex)) {
                    resolvedGroupedTokens.indices.push(index);
                    resolvedGroupedTokens.tokens.set(index,result.lastEncounteredList);
                }else return;
                encounteredRef = refType;
            }
            
            else if (type === DSLLexer.GENERIC_REF) {
                const nthIndex = extractNumFromRef(text);
                if (Resolver.terminate) return;

                const result = getNthMember(nthIndex,this.lastSentenceTokens);
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
                encounteredRef = 'generic';
            }


            else if (type === DSLLexer.NAME) {//this must be called for every name to capture them
                const str = Resolver.stripMark(text);
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
                        Essentials.castReport({
                            kind:ReportKind.Warning,
                            line:this.lineCount,
                            msg:`-Did you mean to use the ${suggestion} instead of the filler,${chalk.bold(text)}?`,
                            srcText:text
                        });
                    }
                }
            }
        };   
        checkForRefAmbiguity();//this must be checked before updating the refCheck state
        for (const name of encounteredNames) this.validateNameUsage(name);//this has to happen before the refs are resolved.else,the names that expanded into those refs will trigger warnings.
        this.lastSentenceTokens = tokens;
        this.prevRefCheck = {encounteredRef,line:this.lineCount};
        applyResolution();
    }
    public static stripMark(text:string) {
        return text.slice(1);// Remove the leading '*' or '#' or : or !
    }
    private resolveAlias(tokens:Token[]) {
        let alias = '';
        let predicate:string | null = null;
        
        tokens.forEach(token=>{
            const text = token.text!;
            const type = token.type;

            if (type === DSLLexer.PLAIN_WORD) {
                alias = text;
            }
            else if (type === DSLLexer.PREDICATE) {
                predicate = Resolver.stripMark(text);
                this.predicates.set(predicate,predicate);
                if (!this.records[predicate]) this.records[predicate] = new Rec([]);//this creates a record for the predicates if it doesnt have one which happens when it wasnt used elsewhere prior to the alias declaration
            }
            else if ((type === DSLLexer.TERMINATOR)) {
                if (text.endsWith('\n')) this.targetLineCount += 1;//increment the count at every new line created at the end of the sentence
            }
        });
        //i intially made it to point to the predicate record in memory if it existed,but after moving to json outputs,it led to duplicate entries that only increased the final document size for every alias.so i prevented it from pointing to the predicate record if it existed and had it its own unique but empty record.
        this.records[alias] = new Rec([]);
        this.aliases.set(alias,predicate || alias);//the fallback is for when there is no predicate provided to point to in the alias declaration.its used as a shorthand where the alias points to the predicate of the same name.its a pettern to invalidate the use of those predicates for better safety.

        if (this.builtAFact) {
            Essentials.castReport({
                kind:ReportKind.Warning,
                line:this.lineCount,
                msg:`-It is best to declare aliases at the top to invalidate the use of their predicate counterpart early.\n-This will help catch errors sooner.`,
                srcText:alias
            });
        }
    }
    private expandRecursively(input:any[][],flatSequences:any[][] = []):any[][] {
        console.log('\n expa recursive input: ',input,'\n');
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
    private recommendUsedName(text:string):string | null {
        for (const name of Object.keys(this.usedNames)) {
            if (distance(name,text!) < 4) {
                return name;
            }
        }
        return null;
    }
    private validatePredicateType(token:Token):void {
        const text = token.text!;
        const isAlias = this.aliases.has(Resolver.stripMark(text));//the aliases set stores plain words
        
        if (isAlias && ! text.startsWith('#')) {
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:`-Aliases are meant to be prefixed with ${chalk.bold('#')} but found ${chalk.bold(text)}. Did you mean: #${chalk.bold(Resolver.stripMark(text))}?`,
                srcText:text
            });
        }
        if (!isAlias && ! text.startsWith("*")) {
            let message:string = `-Predicates are meant to be prefixed with ${chalk.bold('*')} but found ${chalk.bold(token.text)}.\n-Did you forget to declare it as an alias? `;
            const recommendedAlias = this.recommendAlias(text);
            message += (recommendedAlias)?`Or did you mean to type #${recommendedAlias}?`:'';
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:message,
                srcText:text
            });
        }
    }
    private getRelation(tokens:Token[]):string | null {
        let relation:string | null = null;
        tokens.forEach(token => {
            const text = token.text!;
            const type = token.type;
            if ((type === DSLLexer.PREDICATE) || (type === DSLLexer.ALIAS) ) {
                if (relation !== null) {
                    Essentials.castReport({
                        kind:ReportKind.Semantic,
                        line:this.lineCount,
                        msg:`-They can only be one alias or predicate in a sentence but found ${chalk.bold('*'+relation)} and ${chalk.bold(text)} being used at the same time.`,
                        srcText:text
                    });
                }
                this.validatePredicateType(token);
                relation = Resolver.stripMark(text);
                this.predicateForLog = relation;

                if (type===DSLLexer.PREDICATE) {
                    this.predicates.set(relation,relation);//this is entirely for type generation support on the client side
                    if (!this.records[relation]) {//im only doing this for the predicate because aliases are guaranteed to have their records after alias resolution
                        this.records[relation] = new Rec([]);
                    }
                }
            }
        });
        if (relation === null) {
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:'-A sentence must have one predicate or alias.',
                srcText:Resolver.srcLine(this.lineCount)!
            });
        }else if (omittedJsonKeys.has(relation)) {
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:`The following keys should not be used as predicates or aliases as they are used to omit unnecessary data from the json document:\n${chalk.yellow(Array.from(omittedJsonKeys))}`,
                srcText:relation
            });
        }
        return relation;
    }
    private buildFact(tokens:Token[]) {
        const relation = this.getRelation(tokens);
        if (relation === null) return;
    
        const tokenQueue = new Denque(tokens);
        const groupedData = this.inspectRelevantTokens(tokenQueue,false);
        if (Resolver.terminate) return;

        this.expandedFacts = this.expandRecursively(groupedData!);
        for (const fact of this.expandedFacts) {;
            if (fact.length === 0) Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:'-A sentence must contain at least one atom.',
                srcText:Resolver.srcLine(this.lineCount)!
            });
            const referredPredicate = this.predicates.get(relation) || this.aliases.get(relation);
            this.records[referredPredicate!].add(fact);
        }
        this.builtAFact = true;
    }
    public static isStrict = (text:string)=>text.startsWith('!');

    private validateNameUsage(text:string) {
        const str = Resolver.stripMark(text);
        if (Resolver.isStrict(text) && !(str in this.usedNames)) {
            let message = `-There is no existing usage of the name '${chalk.bold(str)}'`;
            const recommendedName = this.recommendUsedName(str);
            message += (recommendedName)?`\n-Did you mean to type ${chalk.bold('!'+recommendedName)} instead?`:`\n-It has to be written as ${chalk.bold(':'+str)} since it is just being declared.`;
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:message,
                srcText:text
            });
        }else if (!Resolver.isStrict(text) && this.usedNames[str] > 0) {//only give the recommendation if this is not the first time it is used
            Essentials.castReport({
                kind:ReportKind.Warning,
                line:this.lineCount,
                msg:`-You may wish to type ${chalk.bold("!"+str)} rather than loosely as ${chalk.bold(":"+str)}. \n-It signals that it has been used before here and it prevents errors early.`,
                srcText:text
            });
        }
        if (str in this.usedNames) {
            this.usedNames[str] += 1;
        }
    }
    //the reason why it has a readonly parameter because this function was formely used in two places and one had to call it for just the tokens while the other had to call it to make some mutations.So im still leaving it in case ill use it in another place one day
    private inspectRelevantTokens(tokens:Denque<Token>,readOnly:boolean=true,level:[number]=[0],visitedNames=new Set<string>(),shouldClone:boolean=true) {
        if (Resolver.terminate) return;
        const tokenQueue = shouldClone ? new Denque(tokens.toArray()) : tokens;//to prevent unwanted mutation if the queue is to be reused elsewhere
        const list:any[] = [];
        const inRoot = level[0] === 0;
        while (tokenQueue.length !== 0) {
            const token = tokenQueue.shift()!;
            const type = token.type;
            const text = token.text!;
            if (type === DSLLexer.NAME) {
                const str = Resolver.stripMark(text);
                if (!readOnly) {
                    if (visitedNames.has(str)) {
                        Essentials.castReport({
                            kind:ReportKind.Semantic,
                            line:this.lineCount,
                            msg:`-The same name cannot be used more than once in a sentence but found ${chalk.bold(text)} repeated.`,
                            srcText:text
                        });
                    }
                    visitedNames.add(str);
                    if (Resolver.terminate) return;
                }
                list.push((inRoot)?[str]:str);
            }
            else if (type === DSLLexer.NUMBER) {
                const num = Number(text);
                list.push((inRoot)?[num]:num);
            }
            else if (type === DSLLexer.LSQUARE) {
                level[0] += 1;
                const arr = this.inspectRelevantTokens(tokenQueue,readOnly,level,visitedNames,false);// explicitly pass false for shouldClone, so that the method uses the existing queue directly without cloning.
                if (arr && (arr.length > 0)) {
                    list.push(arr);
                }else {
                    Essentials.castReport({
                        kind:ReportKind.Warning,
                        line:this.lineCount,
                        msg:`-The empty array is ignored.`,
                        srcText:'[]'
                    });
                }
            }
            else if (type === DSLLexer.RSQUARE) {
                level[0] -= 1;
                break;
            }else if (type === DSLLexer.PLAIN_WORD) {
                const capitalLetter = text.toUpperCase()[0];
                const exclude = new Set(['A','I']);
                if (text.startsWith(capitalLetter) && !exclude.has(text)) {
                    Essentials.castReport({
                        kind:ReportKind.Warning,
                        line:this.lineCount,
                        msg:`-Did you mean to write the name,${chalk.bold(":"+text)} instead of the filler,${chalk.bold(text)}?`,
                        srcText:text
                    });
                }
            }else if ((type === DSLLexer.TERMINATOR) && !readOnly) {
                if (text.endsWith('\n')) this.targetLineCount += 1;//increment the count at every new line created at the end of the sentence
            }
        };
        return list;
    }
    public static createSrcLines(input:string) {
        return input.split('\n');
    }
}
async function generateJson(srcPath:string,input:string,fullInput:string) {//the full input variabe here,is in the case where this function is called after purging and the full input is required for some state updates not for resolution.
    const fullSrcLines = Resolver.createSrcLines(fullInput);
    updateStaticVariables(srcPath,fullSrcLines);

    const resolver = new Resolver();
    Resolver.srcLines = fullSrcLines;//im using the full src lines for this state over the input because the regular input is possibly purged and as such,some lines that will be accessed may be missing.It wont cause any state bugs because the purged and the full text are identical except that empty lines are put in place of the purged ones.
    Essentials.parse(input);
    if (Resolver.terminate) return Result.error;

    await Resolver.flushLogs();//to capture syntax errors to the log
    await resolver.visit(Essentials.tree!);
    if (!Resolver.terminate) {
        Resolver.wasTerminated = false;
        return {aliases:resolver.aliases,predicates:resolver.predicates,records:resolver.records};
    }else {
        return Result.error;
    }
}
function updateStaticVariables(srcPath:string,srcLines:string[]) {
    Resolver.terminate = false;
    Resolver.lastDocumentPath = srcPath;
    const srcKeysAsSet = new Set(srcLines.map((content,line)=>Essentials.createKey(line,content)));
    const visitedSentences = convMapToRecord(Resolver.visitedSentences);
    for (const [key,visitedSentence] of Object.entries(visitedSentences)) {
        if (!srcKeysAsSet.has(visitedSentence.uniqueKey)) {
            Resolver.visitedSentences.delete(key);
        }
    }
}
//the srcPath variable is to tie the lifetime of some static variables to the current path rather than on each request
function clearStaticVariables(srcPath:string) {//Note that its not all static variables that must be cleared or be cleared here.
    Resolver.terminate = false;//reset it for subsequent analyzing
    Resolver.srcLines.length = 0;
    Resolver.logs = null;
    Resolver.logFile = null;
    Resolver.lspAnalysis = null;
    Essentials.tree = null;//to prevent accidentally reading an outadted src tree.
    DependencyManager.dependents = [];
    if (srcPath !== Resolver.lastDocumentPath) {
        console.log('\nCleared visited sentences\n',srcPath,'visi',Resolver.lastDocumentPath);
        Resolver.visitedSentences.clear();//the reason why i tied its lifetime to path changes is because the purging process used in incremental analysis will allow semantically identical sentences from being caught if the previous identical sentences wont survive the purge
    }
}
function getOutputPathNoExt(srcFilePath:string,outputFolder?:string) {
    const filePathNoExt = path.basename(srcFilePath, path.extname(srcFilePath));
    const outputPath = outputFolder || path.dirname(srcFilePath);
    return path.join(outputPath,filePathNoExt);
}
async function accessOutputFolder(outputFilePath:string):Promise<void> {
    const outputFolder = path.dirname(outputFilePath);
    try {
        await fs.access(outputFolder);   
    }catch {
        console.info(chalk.yellow(`The output folder is the absent.Creating the dir: `) +  outputFolder + '\n');
        await fs.mkdir(outputFolder);
    };
}
async function setUpLogs(outputFilePath:string) {
    await accessOutputFolder(outputFilePath);
    const logPath = outputFilePath + '.ansi';
    Resolver.logFile = logPath;
    Resolver.logs = [];
    await fs.writeFile(Resolver.logFile, 'THIS IS A DIAGNOSTICS FILE.VIEW THIS UNDER AN ANSI PREVIEWER.\n\n');
}
async function writeToOutput(outputFilePath:string,jsonInput:string,start:number):Promise<string> {
    await accessOutputFolder(outputFilePath);
    const jsonPath = outputFilePath + ".json";
    await fs.writeFile(jsonPath,jsonInput);

    const totalTime = Number( (performance.now() - start).toFixed(3) );
    await fs.appendFile(Resolver.logFile!,chalk.green(`\n\nThe document resolved in ${totalTime} ms (${(totalTime/1000).toFixed(3)} seconds)`));

    const messages = [`\n${lime('Successfully wrote JSON output to: ')} ${jsonPath}\n`,`\n${lime('Successfully wrote ansi report to: ')} ${Resolver.logFile}\n`];
    console.log(messages.join(''));
    return jsonPath;
}
const omittedJsonKeys = new Set(['set','indexMap','recID','members']);//I didnt preserve recID because they are just for caching and not lookups.New ones can be reliably generated at runtime for caching.
function omitJsonKeys(key:string,value:any) {
    if (omittedJsonKeys.has(key)) {
        return undefined; // exclude 'password'
    }
    return value; // include everything else
}
export async function resolveDocument(srcFilePath:string,outputFolder?:string):Promise<ResolutionResult> {
    clearStaticVariables(srcFilePath);//one particular reason i cleared the variables before resolution as opposed to after,is because i may need to access the static variables even after the resolution process.an example is the aliases state that i save into the document even after resolution

    const start = performance.now();
    const isValidSrc = srcFilePath.endsWith(".fog");
    if (!isValidSrc) {
        console.error(chalk.red('The resolver only reads .fog files.'));
        return {result:Result.error,jsonPath:Result.error};
    }
    try {
        const outputFilePath = getOutputPathNoExt(srcFilePath,outputFolder);
        const srcText = await fs.readFile(srcFilePath, 'utf8');

        await setUpLogs(outputFilePath);//this must be initialized before generating the struct as long as the file log is required
        const resolvedResult = await generateJson(srcFilePath,srcText,srcText);//the result here will be undefined if there was a resolution error.
        
        if (resolvedResult !== Result.error) {
            const predicateRecord:Record<string,string> = {
                ...convMapToRecord(resolvedResult.predicates),
                ...convMapToRecord(resolvedResult.aliases)
            };
            const fullData:FullData = {predicates:predicateRecord,records:resolvedResult.records};
            const jsonPath = await writeToOutput(outputFilePath,stringify(fullData,omitJsonKeys,4) || '',start);
            return {result:Result.success,jsonPath};
        }else {
            console.error(chalk.red('Unable to resolve the document at path: '),srcFilePath);
            return {result:Result.error,jsonPath:undefined};
        }
    }catch(error) {
        console.error(chalk.red.underline(`\nA File error occured: \n `),error);
        return {result:Result.error,jsonPath:undefined};
    }
}
interface Dependent {
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
class DependencyManager extends DSLVisitor<boolean | undefined> {
    public static dependents:(Dependent | null)[] = [];

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
    private xand(a:boolean,b:boolean):boolean {
        return (!a && !b) || (a && b);
    }
    //please note that the properties on the dependnet,although looking identical to the ones under the current this context,arent the same.the ones on the this context used here is for the potential dependency but a dependency can also be a dependnent which is why the this context is used when adding it as a dependent
    private checkIfDependency(dependentIndex:number,contributed:boolean) {
        const dependent = DependencyManager.dependents[dependentIndex]!;//this function is called under branches where the dependent isnt null.so we can safely asser it here.
        const {settledRef,settledAlias,unsettledNames} = dependent;

        const hasRef = dependent.reference;
        const hasAlias = dependent.alias !== null;

        const isFullySatisfied = this.xand(hasRef,settledRef) && this.xand(hasAlias,settledAlias) && (unsettledNames.size === 0);
        const isPartiallySatisfied = this.xand(hasRef,settledRef) || this.xand(hasAlias,settledRef) || (unsettledNames.size < dependent.names.size);
        
        if (contributed && (isPartiallySatisfied || isFullySatisfied)) {
            this.satisfiedDependents.push(dependent);
            if (dependent.includeDependency) this.includeAsDependency = true;
            if (isFullySatisfied) {
                DependencyManager.dependents[dependentIndex] = null;//Using null instead of removal prevents index shifts and improves processing integrity.
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
            const refTypes = new Set([DSLLexer.SINGLE_SUBJECT_REF,DSLLexer.SINGLE_OBJECT_REF,DSLLexer.GROUP_SUBJECT_REF,DSLLexer.GROUP_OBJECT_REF]);
            if (refTypes.has(type) && !dependent.reference) {
                dependent.reference = true;
            }
            if ((type === DSLLexer.ALIAS) && !dependent.alias) {
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
    private settleDependents(tokens:Token[]) {//this function doesnt try settling alias dependencies because they can only be done by alias declarations
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
    }
    private settleAliasDependents(tokens:Token[]) {
        for (let i=0; i < DependencyManager.dependents.length; i++) {
            const dependent = DependencyManager.dependents[i];
            if (dependent === null) continue;
            let contributed = false;
            if (dependent.alias !== null) {
                for (const token of tokens) {
                    const text = token.text!;
                    const type = token.type;
                    if (type === DSLLexer.PLAIN_WORD) {
                        if (dependent.alias === text) {//no need to strip the text here since its directly a plain word
                            dependent.settledAlias = true;
                            contributed = true;
                        }
                        break;
                    }
                }
                this.checkIfDependency(i,contributed);
            }
        }
    }
    public visitFact = (ctx:FactContext)=> {
        const tokens:Token[] = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.settleDependents(tokens);//its important that this line settles any dependents if it can,before finally checking for its own dependencies.Else,it will end up trying to settle its own dependencies with itself
        this.checkForDependencies(tokens);
        return undefined;
    };
    public visitAliasDeclaration = (ctx:AliasDeclarationContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.settleAliasDependents(tokens);
        return undefined;
    };
    public visitProgram = (ctx:ProgramContext)=> {
        for (const child of ctx.children) {
            if (child instanceof FactContext) {
                this.visitFact(child);
            }else if (child instanceof AliasDeclarationContext) {
                this.visitAliasDeclaration(child);
            }
        }
        return undefined;
    };
    public visit = (tree: ParseTree)=> {//The purger checks for dependencies and settles dependents in one visit per src line its called on.So there are no separate processes of dependency recording and then, dependency settlement
        if (tree instanceof ProgramContext) {
            this.visitProgram(tree); // Pass the context directly
        }
        return this.includeAsDependency;
    };
}
//the cache used by the purger should map src lines to whatever value they are meant to hold
//It expects the cache to have a particular key format as defined in the createKey function
//It mutates the cache in place
interface PurgeResult<V> {
    unpurgedSrcText:string,
    purgedEntries:V[]
}
class Purger {
    public static purge<V extends object>(srcText:string,srcPath:string,cache:LRUCache<string,V>,emptyValue:V):PurgeResult<V> {
        const srcLines = Resolver.createSrcLines(srcText);
        const unpurgedSrcLines = new CustomQueue<string>([]);
        const srcKeysAsSet = new Set(srcLines.map((content,line)=>Essentials.createKey(line,content)));
        
        const entries = [...cache.keys()];
        const purgedEntries:V[] = [];

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
            const key = Essentials.createKey(line,srcLine);
            const inCache = cache.has(key);

            const inSameDocument = srcPath === Resolver.lastDocumentPath;//i tied the choice to purge to whether the document path has changed.This is to sync it properly with static variables that are also tied to te document's path

            const manager = new DependencyManager({key,line,srcLine,srcLines,inCache});
            Essentials.parse(srcLine);

            const isADependency = manager.visit(Essentials.tree!);
            const shouldPurge = inSameDocument && inCache && !isADependency;
        
            if (shouldPurge) {//if this condition is true,then this line will be purged out(not included) in the final text
                purgedEntries.push(cache.get(key)!);
                unpurgedSrcLines.unshift(" ");//i inserted whitespaces in place of the purged lines to preserve the line ordering
            }else {
                console.log('\nunshifting src line: ',key,'isDependency: ',isADependency,'inCache: ',inCache);   
                unpurgedSrcLines.unshift(srcLine);
                cache.delete(key);//remove from the cache entry since its going to be reanalyzed
                
                const satisfiedDependents = manager.satisfiedDependents;
                for (const dependent of satisfiedDependents) {
                    console.log('Inserting dependent: ',dependent.uniqueKey);
                    // cache.delete(dependent.uniqueKey);
                    unpurgedSrcLines.set(dependent.line-line,dependent.srcLine);
                }
            }
            //Initiate all src lines into the cache with empty diagnostics to mark the lines as visited.It must be done after deciding to purge it and before calling the resolver function.This is because this it intializes all keys in the cache with empty diagnostics and as such,purging after this will falsely prevent every text from entering the purged text to be analyzed.
            if (!(Essentials.isWhitespace(key)) && !cache.has(key)) {//we dont want to override existing entries
                cache.set(key,emptyValue);
            }
        }
        const unpurgedSrcText:string = unpurgedSrcLines.array().join('\n');
        return {unpurgedSrcText,purgedEntries};
    }
}
export async function analyzeDocument(srcText:string,srcPath:string):Promise<lspAnalysis> {
    clearStaticVariables(srcPath);
    const {unpurgedSrcText,purgedEntries} = Purger.purge(srcText,srcPath,Resolver.lspDiagnosticsCache,[]);
    const cachedDiagnostics:lspDiagnostics[] = [];
    purgedEntries.forEach(entry=>cachedDiagnostics.push(...entry));

    //Reset the lsp analysis for the current text
    Resolver.lspAnalysis = {
        diagnostics:[]
    };
    console.log('🚀 => :1019 => analyzeDocument => unpurgedSrcText:', unpurgedSrcText);
    await generateJson(srcPath,unpurgedSrcText,srcText);//this populates the lsp analysis
    console.log('cache After: ',convMapToRecord(Resolver.lspDiagnosticsCache as Map<any,any>));
    
    const fullDiagnostics = Resolver.lspAnalysis.diagnostics.concat(cachedDiagnostics);//this must be done after resolving the purged text because its only then,that its diagnostics will be filled
    const fullLspAnalysis:lspAnalysis = {...Resolver.lspAnalysis,diagnostics:fullDiagnostics};
    console.log('visited sentences: ',Resolver.visitedSentences);
    return fullLspAnalysis;
}