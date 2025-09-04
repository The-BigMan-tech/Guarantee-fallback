import {info, members} from "./documents/output/doc.types.js";
import { Box, checkBy, fallbackTo, importDocFromObject, Result } from "../main.js";
import { implications } from "./rules.js";

const resolvedDoc = await import("./documents/output/doc.json",{with:{type:'json'}});
const doc = await importDocFromObject<info>(resolvedDoc);
if (!doc) process.exit(0);

doc.useImplications(implications);

const answer2 = await doc.isItImplied(fallbackTo.Membership,'allies',["Billy","Susan"]);
if (answer2 !== Result.error) {//this is to check for statement validation error i.e when the query violates the statement format that a rule expects
    doc.printAnswer(answer2);
}

// const answer2 = await doc.isItStated(fallbackTo.Membership,'allies',["Billy","John"]);
// doc.printAnswer(answer2);


// const answer3 = await doc.isItStated(fallbackTo.Membership,'allies',["Billy","John"]);
// doc.printAnswer(answer3);

// const input:members[] = ['Billy'];
// const visited:Box<string[]> =  [[]];

// const x = await doc.pullCandidates(2, 'friends',input,visited);
// console.log('🚀 => :28 => x:', x);

// const y = await doc.pullCandidates(2, 'friends',input,visited);
// console.log('🚀 => :28 => y:', y);

// const combinations2 = await doc.pullCandidates(2, 'friends', [], [[]]);
// for await (const [A,B] of combinations2) {
//     console.log('AA',A,B);
// }

// doc.useImplications(implications);//using the generated rules union will inform you when you have made changes to the rules structure which will be a reminder to regenerate the output
// const answer = await doc.isItImplied(fallbackTo.Membership,'allies',["Mark","Billy"]);
// if (answer !== Result.error) doc.printAnswer(answer);

// const wildCard = await doc.wildCard();
// console.log(await doc.findAllFacts(checkBy.Membership,'allies',["Cole",wildCard]));
