import { brown, createKey, darkGreen, EndOfLine, lspDiagnostics } from "../utils/utils.js";
import chalk, { ChalkInstance } from "chalk";
import { orange } from "../utils/utils.js";
import { lspSeverity } from "../utils/utils.js";
import stripAnsi from "strip-ansi";

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
export enum ReportKind {
    Semantic="Semantic Error at",
    Syntax="Syntax Error at",
    Warning="Double check",
    Hint="Hint at"
}
export type InlineSrcText = string | string[] | EndOfLine;

export interface Report {
    kind:ReportKind,
    line:number,//this is 0-based
    lines?:number[]
    msg:string,
    srcText:InlineSrcText
}
export class Reporter {
    public static buildDiagnosticsFromReport(report:Report):void {
        if (Resolver.lspDiagnostics===null) return;//dont generate lsp analysis if not required
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
            Resolver.lspDiagnostics!.push(...diagnostics);
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
        
        const key = createKey(line,srcLine);
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
                    registerDiagnostics(createKey(targetLine,Resolver.srcLines[targetLine]));
                }
            }
        }
    }
    public static castReport(report:Report):void {
        Reporter.buildDiagnosticsFromReport(report);
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