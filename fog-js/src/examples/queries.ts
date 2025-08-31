import resolvedDoc from "./documents/output/doc.json" with {type:'json'};
import { predicates as P,keyofRules as R,members as M} from "./documents/output/doc.types.js";
import { rules } from "./rules.js";
import { checkBy, fallbackTo, importDocFromObject, Tuple } from "../main.js";

//!Resolver static variables arent saved in the json so it has to be resolved whenver the srever starts to load it into memory to fix it.Try to save them into the json file as well or at least a separate json

const doc = await importDocFromObject<P,R,M>(resolvedDoc);
if (!doc) process.exit(0);

console.log('Aliases: ',await doc.predicates());
doc.useRules(rules);//using the generated rules union will inform you when you have made changes to the rules structure which will be a reminder to regenerate the output
const answer = await doc.isItImplied('allies',["Billy","John"]);
doc.printAnswer(answer);

const wildCard = await doc.wildCard();
console.log(await doc.findAllFacts('allies',["Cole",wildCard],checkBy.Membership));

//Do not use this in recursive functions.its meant to be used procedurally.directly use the generateCandidates method for recursive methods and provide the input and checked combinations to it so as to prevent cycles.
const runWithCandidates = async <N extends number>(predicate:P,num:N,func:(...args:Tuple<M,N>)=>Promise<any>):Promise<void> =>{
    const {combinations} = await doc.genCandidates(num,predicate,[],[]);//i passed empty arrays as the combinations because this is not done recurrisvely
    console.log('🚀 => :22 => runWithCandidates => combinations:', combinations);
    for (const combination of combinations) {
        await func(...combination);
    }
};
await runWithCandidates("female",3,async (A)=>{
    if (await doc.isItStated('parent',['Susan',A],checkBy.ExactMatch)) {
        console.log(A);
    }
    return;
});