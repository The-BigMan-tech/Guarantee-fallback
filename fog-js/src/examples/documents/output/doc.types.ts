export type Members = "Susan" | "Matt" | "Philip" | "Mandy" | "Billy" | "John" | "Mark" | "Zane" | "Cole" | "Leo";
export type Predicates = "father" | "parent" | "female" | "friend" | "friends" | "male" | "males" | "mother";
export type KeyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";

export interface Info {
    Predicates: Predicates;
    Members: Members;
    KeyofRules: KeyofRules;
}
