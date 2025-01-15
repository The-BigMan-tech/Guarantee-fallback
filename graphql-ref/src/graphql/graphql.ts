
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface Sample {
    message: string;
    data: User;
}

export interface Apple {
    message: string;
    data: User;
    energy: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface IQuery {
    user(id: string): Nullable<User> | Promise<Nullable<User>>;
    allUsers(): Nullable<Nullable<User>[]> | Promise<Nullable<Nullable<User>[]>>;
}

export interface IMutation {
    createUser(name: string, email: string, energy?: Nullable<string>): Nullable<CreateUserResponse> | Promise<Nullable<CreateUserResponse>>;
}

export type CreateUserResponse = Sample | Apple;
type Nullable<T> = T | null;
