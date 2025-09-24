import {createHighlighter} from "shiki"
import MarkdownIt from "markdown-it";
import fs from "fs/promises";
import grammar from "./syntaxes/crown.tmLanguage.json" with {type:'json'};
import crownTokenColors from "./syntaxes/crown-token-colors.json" with {type:"json"};

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
const mdContent = await fs.readFile('./readme.raw.md','utf-8');
const result = md.render(mdContent);
await fs.writeFile('./README.md',result);