import resolvedDoc from "./documents/output/doc.json" with {type:'json'};
import {info} from "./documents/output/doc.types.js";
import { checkBy, fallbackTo, importDocFromObject, Result } from "../main.js";
import { implications } from "./rules.js";


const doc = await importDocFromObject<info>(resolvedDoc);
if (!doc) process.exit(0);

doc.useImplications(implications);
const answer1 = await doc.isItImplied(fallbackTo.Membership,'brothers',["Matt","Philip"]);
doc.printAnswer(answer1);

const answer2 = await doc.isItImplied(fallbackTo.Membership,'allies',["Billy","Mark"]);
if (answer2 !== Result.error) {//this is to check for statement validation error i.e when the query violates the statement format that a rule expects
    doc.printAnswer(answer2);
}

// const combinations = await doc.pullCandidates(2, 'friends', [], [[]]);
// for await (const [A,B] of combinations) {
//     console.log(A,B);
// }
// const combinations2 = await doc.pullCandidates(2, 'friends', [], [[]]);
// for await (const [A,B] of combinations2) {
//     console.log('AA',A,B);
// }

// doc.useImplications(implications);//using the generated rules union will inform you when you have made changes to the rules structure which will be a reminder to regenerate the output
// const answer = await doc.isItImplied(fallbackTo.Membership,'allies',["Mark","Billy"]);
// if (answer !== Result.error) doc.printAnswer(answer);

// const wildCard = await doc.wildCard();
// console.log(await doc.findAllFacts(checkBy.Membership,'allies',["Cole",wildCard]));
