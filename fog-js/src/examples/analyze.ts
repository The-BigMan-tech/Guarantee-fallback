import { analyzeDocument, lspAnalysis } from "../main.js";
import stringify from "safe-stable-stringify";

const analysis:lspAnalysis = await analyzeDocument(`
    alias friends.
    alias friend = *friends.

    alias mother = *parent.
    alias father = *parent.

    alias male.
    alias males = *male.

    :Billy and :John are #friends.
    :John,:Mark and :Zane are #friends.
    :Zane is the #friend of :Cole.
    :Leo is :Cole's #friend.

    :Matt and :Philip are #males.
    :Mandy is a *female.

    :Susan is the #mother of :Matt.
    :Susan is the #mother of :Philip.
    :Susan is the #mother of :Mandy.

`);
console.log("Analysis: ",stringify(analysis,null,2));