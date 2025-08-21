import { CharStream, CommonTokenStream, ConsoleErrorListener,Token } from "antlr4ng";
import { AliasDeclarationContext,DSLParser, FactContext,ProgramContext } from "./generated/DSLParser.js";
import { DSLLexer } from "./generated/DSLLexer.js";
import { DSLVisitor } from "./generated/DSLVisitor.js";
import { Rec } from "./fact-checker.js";
import chalk from "chalk";
import Denque from "denque";
import { cartesianProduct } from "combinatorial-generators";
import {distance} from "fastest-levenshtein";
import stringify from "safe-stable-stringify";
import {Heap} from "heap-js";
// import stringify from "safe-stable-stringify";
// import {colorize} from "json-colorizer";

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
type RefCheckMap = Map<Token[],{hasRef:boolean,line:number}>;

//todo:Make the fuctions more typesafe by replacing all the type shortcuts i made with the any type to concrete ones.and also try to make the predicates typed instead of dynamically sized arrays of either string or number.This has to be done in the dsl if possible.
class Essentials {
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext;

    
    public static report(errorType:string,lineCount:number,msg:string,checkLines?:number[]):void {
        const orange = chalk.hex('f09258f');
        const green = chalk.hex('adef1e');
        const darkGreen = chalk.hex('98ce25ff');
        const grey = chalk.hex("#ddcba0ff");

        function pushLine(line:number):void {
            messages.push(grey(Analyzer.inputArr[line-1].trim() + '\n'));
        }

        let title = chalk.underline(`\n${errorType} line ${lineCount}:`);
        title = (errorType === DslError.DoubleCheck)?orange(title):chalk.red(title);
        
        const messages = [title,`\n${msg}`,];
        if (!checkLines) {
            messages.push(green('\nCheck'),darkGreen('->'));
            pushLine(lineCount);
        }
        else{
            messages.push(chalk.green.underline('\nCheck these lines:\n'));
            for (const line of checkLines) {
                messages.push(chalk.gray(`${line}.`));
                pushLine(line);
            }
        }
        console.error(...messages);
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
class Analyzer extends DSLVisitor<void> {
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    public  records:Record<string,Rec> = {};
    private aliases = new Set<string>();

    private lineCount:number = 1;
    private targetLineCount:number = this.lineCount;

    public static terminate:boolean = false;

    private printTokens(tokens:Token[]):void {
        const tokenDebug = tokens.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('\n Tokens:',tokenDebug);
    }
    public visitProgram = (ctx:ProgramContext)=> {
        for (const child of ctx.children) {
            if (Analyzer.terminate) return;
            if (child instanceof FactContext) {
                this.visitFact(child);
            }else if (child instanceof AliasDeclarationContext) {
                this.visitAliasDeclaration(child);
            }else{
                const payload = child.getPayload();
                const isNewLine = (payload as Token).type === DSLLexer.NEW_LINE;
                if (isNewLine) this.targetLineCount += 1;//increment the line count at every empty new line
            }
            this.lineCount = this.targetLineCount;
        }
        return this.records;
    };
    public visitFact = (ctx:FactContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.resolveRefs(tokens);
        console.log('After resolution');
        this.printTokens(tokens);
        if (!Analyzer.terminate) this.buildFact(tokens);//i checked for termination here because ref resolution can fail
    };
    public visitAliasDeclaration = (ctx:AliasDeclarationContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.printTokens(tokens);
        this.resolveAlias(tokens);
    };

    private getListTokensBlock(tokens:Denque<Token>,nList:number,listCount:[number]=[0]):Token[] | null {
        listCount[0] += 1;
        let list:Token[] = [];
        let lBrackets:number = 0;
        let rBrackets:number = 0;

        while (tokens.length !== 0) {
            console.log('l:',lBrackets,'r:',rBrackets);
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

    private lastTokensForSingle = new Denque<Token[]>([]);
    private lastTokensForGroup = new Denque<Token[]>([]);
    private refCheckMap:RefCheckMap = new Map();//for debugging purposes.It tracks the sentences that have refs in them and it is synec with lastTokenForSIngle.It assumes that the same tokens array will be used consistently and not handling duplicates to ensure that the keys work properly
    private usedNames:Record<string,number> = {};//ive made it a record keeping track of how many times the token was discovered
    
    private resolveRefs(tokens: Token[]) {
        function allowRef(encounteredX:boolean,lineCount:number,refAsText:string,resTokenAsText:unknown):boolean {
            if (encounteredX) {//i added this here because its possible that the ref is in the same senetnce as the subject that its pointing to.and since they can only be one predicate in a sentece,it wil be difficult to meaningfully use the ref in the same sentence with the subject to make another sentence in conjuction with it.Anything that requires joining for readability should require a fullstop to separate the senetnces not using the ref in the same sentence.so :ada is *strong and <He> is *ggod should rsther be separate sentences in the same line
                let message = "-A reference cannot be used to point to a subject in the same sentence";
                message += `.\n-Is ${chalk.bold(refAsText)} supposed to point to ${chalk.bold(stringify(resTokenAsText))}? If so,separate it as its own sentence.`;
                Essentials.report(DslError.Semantic,lineCount,message);
                return false;
            }
            return true;
        }
        function extractNumFromRef(text:string,lineCount:number):number {
            const num =  Number(text.split(":")[1].slice(0,-1));
            if (!Number.isInteger(num)) Essentials.report(DslError.Semantic,lineCount,`-The reference; ${chalk.bold(text)} must use an integer`);
            if (num < 1) Essentials.report(DslError.Semantic,lineCount,`-The reference; ${chalk.bold(text)} must point to an object and not at index 0 which contains the subject.\n-If thats the intention,then use <He>,<She> or <It> because using object refs this way will lead to unexpected behaviour.`);
            if (num > 3) Essentials.report(DslError.DoubleCheck,lineCount,`-Are you sure you can track what this reference; ${chalk.bold(text)} is pointing to?`);
            return num;
        }
        function checkForRefAmbiguity(sentenceTokens:Token[],line:number,refIncludedMap:RefCheckMap) {
            const refInfo = refIncludedMap.get(sentenceTokens || []);
            console.log('🚀 => :175 => checkForRefAmbiguity => refInfo:', refInfo);
            if (refInfo?.hasRef) {
                let message = `-Be sure that you have followed how you are referencing an item in a sentence that also has a ref.`;
                message += `\n-You may wish to write the name explicitly in ${chalk.bold('line:'+refInfo.line)} to avoid confusion.`;
                Essentials.report(DslError.DoubleCheck,line,message,[refInfo.line,line]);
            }
        }
        const resolvedSingleTokens:ResolvedSingleTokens = {indices:[],tokens:new Map()};
        const resolvedGroupedTokens:ResolvedGroupedTokens = {indices:new Heap((a:number,b:number)=>b-a),tokens:new Map()};

        const objectRefs = new Set(['him','her','it','them','their']);
        const nounRefs = ['He','She','It','They',...objectRefs];

        let hasRef = false;
        let encounteredName = false;
        let encounteredList = false;

        for (const [index,token] of tokens.entries()){//I did no breaks here to allow all refs in the sentence to resolve
            const text = token.text!;
            const type = token.type;

            if ((type === DSLLexer.SINGLE_SUBJECT_REF) || (type === DSLLexer.SINGLE_OBJECT_REF)) {
                const isObjectRef =  (type === DSLLexer.SINGLE_OBJECT_REF);
                const refIndex = isObjectRef?extractNumFromRef(text,this.lineCount):0;//fallbacks to 0 here because arrays use 0 based indexing to start
                if (Analyzer.terminate) return;

                const sentenceIndex = isObjectRef?0:-1;//the object ref will always point to the first sentence which is directly the previous one while the subject ref will point to the last sentence-whether its the same or previous
                const sentenceTokens = this.lastTokensForSingle.toArray().at(sentenceIndex) || [];
                const allNames = sentenceTokens.filter(token=>(token.type===DSLLexer.NAME)); 
                const resolvedToken = allNames.at(refIndex) || null;

                checkForRefAmbiguity(sentenceTokens || [],this.lineCount,this.refCheckMap);
                if (!isObjectRef) {
                    if (!allowRef(encounteredName,this.lineCount,text,resolvedToken?.text)) return;
                }
                resolvedSingleTokens.indices.push(index);
                resolvedSingleTokens.tokens.set(index,resolvedToken);
                hasRef = true;
            }


            else if ((type === DSLLexer.GROUP_SUBJECT_REF) || (type === DSLLexer.GROUP_OBJECT_REF)) {
                const isObjectRef =  (type === DSLLexer.GROUP_OBJECT_REF);
                const refIndex = 1 + (isObjectRef?extractNumFromRef(text,this.lineCount):0);//I offset it from 1 because the list block getter using 1-based indexing (get the nth array from the sentence)
                if (Analyzer.terminate) return;

                const sentenceIndex = isObjectRef?0:-1;//the object ref will always point to the first sentence which is directly the previous one while the subject ref will point to the last sentence-whether its the same or previous
                const sentenceTokens = this.lastTokensForGroup.toArray().at(sentenceIndex) || [];
                const tokenQueue = new Denque(sentenceTokens);

                checkForRefAmbiguity(sentenceTokens || [],this.lineCount,this.refCheckMap);
                if (!isObjectRef) {
                    if (!allowRef(encounteredList,this.lineCount,text,(this.inspectRelevantTokens(tokenQueue) || []).at(0))) return;
                }

                const resolvedTokens = this.getListTokensBlock(tokenQueue,refIndex);
                resolvedGroupedTokens.indices.push(index);
                resolvedGroupedTokens.tokens.set(index,resolvedTokens);
                hasRef = true;

                console.log('resolved tokens:',index);
                this.printTokens(resolvedGroupedTokens.tokens.get(index) || []);
            }


            else if (type === DSLLexer.NAME) {//this must be called for every name to capture them
                const isLoose = text.startsWith(':');
                const str = this.stripMark(text);
                if (isLoose && !(str in this.usedNames)) this.usedNames[str] = 0;
                encounteredName = true;
            }


            else if (type === DSLLexer.LSQUARE) {//notice that even though the branches look identical,they are mutating different arrays
                encounteredList = true;
            }


            else if (type === DSLLexer.PLAIN_WORD) {//this branch is to warn users if they forgot to place angle brackets around the ref and may have also added a typo on top of that.If they made a typo within the angle brackets,it will be caught as a syntax error.This one catches typos not within the bracket as a warning
                for (const nounRef of nounRefs) {
                    const normText = text.toLowerCase();
                    const normNounRef = nounRef.toLowerCase();
                    const dist = distance(normText,normNounRef);
                    if (dist < 2) {
                        const suggestion = chalk.bold( (objectRefs.has(nounRef))?'<'+nounRef+':number>':'<'+nounRef+'>');
                        Essentials.report(DslError.DoubleCheck,this.lineCount,`-Did you mean to use the ref,${suggestion} instead of the filler,${chalk.bold(text)}?`);
                    }
                }
            }


            //Separate block that must run independently of the previous ladder
            if (!new Set(this.lastTokensForSingle.toArray()).has(tokens)) {//this prevents the same sentence of tokens from being pushed repeatedly on every name in te sentence
                this.lastTokensForSingle.push(tokens);
                this.refCheckMap.set(tokens,{hasRef,line:this.lineCount});//setting it multiple times(called on every loop that satisifies the condition) is safe because its never set back to false again in the loop
                if (this.lastTokensForSingle.length > 2) {
                    const removedToken = this.lastTokensForSingle.shift();
                    this.refCheckMap.delete(removedToken!);//deleting it multiple times is also safe since delete does nothing if the key doesnt exist
                }
            }
            if (!new Set(this.lastTokensForGroup.toArray()).has(tokens)) {//this prevents the same sentence of tokens from being pushed repeatedly on every name in te sentence
                this.lastTokensForGroup.push(tokens);
                this.refCheckMap.set(tokens,{hasRef,line:this.lineCount});
                if (this.lastTokensForGroup.length > 2) {
                    const removedToken = this.lastTokensForGroup.shift();
                    this.refCheckMap.delete(removedToken!);
                }
            }
        };
        //Apply all resolutions
        for (const index of resolvedSingleTokens.indices) {
            const resolvedToken = resolvedSingleTokens.tokens.get(index) || null;
            if (resolvedToken !== null) {//resolve the single ref
                tokens[index] = resolvedToken;
            }else {
                Essentials.report(DslError.Semantic,this.lineCount,`-Failed to resolve the singular reference,${chalk.bold(tokens[index].text)}.Could not find a name to point it to.`,[this.lineCount-1,this.lineCount]);
            }
        }
        for (const index of resolvedGroupedTokens.indices) {
            const resolvedTokens = resolvedGroupedTokens.tokens.get(index) || null;
            if (resolvedTokens !== null) {//resolve the group ref
                tokens.splice(index,1,...resolvedTokens);
            }else {
                Essentials.report(DslError.Semantic,this.lineCount,`-Failed to resolve the group reference,${chalk.bold(tokens[index].text)}.Could not find an array to point it to.`,[this.lineCount-1,this.lineCount]);
            }
        }
        if ((resolvedSingleTokens.indices.length > 2) || (resolvedGroupedTokens.indices.length > 2)) {
            Essentials.report(DslError.DoubleCheck,this.lineCount,`-Be careful with how multiple references are used in a sentence and be sure that you know what they are pointing to.`);
        }
    }
    private stripMark(text:string) {
        return text.slice(1);// Remove the leading '*' or '#' or : or !
    }
    private resolveAlias(tokens:Token[]) {
        let alias = '';
        let predicateRec:Rec = new Rec([]);
        tokens.forEach(token=>{
            const text = token.text!;
            const type = token.type;

            if (type === DSLLexer.PLAIN_WORD) {
                alias = text;
            }else if (type === DSLLexer.PREDICATE) {
                const predicate = this.stripMark(text);
                if (!this.records[predicate]) {
                    this.records[predicate] = new Rec([]);
                }
                predicateRec = this.records[predicate];
            }else if ((type === DSLLexer.TERMINATOR)) {
                if (text.endsWith('\n')) this.targetLineCount += 1;//increment the count at every new line created at the end of the sentence
            }
        });
        this.records[alias] = predicateRec;
        this.aliases.add(alias);
    }
    private flattenRecursively(input:any[][],flatSequences:any[][] = []):any[][] {
        for (const product of cartesianProduct(...input)) {
            if (product.some(value=>value instanceof Array)) {
                const boxedProduct = product.map(value=>{
                    if (!(value instanceof Array)) return [value];
                    return value;
                });
                this.flattenRecursively(boxedProduct,flatSequences);
            }else {
                flatSequences.push(product);
            }
        } 
        return flatSequences;
    }
    private recommendAlias(text:string):string | null {
        for (const alias of this.aliases.values()) {
            if (distance(alias,text!) < 3) {
                return alias;
            }
        }
        return null;
    }
    private validatePredicateType(token:Token):void {
        const isAlias = this.aliases.has(this.stripMark(token.text!));//the aliases set stores plain words
        
        if (isAlias && ! token.text!.startsWith('#')) {
            Essentials.report(DslError.Semantic,this.lineCount,`-Aliases are meant to be prefixed with  ${chalk.bold('#')} but found: ${chalk.bold(token.text)}.Did you mean: #${chalk.bold(this.stripMark(token.text!))}?`);
        }
        if (!isAlias && ! token.text!.startsWith("*")) {
            let message:string = `-Predicates are meant to be prefixed with ${chalk.bold('*')} but found: ${chalk.bold(token.text)}.\n-Did you forget to declare it as an alias? `;
            const recommendedAlias = this.recommendAlias(token.text!);
            message += (recommendedAlias)?`Or did you mean to type #${recommendedAlias}?`:'';
            Essentials.report(DslError.Semantic,this.lineCount,message);
        }
    }
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
            }
        });
        if (predicate === null) {
            Essentials.report(DslError.Semantic,this.lineCount,'-A sentence must have one predicate or alias.');
        }
        return predicate;
    }
    private buildFact(tokens:Token[]) {
        const predicate = this.getPredicate(tokens);
        if (predicate === null) return;
        const tokenQueue = new Denque(tokens);
        const groupedData = this.inspectRelevantTokens(tokenQueue,false);
        if (Analyzer.terminate) return;

        const flattenedData = this.flattenRecursively(groupedData!);

        for (const atoms of flattenedData) {;
            if (atoms.length === 0) {
                Essentials.report(DslError.Semantic,this.lineCount,'-A sentence must contain at least one atom.');
            }
            if (!this.records[predicate]) {
                this.records[predicate] = new Rec([]);
            }
            this.records[predicate].add(atoms);
        }
    }
    private validateNameByPrefix(token:Token) {
        const text = token.text!;
        const isStrict = text.startsWith('!');
        const str = this.stripMark(text);
        if (isStrict && !(str in this.usedNames)) {
            Essentials.report(DslError.Semantic,this.lineCount,`-Could not find an existing usage of the name; ${chalk.bold(str)}.\nDid you meant to type: ${chalk.bold(':'+str)} instead? Assuming that this is the first time it is used.`);
        }else if (!isStrict && this.usedNames[str] > 0) {//only recommend it if this is not the first time it is used
            Essentials.report(DslError.DoubleCheck,this.lineCount,`-You may wish to type the name; ${chalk.bold(str)} strictly as; ${chalk.bold("!"+str)} rather than loosely as; ${chalk.bold(":"+str)}. \n-It signals that it has been used before here and it prevents errors early.`);
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
                    this.validateNameByPrefix(token);
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
                if (text.startsWith(capitalLetter)) {
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
export function genStruct(input:string):Record<string,Rec> | undefined {
    const visitor = new Analyzer();
    visitor.createSentenceArray(input);
    Essentials.loadEssentials(input);
    visitor.visit(Essentials.tree);
    if (!Analyzer.terminate) return visitor.records;
}
