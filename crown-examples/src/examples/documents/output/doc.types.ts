export type Members = "Mandy" | "ada" | "Billy" | "John" | "Cole" | "Mark" | "Zane" | "Leo" | "good" | "Matt" | "Philip" | "a" | "b" | "l" | 2 | "h";
export type Predicates = "female" | "friend" | "friends" | "girl" | "male" | "males" | "mother" | "parent" | "nice" | "short" | "tall";
export type KeyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";

export interface Info {
    Predicates: Predicates;
    Members: Members;
    KeyofRules: KeyofRules;
}
