import { convMapToRecord, createKey, EndOfLine, FullData, lime, lspDiagnostics, omitJsonKeys, Path, ReportKind, ResolutionResult, Result } from "../utils/utils.js";
import { ParseHelper } from "./parse-helper.js";
import { Resolver } from "./resolver.js";
import path from "path";
import fs from "fs/promises";
import chalk from "chalk";
import stringify from "safe-stable-stringify";
import { DependencyManager } from "./dependency-manager.js";
import { Purger } from "./purger.js";
import { validator } from "../utils/utils.js";
import { Doc, serverDoc } from "../fact-checker/fact-checker.js";
import { ConsoleErrorListener } from "antlr4ng";

function overrideErrorListener():void {
    ConsoleErrorListener.instance.syntaxError = (recognizer:any, offendingSymbol:any, line: number, column:number, msg: string): void =>{
        const zeroBasedLine = line - 1;//the line returned by this listenere is 1-based so i deducted 1 to make it 0-based which is the correct form the pogram understands
        const srcLine = Resolver.srcLine(zeroBasedLine);
        const srcText = ((srcLine)?srcLine[column]:undefined) || EndOfLine.value;
        console.log('src txt',srcText);
        Resolver.castReport({
            kind:ReportKind.Syntax,
            line:zeroBasedLine,
            srcText,
            msg,
        });
    };
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function generateJson(srcPath:string,srcText:string,fullSrcText:string) {//the full src text variabe here,is in the case where this function is called with a purged src text and the full one is required for some state updates not for resolution.
    const fullSrcLines = Resolver.createSrcLines(fullSrcText);
    updateStaticVariables(srcPath,fullSrcLines);

    const resolver = new Resolver();
    Resolver.srcLines = fullSrcLines;//im using the full src lines for this state over the input because the regular input is possibly purged and as such,some lines that will be accessed may be missing.It wont cause any state bugs because the purged and the full text are identical except that empty lines are put in place of the purged ones.
    overrideErrorListener();
    ParseHelper.parse(srcText);
    if (Resolver.terminate) return Result.error;

    await Resolver.flushLogs();//to capture syntax errors to the log
    await resolver.visit(ParseHelper.tree!);
    if (!Resolver.terminate) {
        Resolver.wasTerminated = false;
        return {aliases:resolver.aliases,predicates:resolver.predicates,records:resolver.records};
    }else {
        return Result.error;
    }
}
function updateStaticVariables(srcPath:string,srcLines:string[]):void {
    Resolver.terminate = false;
    Resolver.lastDocumentPath = srcPath;
    const srcKeysAsSet = new Set(srcLines.map((content,line)=>createKey(line,content)));
    const visitedSentences = convMapToRecord(Resolver.visitedSentences);
    for (const [key,visitedSentence] of Object.entries(visitedSentences)) {
        if (!srcKeysAsSet.has(visitedSentence.uniqueKey)) {
            Resolver.visitedSentences.delete(key);
        }
    }
}
//the srcPath variable is to tie the lifetime of some static variables to the current path rather than on each request
function clearStaticVariables(srcPath:string):void {//Note that its not all static variables that must be cleared or be cleared here.
    Resolver.terminate = false;//reset it for subsequent analyzing
    Resolver.srcLines.length = 0;
    Resolver.logs = null;
    Resolver.logFile = null;
    Resolver.includeDiagnostics = false;
    ParseHelper.tree = null;//to prevent accidentally reading an outadted src tree.
    DependencyManager.dependents = [];
    ConsoleErrorListener.instance.syntaxError = ():undefined =>undefined;
    if (srcPath !== Resolver.lastDocumentPath) {
        console.log('\nCleared visited sentences\n',srcPath,'visi',Resolver.lastDocumentPath);
        Resolver.visitedSentences.clear();//the reason why i tied its lifetime to path changes is because the purging process used in incremental analysis will allow semantically identical sentences from being caught if the previous identical sentences wont survive the purge
    }
}
function getOutputPathNoExt(srcFilePath:string,outputFolder?:string):string {
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
async function setUpLogs(outputFilePath:string):Promise<void> {
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
export async function analyzeDocument(srcText:string,srcPath:string):Promise<lspDiagnostics[]> {
    clearStaticVariables(srcPath);
    Resolver.includeDiagnostics = true;
    
    const unpurgedSrcText = Purger.purge(srcText,srcPath,Resolver.lspDiagnosticsCache,[]);
    console.log('🚀 => :1019 => analyzeDocument => unpurgedSrcText:', unpurgedSrcText);

    await generateJson(srcPath,unpurgedSrcText,srcText);//this populates the lsp analysis

    const fullDiagnostics:lspDiagnostics[] = [];
    for (const diagnostics of Resolver.lspDiagnosticsCache.values()) {//this must be done after resolving the purged text because its only then,that the cache will be filled with the latest data
        for (const diagnostic of diagnostics) {
            fullDiagnostics.push(diagnostic);
        }
    }
    console.log('cached Diagnostics: ',fullDiagnostics);
    console.log('visited sentences: ',Resolver.visitedSentences);
    return fullDiagnostics;
}



async function parseJson(json:Path):Promise<Result.error | object>  {
    try {
        const jsonString = await fs.readFile(json, 'utf8');
        return JSON.parse(jsonString);
    }catch(err) { 
        console.log(chalk.red('\nAn error occured when attempting to read the json file.\n'),err);
        return Result.error;
    };
}
async function loadDocFromJson(json:Path | Record<string,any>):Promise<Result> {
    const providedPath = typeof json === "string";
    const [jsonAsPath,jsonAsObject] = (providedPath)?[json,null]:[null,json];
    let fullData:FullData;
    
    if (providedPath) {
        const result = await parseJson(jsonAsPath!);
        if (result === Result.error) return Result.error;
        fullData = result as FullData;
    }else {
        fullData = jsonAsObject! as FullData;
    }
    const isValid = validator.Check(fullData);
    if (!isValid) {
        const errors = [...validator.Errors(fullData)].map(({ path, message }) => ({ path, message }));
        console.error(chalk.red('Validation error in the json file:'), errors);
        return Result.error;//to prevent corruption
    }
    console.info(lime('Successfully loaded the document onto the server'));
    serverDoc[0] = new Doc(fullData.records,fullData.predicates);
    return Result.success;
}
export async function importDocFromObject(json:Record<string,any>):Promise<Result> {
    return await loadDocFromJson(json);
}
export async function importDocFromSrc(filePath:string,outputFolder:string):Promise<Result> {
    const isSrcFile = filePath.endsWith(".fog");
    if (!isSrcFile) {
        console.error(chalk.red('This function must be called with a .fog src file.'));
        return Result.error;
    }
    const {result,jsonPath:jsonPathResult} = await resolveDocument(filePath,outputFolder);
    if (result === Result.error) return Result.error;
    const loadResult = await loadDocFromJson(jsonPathResult!);//we can assert this here because if the resolver result isnt an error,then the path is guaranteed to be valid
    return loadResult;
}
export async function importDocFromJson(filePath:string):Promise<Result> {
    const isJsonFile = filePath.endsWith(".json");
    if (!isJsonFile) {
        console.error(chalk.red('This function must be called with a .json file.'));
        return Result.error;
    }
    const loadResult = await loadDocFromJson(filePath);
    return loadResult;
}