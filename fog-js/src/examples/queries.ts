import resolvedDoc from "./documents/output/doc.json" with {type:'json'};
import { predicates as P,keyofRules as R,members as M} from "./documents/output/doc.types.js";
import { rules } from "./rules.js";
import { checkBy, fallbackTo, importDocFromObject } from "../main.js";

//!Resolver static variables arent saved in the json so it has to be resolved whenver the srever starts to load it into memory to fix it.Try to save them into the json file as well or at least a separate json

const doc = await importDocFromObject<P,R,M>(resolvedDoc);
if (!doc) process.exit(0);


doc.useRules(rules);//using the generated rules union will inform you when you have made changes to the rules structure which will be a reminder to regenerate the output
const answer = await doc.isItImplied('allies',["Billy","John"],fallbackTo.Membership);
doc.printAnswer(answer);

const wildCard = await doc.wildCard();
console.log(await doc.findAllFacts('allies',["Cole",wildCard],checkBy.Membership));
