import { Doc } from "fog-js";
import { rules } from "./rules";

export async function someQuery(doc:Doc) {//This gets all the friends of ada who are also the brother of ben.It selects the smallest record from the ones that are relevant to the context to reduce the number of enumerations required to solve the query to the minimum requirement
    const smallestRecord = await doc.selectSmallestRecord(['male','friends']);
    const {candidates} = await doc.genCandidates<string,1>(1,smallestRecord,[],[]);
    for (const [A] of candidates) {
        if (await rules.areFriends(doc,['ada',A]) && await rules.areBrothers(doc,[A,'ben'])) {
            console.log('The friend of ada who is also the brother of ben:',A);
        }
    }
}