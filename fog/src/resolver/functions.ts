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
    Resolver.lspDiagnostics = null;
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
export async function analyzeDocument(srcText:string,srcPath:string):Promise<lspDiagnostics[]> {
    clearStaticVariables(srcPath);
    const {unpurgedSrcText,purgedEntries} = Purger.purge(srcText,srcPath,Resolver.lspDiagnosticsCache,[]);
    const cachedDiagnostics:lspDiagnostics[] = [];
    
    purgedEntries.forEach(entry=>cachedDiagnostics.push(...entry));
    Resolver.lspDiagnostics = [];
    
    console.log('🚀 => :1019 => analyzeDocument => unpurgedSrcText:', unpurgedSrcText);
    await generateJson(srcPath,unpurgedSrcText,srcText);//this populates the lsp analysis
    console.log('cache After: ',convMapToRecord(Resolver.lspDiagnosticsCache as Map<any,any>));
    
    const fullDiagnostics = Resolver.lspDiagnostics.concat(cachedDiagnostics);//this must be done after resolving the purged text because its only then,that its diagnostics will be filled
    console.log('visited sentences: ',Resolver.visitedSentences);
    return fullDiagnostics;
}