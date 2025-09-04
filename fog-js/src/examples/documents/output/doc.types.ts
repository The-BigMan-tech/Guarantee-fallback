export type members = "Billy" | "John" | "Zane" | "Cole" | "Leo" | "Mark" | "Susan" | "Matt" | "Philip" | "Mandy" | 9 | "shoes";
export type predicates = "allies" | "friends" | "bros" | "brothers" | "father" | "parent" | "female" | "friend" | "has" | "male" | "males" | "mother";
export type keyofRules = "directFriends" | "indirectFriends" | "friends" | "siblings" | "brothers";
export interface info {
    predicates:predicates,
    members:members,
    keyofRules:keyofRules
};
