import { parser } from "./parser.js";  // your generated parser

const inputText = `'ada' and 'peter' are *friends.`;  // example input
const tree = parser.parse(inputText);