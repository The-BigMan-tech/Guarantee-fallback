import {Info } from "./documents/output/doc.types.js";
import { importDocFromObject, Result } from "fog-js";
import { implications } from "./rules.js";

const resolvedDoc = await import("./documents/output/doc.json",{with:{type:'json'}});
const doc = await importDocFromObject<Info>(resolvedDoc);
if (doc === Result.error) process.exit(0);

doc.useImplications(implications);

const answer1 = await doc.isItStated('membership','friends',["Billy","John"]);
doc.printAnswer(answer1);

const answer2 = await doc.isItImplied('fallback-exact','brothers',["Matt","Philip"]);//it will return an error if the query statement broke the rule's validation schema
if (answer2 !== Result.error) doc.printAnswer(answer2);


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
