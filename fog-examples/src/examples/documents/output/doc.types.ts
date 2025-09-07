export type Members = "ada" | "Susan" | "Matt" | "Philip" | "Mandy" | "Billy" | "John" | "Mark" | "Zane" | "Cole" | "Leo" | "girl";
export type Predicates = "big" | "father" | "parent" | "female" | "friend" | "friends" | "good" | "large" | "male" | "males" | "mother";
export type KeyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";

export interface Info {
    Predicates: Predicates;
    Members: Members;
    KeyofRules: KeyofRules;
}
