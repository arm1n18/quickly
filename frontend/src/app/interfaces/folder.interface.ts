import { UserModule } from "./module.interface";
import { UserInfo } from "./user.interface";

export interface FolderSummary {
    title: string;
    slug: string;
    objects: number;
    isOwner: boolean;
}

export interface FoldersSummary {
    folders: FolderSummary[]
}

export interface Folder {
    title: string;
    slug: string;
    author: UserInfo;
    isOwner: boolean;
    objects: number;
    modules: UserModule[];
}