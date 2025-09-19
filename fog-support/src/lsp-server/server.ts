import {
    CompletionItem,
    createConnection,
    ProposedFeatures,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {analyzeDocument, autoComplete} from "fog-js";
import { debounce } from 'throttle-debounce';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let analysisUpToDate = false;

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
connection.onCompletion(async (params: TextDocumentPositionParams): Promise<CompletionItem[]> => {
    if (!analysisUpToDate) { return []; };
    const doc = documents.get(params.textDocument.uri);
    if (doc) {
        const lineText = doc.getText({
            start: { line: params.position.line, character: 0 },
            end: params.position,
        });
        const match = lineText.match(/([#@!$%\w-]+)$/);
        const lastWord = match ? match[1] : '';
        console.log('\nLast word: ',lastWord);

        const completions:CompletionItem[] = await autoComplete(lastWord);
        console.log('🚀 => :47 => completions:', completions);
        return completions;
    }
    return [];
});
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
              resolveProvider: false, // Optional: implement if you want to resolve additional info after select
              triggerCharacters: ['!','#'], //so ! is for name suggestion.# for alias suggestion.
            },
        },
    };
});
documents.onDidChangeContent(change => {
    const text = change.document.getText();
    const srcPath = change.document.uri;
    debouncedAnalysis(text,srcPath);
    connection.console.log(`Document changed. Current length: ${text.length}`);
});

documents.listen(connection);
connection.listen();
