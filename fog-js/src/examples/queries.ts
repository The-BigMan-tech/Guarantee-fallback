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

//Do not use this in recursive functions.its meant to be used procedurally.directly use the generateCandidates method for recursive methods and provide the input and checked combinations to it so as to prevent cycles.
const runWithCandidates = async(predicate:P,func:(...args:M[])=>Promise<any>):Promise<void> =>{
    const {combinations} = await doc.genCandidates(func.length,predicate,[],[]);
    for (const combination of combinations) {
        await func(...combination);
    }
};
await runWithCandidates("friends",async (A,B)=>{
    const y = await doc.isItImplied('allies',[A,B]);
    if (y && await doc.isItStated("male",[B],checkBy.Membership)) {
        console.log(A);
    }
    return;
});