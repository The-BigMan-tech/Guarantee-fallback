
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface IQuery {
    user(id: string): Nullable<User> | Promise<Nullable<User>>;
    allUsers(): Nullable<Nullable<User>[]> | Promise<Nullable<Nullable<User>[]>>;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

type Nullable<T> = T | null;
