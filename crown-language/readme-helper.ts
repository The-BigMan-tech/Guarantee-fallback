import {createHighlighter} from "shiki"
import MarkdownIt from "markdown-it";
import fs from "fs/promises";
import grammar from "./syntaxes/crown.tmLanguage.json" with {type:'json'};
import crownTokenColors from "./syntaxes/crown-token-colors.json" with {type:"json"};
import chalk from "chalk";
import chokidar from 'chokidar';

const rawMd = './readme.raw.md';
// Initialize watcher.
const watcher = chokidar.watch(rawMd, {
    persistent: true,
    ignoreInitial: true,    // don't fire events for files already present on start
    awaitWriteFinish: true, // wait for writes to finish before emitting events
    ignored: /(^|[/\\])\../, // ignore dotfiles like .git etc.
    depth: 99               // watch subdirectories recursively (adjust depth as needed)
});

const highlighter = await createHighlighter({
    themes:[crownTokenColors], // Specify your desired theme
    langs: [
        {
            ...grammar,
            name:"crown",
        }
    ], // Specify languages you need
});

const md = new MarkdownIt({
    highlight:(code,lang)=>{
        if (lang === "crown") {
            try {
                const html = highlighter.codeToHtml(code,{lang:'crown',theme:'crown-theme'});
                return html;
            } catch {return ''}
        }
        return '<pre><code>' + md.utils.escapeHtml(code) + '</code></pre>';
    }
})

async function genMd() {
    const mdContent = await fs.readFile(rawMd,'utf-8');
    const result = md.render(mdContent);
    
    await fs.writeFile('./README.md',result);
    console.log(chalk.green('Successfully outputted the markdown','\n'));
}

watcher.on('change',async (filePath) => {
    console.log(chalk.yellow('Detected md change:'), filePath,'\n');
    await genMd();
    console.log(chalk.blue('Watching the raw md file...\n'));
});

console.log(chalk.blue('Watching the raw md file...\n'));
