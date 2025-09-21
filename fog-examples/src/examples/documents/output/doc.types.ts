export type Members = "Mandy" | "ada" | "Billy" | "John" | "Mark" | "Zane" | "Cole" | "Leo" | "girl" | "a" | "b" | "c" | "d" | "Matt" | "Philip" | "l" | "h" | 2;
export type Predicates = "female" | "friend" | "friends" | "good" | "male" | "males" | "mother" | "parent" | "nice" | "tall";
export type KeyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";

export interface Info {
    Predicates: Predicates;
    Members: Members;
    KeyofRules: KeyofRules;
}
