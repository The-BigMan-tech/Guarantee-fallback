
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface CreateUserResponse {
    message: string;
    data: User;
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
    createUser(name: string, email: string): Nullable<CreateUserResponse> | Promise<Nullable<CreateUserResponse>>;
}

type Nullable<T> = T | null;
