import {createHighlighter} from "shiki"
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
 
const code = `
    alias d.
`;

const html = highlighter.codeToHtml(code,{lang:'crown',theme:'crown-theme'});
console.log(html);