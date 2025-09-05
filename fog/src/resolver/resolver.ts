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
import { FullData,convMapToRecord,Rec, ResolutionResult, Result,lspAnalysis, lspSeverity, lspDiagnostics } from "../utils/utils.js";
import { AtomList } from "../utils/utils.js";
import fs from 'fs/promises';
import path from 'path';
import stripAnsi from 'strip-ansi';


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
function mapToColor(kind:ReportKind):ChalkInstance {
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
}

enum ReportKind {
    Semantic="Semantic Error at",
    Syntax="Syntax Error at",
    Warning="Double check"
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


//todo:Make the fuctions more typesafe by replacing all the type shortcuts i made with the any type to concrete ones.and also try to make the predicates typed instead of dynamically sized arrays of either string or number.This has to be done in the dsl if possible.
class Essentials {
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext;

    private static buildDiagnosticsFromReport(report:Report):void {
        if (Resolver.lspAnalysis===null) return;//dont generate lsp analysis if not required
        const {kind,line,lines,msg,srcText} = report;//line is 0-based
        const mapToSeverity =  {
            [ReportKind.Semantic]:lspSeverity.Error,
            [ReportKind.Syntax]:lspSeverity.Error,
            [ReportKind.Warning]:lspSeverity.Warning
        };
        const severity = mapToSeverity[kind];

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
        const cleanMsg = stripAnsi(msg.replace(/\r?\n|\r/g, " "));//strip ansi codes and new lines
        if (!lines && ((typeof srcText === "string") || (srcText === EndOfLine.value))) {
            const diagnostic = buildDiagnostic(line,srcText,cleanMsg);
            Resolver.lspAnalysis.diagnostics.push(diagnostic);
        }
        else if (lines && Array.isArray(srcText)){
            for (let i = 0; i < lines.length; i++) {
                const targetLine = lines[i];
                const text = srcText[i];
                const message =(targetLine===line)?cleanMsg:`This line is involved in an issue with line ${line + 1}.`;
                const diagnostic = buildDiagnostic(targetLine, text,message);
                Resolver.lspAnalysis.diagnostics.push(diagnostic);
            }
        }
    }
    public static castReport(report:Report):void {
        Essentials.buildDiagnosticsFromReport(report);
        const {kind,line,lines,msg} = report;
        const messages = [];

        console.log('🚀 => :78 => pushLine => line:', line);
        const pushLine = (line:number):void => {messages.push(brown(Resolver.srcLine(line)?.trim() + '\n'));};
        const errTitle = chalk.underline(`\n${kind} line ${line + 1}:`);
        const coloredTitle = mapToColor(kind)(errTitle);

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

        if ((kind===ReportKind.Semantic) || (kind===ReportKind.Syntax)) {
            Resolver.terminate = true;
        }
    }
    public static loadEssentials(input:string):void {
        ConsoleErrorListener.instance.syntaxError = (recognizer:any, offendingSymbol:any, line: number, column:number, msg: string): void =>{
            const zeroBasedLine = line - 1;//the line returned by this listenere is 1-based so i deducted 1 to make it 0-based which is the correct form the pogram understands
            const srcLine = Resolver.srcLine(zeroBasedLine)!;
            const srcText = srcLine[column] || EndOfLine.value;

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
export class Resolver extends DSLVisitor<Promise<undefined | Token[]>> {
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    public records:Record<string,Rec> = {};
    public aliases = new Map<string,string>();//this is used for semantic safety by usin it to know which relations are declared as aliases or not so as to enforce checks when resolving the document.its also used in conjuction with the predicates map to clarify which records need full fact data to themselves and to build the final predicate map
    public predicates = new Map<string,string>();//this is used in conjuction with the aliases map to understand what records need their facts built into their own record.This mechanism ensures that only preidcates get a built record of facts to themsleves and aliases dont.it is comined with the alias map into a single oobject that maps the relations(predicates or aliases) to the conccrete predicates they refer to.This allows the json document to contain info about what record points to what(in the case of aliases).This greatly reduces the document size by having alias records completely empty and all the facts that belongs to the are transferred to the concrete proedicate.so at loading time,the fact chcekcer can know what they point to by using the predicate map.

    //the reason why im explicitly managing the line count instead of the index at every program context visit iteration is because that method assumes that the each context is a line which isnt the case when there are multiple snetences in a line.
    private lineCount:number = 0;//this meant to be read-only by all methods but only mutated once at the end of each resolution step to be equal to the mutable line count
    private targetLineCount:number = this.lineCount;//this is the mutable line count that is safe to increment by any method that inspects tokens and at every new line.Its not meant to be done by every method that inspects tokens but only a few.and here,only three pieces of the codebase does this.This is to prevent incorrect state bugs.

    public static terminate:boolean = false;

    public static logFile:string | null = null;
    public static logs:string[] | null = null;
    public static linesToLogAtATime:number = 10;
    public static inputArr:string[] = [];

    private expandedFacts:AtomList[] | null = null;
    private builtAFact:boolean = false;

    private lastSentenceTokens:Token[] = [];
    private prevRefCheck:RefCheck = {encounteredRef:null,line:0};//for debugging purposes.It tracks the sentences that have refs in them and it is synec with lastTokenForSIngle.It assumes that the same tokens array will be used consistently and not handling duplicates to ensure that the keys work properly
    private usedNames:Record<string,number> = {};//ive made it a record keeping track of how many times the token was discovered
    private predicateForLog:string | null = null;

    private visitedSentences = new Map<string,number>();
    public static lspAnalysis:lspAnalysis | null = null;

    //this method expects that the line is 0-based
    public static srcLine = (line:number):string | undefined => Resolver.inputArr.at(line);
    private printTokens(tokens:Token[] | null):void {
        const tokenDebug = tokens?.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('\n Tokens:',tokenDebug);
    }
    private logProgress(tokens:Token[] | null) {
        if ((tokens===null) || Resolver.terminate) return;
        const resolvedSentence = tokens?.map(token=>token.text!).join(' ') || '';
        const originalSrc  = Resolver.inputArr.at(this.lineCount)?.trim() || '';//i used index based line count because 1-based line count works for error reporting during the analyzation process but not for logging it after the process
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

        let successMessage = lime.underline(`\nProcessed line ${this.lineCount + 1}: `);//the +1 to the line count is because the document is numbered by 1-based line counts even though teh underlying array is 0-based
        successMessage += `\n-Sentence: ${brown(originalSrc)}`;
        successMessage += (this.prevRefCheck.encounteredRef)?`\n-With resolved references: ${brown(resolvedSentence)}`:'';//using prevRefCehck under the same loop accesses the ref check of the latest senetnce.
        
        if (this.predicateForLog) {//the condition is to skip printing this on alias declarations.The lock works because this is only set on facts and not on alias declarations.Im locking this on alias declarations because they dont need extra logging cuz there is no expansion data or any need to log the predicate separately.just the declaration is enough
            const predicateFromAlias = this.aliases.get(this.predicateForLog || '');
            successMessage += (predicateFromAlias)?`\n-Alias #${this.predicateForLog} -> *${predicateFromAlias}`:`\n-Predicate: *${this.predicateForLog}`;
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
                    name = this.stripMark(name);//strip their prefixes
                    name = this.aliases.get(name) || name;//the fallback is for the case of predicates
                    tokenNames.unshift(name);
                }else {
                    tokenNames.push(name);
                }
            }
        });
        const stringifiedNames = stringify(tokenNames.toArray());
        console.log('🚀 => :175 => checkForRepetition => tokenNames:', tokenNames.toArray());
        if (this.visitedSentences.has(stringifiedNames)) {
            const sameSentenceLine = this.visitedSentences.get(stringifiedNames)!;
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                srcText:[Resolver.srcLine(sameSentenceLine)!,Resolver.srcLine(this.lineCount)!],
                msg:`-This sentence is semantically identical to line ${sameSentenceLine}.\n-It is repetitive so remove it to improve resolution speed and reduce the final document size.`,
                lines:[sameSentenceLine,this.lineCount]
            });
        }else {
            this.visitedSentences.set(stringifiedNames,this.lineCount);//i mapped it to its line in the src for error reporting
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
        if (this.lineCount === (Resolver.inputArr.length-1)) {//this block is to increment the line count at the end of the file.This is because i dont directly have the eof token in the tokens array which is because they only contain sentences.so without that,the line count at the end of the file will always be a count short which s why im checking it against the input array.length - 1.Explicitly incrementing it under tis conditin fixes that.
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
            const EOF = this.lineCount===Resolver.inputArr.length;
            const shouldFlushLogs = Resolver.terminate || EOF || ((this.lineCount % Resolver.linesToLogAtATime)===0);
            if (shouldFlushLogs) {
                await Resolver.flushLogs();
            }
        }
        return undefined;
    };
    public visit = async (tree: ParseTree)=> {
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
                
                const member = getNthMember(nthIndex).nthMember;
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
                
                const result = getNthMember(nthIndex);
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
                encounteredRef = 'generic';
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
    private stripMark(text:string) {
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
                predicate = this.stripMark(text);
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
        const isAlias = this.aliases.has(this.stripMark(text));//the aliases set stores plain words
        
        if (isAlias && ! text.startsWith('#')) {
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:`-Aliases are meant to be prefixed with ${chalk.bold('#')} but found ${chalk.bold(text)}. Did you mean: #${chalk.bold(this.stripMark(text))}?`,
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
                relation = this.stripMark(text);
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
    private validateNameUsage(text:string) {
        const isStrict = text.startsWith('!');
        const str = this.stripMark(text);

        if (isStrict && !(str in this.usedNames)) {
            let message = `-There is no existing usage of the name '${chalk.bold(str)}'`;
            const recommendedName = this.recommendUsedName(str);
            message += (recommendedName)?`\n-Did you mean to type ${chalk.bold('!'+recommendedName)} instead?`:`\n-It has to be written as ${chalk.bold(':'+str)} since it is just being declared.`;
            Essentials.castReport({
                kind:ReportKind.Semantic,
                line:this.lineCount,
                msg:message,
                srcText:text
            });
        }else if (!isStrict && this.usedNames[str] > 0) {//only give the recommendation if this is not the first time it is used
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
                const str = this.stripMark(text);
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
                list.push(this.inspectRelevantTokens(tokenQueue,readOnly,level,visitedNames,false));// explicitly pass false for shouldClone, so that the method uses the existing queue directly without cloning.
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
    public createSentenceArray(input:string) {
        Resolver.inputArr = input.split('\n');
    }
}
async function generateJson(input:string) {
    const visitor = new Resolver();
    visitor.createSentenceArray(input);
    Essentials.loadEssentials(input);
    await Resolver.flushLogs();//to capture syntax errors to the log
    await visitor.visit(Essentials.tree);
    if (!Resolver.terminate) {
        return {aliases:visitor.aliases,predicates:visitor.predicates,records:visitor.records};
    }else {
        return Result.error;
    }
}
function clearStaticVariables() {
    Resolver.terminate = false;//reset it for subsequent analyzing
    Resolver.inputArr.length = 0;
    Resolver.logs = null;
    Resolver.logFile = null;
    Resolver.lspAnalysis = null;
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
    clearStaticVariables();//one particular reason i cleared the variables before resolution as opposed to after,is because i may need to access the static variables even after the resolution process.an example is the aliases state that i save into the document even after resolution
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
        const resolvedResult = await generateJson(srcText);//the result here will be undefined if there was a resolution error.
        
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

export async function analyzeDocument(srcText:string):Promise<lspAnalysis> {
    clearStaticVariables();
    Resolver.lspAnalysis = {
        diagnostics:[]
    };
    await generateJson(srcText);
    return Resolver.lspAnalysis;
}