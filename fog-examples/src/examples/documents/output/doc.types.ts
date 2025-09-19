export type Members = "Mandy" | "ada" | "Billy" | "John" | "Mark" | "Zane" | "Cole" | "Leo" | "girl" | "a" | "b" | "c" | "d" | "Matt" | "Philip";
export type Predicates = "female" | "friend" | "friends" | "good" | "hh" | "male" | "males" | "mother" | "parent" | "tall";
export type KeyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";

export interface Info {
    Predicates: Predicates;
    Members: Members;
    KeyofRules: KeyofRules;
}
