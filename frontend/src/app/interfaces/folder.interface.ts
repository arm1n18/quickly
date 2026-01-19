import { UserModule } from "./quizCard.interface";
import { UserInfo } from "./user.interface";

export interface FolderSummary {
    title: string;
    slug: string;
    objects: number;
}

export interface FoldersSummary {
    folders: FolderSummary[]
}

export interface Folder {
    title: string;
    slug: string;
    author: UserInfo;
    objects: number;
    modules: UserModule[];
}