export type Members = "Mandy" | "ada" | "Billy" | "John" | "Cole" | "Mark" | "Zane" | "Leo" | "type" | "Doc" | "good" | "Matt" | "Philip" | "a" | "b" | "safety" | "by" | "predicate" | "types" | "better" | "x" | "generating" | "l" | "h" | 2;
export type Predicates = "female" | "friend" | "friends" | "generic" | "girl" | "male" | "males" | "mother" | "parent" | "nice" | "passing" | "query" | "recommends" | "tall";
export type KeyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";

export interface Info {
    Predicates: Predicates;
    Members: Members;
    KeyofRules: KeyofRules;
}
