import {
    CompletionItem,
    createConnection,
    ProposedFeatures,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import {analyzeDocument, autoComplete,getHoverInfo} from "fog-js";
import { debounce } from 'throttle-debounce';
import { URI } from 'vscode-uri';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let analysisUpToDate:boolean = false;

function analyzeDoc(text:string,srcPath:string):void {
    analyzeDocument(text,srcPath).then(diagnostics=>{
        connection.sendDiagnostics({
            uri:srcPath,
            diagnostics:diagnostics
        });
        analysisUpToDate = true;
    });
}
const debouncedAnalysis = debounce(300,
    (text:string,srcPath:string) =>{
        analysisUpToDate = false;
        analyzeDoc(text,srcPath);
    },
    {atBegin:false}
);
function getLastWord(params: TextDocumentPositionParams):string | null {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) { return null; };
    const lineText = doc.getText({
        start: { line: params.position.line, character: 0 },
        end: params.position,
    });
    const match = lineText.match(/([#@!$%:\w]+)$/);
    const lastWord = match ? match[1] : '';
    return lastWord;
}
function getTokenAtPosition(doc: TextDocument, position: { line: number; character: number }): string | null {
    const cursorIndex = position.character;

    const lineText = doc.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line + 1, character: 0 },
    });
    const tokenChars = /[\w#!$%:<>]/;
    let start = cursorIndex;
    while (start > 0 && tokenChars.test(lineText[start - 1])) {
        start--;
    }

    let end = cursorIndex;
    while (end < lineText.length && tokenChars.test(lineText[end])) {
        end++;
    }

    const token = lineText.substring(start, end);
    return token.length > 0 ? token : null;
}


connection.onCompletion(async (params): Promise<CompletionItem[]> => {
    if (!analysisUpToDate) { return []; };
    const doc = documents.get(params.textDocument.uri);
    if (doc) {
        const lastWord = getLastWord(params);
        const completions:CompletionItem[] = await autoComplete(lastWord!);

        console.log('\nLast word: ',lastWord);
        console.log('🚀 => :47 => completions:', completions);
        return completions;
    }
    return [];
});
connection.onHover(async (params) => {
    if (!analysisUpToDate) { return null; };

    const doc = documents.get(params.textDocument.uri);
    if (!doc) { return null; };

    const token = getTokenAtPosition(doc, params.position)!;
    const hoverInfo = await getHoverInfo(params.position.line, token);

    console.log('🚀 => :86 => hoverInfo:', hoverInfo,);
    return hoverInfo;
});
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,//the language already handles incremental resolution and it requires to receive the text in full to do that.
            hoverProvider: true,
            completionProvider: {
              resolveProvider: false, // Optional: implement if you want to resolve additional info after select
              triggerCharacters: ['!','#'], //so ! is for name suggestion.# for alias suggestion.
            },
        },
    };
});
documents.onDidChangeContent(change => {
    const text = change.document.getText();
    const srcPath = URI.parse(change.document.uri).fsPath;
    debouncedAnalysis(text,srcPath);
    connection.console.log(`Document changed. Current length: ${text.length}`);
});

documents.listen(connection);
connection.listen();
