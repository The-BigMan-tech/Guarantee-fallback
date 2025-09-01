import resolvedDoc from "./documents/output/doc.json" with {type:'json'};
import {info} from "./documents/output/doc.types.js";
import { implications } from "./rules.js";
import { checkBy, fallbackTo, importDocFromObject, Result } from "../main.js";


const doc = await importDocFromObject<info>(resolvedDoc);
if (!doc) process.exit(0);

doc.useImplications(implications);//using the generated rules union will inform you when you have made changes to the rules structure which will be a reminder to regenerate the output
const answer = await doc.isItImplied(fallbackTo.Membership,'allies',["John","Billy"]);
if (answer !== Result.error) doc.printAnswer(answer);

const wildCard = await doc.wildCard();
console.log(await doc.findAllFacts(checkBy.Membership,'allies',["Cole",wildCard]));
