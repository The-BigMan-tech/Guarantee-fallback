import {v4 as uniqueID} from "uuid";

export const groupIDs = {//i intended to define this in the entity manager but i couldnt do so without running into cyclic imports
    player:uniqueID(),
    enemy:uniqueID(),
    npc:uniqueID()
}