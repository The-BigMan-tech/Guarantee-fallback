export type Members = "Billy" | "John" | "Zane" | "Cole" | "Leo" | "Mark" | "Susan" | "Matt" | "Philip" | "Mandy" | 9 | "shoes";
export type Predicates = "allies" | "friends" | "bros" | "brothers" | "father" | "parent" | "female" | "friend" | "has" | "male" | "males" | "mother";
export type KeyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";

export interface Info {
    Predicates: Predicates;
    Members: Members;
    KeyofRules: KeyofRules;
}
