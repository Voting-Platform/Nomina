import { UserRole } from "./enums";

export interface googleAuthenticatedUser{
    id: string;
    name: string;
    email: string;
    image: string;
}

export interface User extends googleAuthenticatedUser {
    _id: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}