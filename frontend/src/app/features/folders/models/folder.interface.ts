import { ModuleSummary } from "../../modules/models/module.interface";
import { UserInfo } from "../../user/models/user.interface";


export interface FolderSummary {
    id: number;
    title: string;
    slug: string;
    objects: number;
    isOwner: boolean;
}

export interface FoldersSummary {
    folders: FolderSummary[]
}

export interface Folder {
    id: number;
    title: string;
    slug: string;
    author: UserInfo;
    isOwner: boolean;
    objects: number;
    modules: ModuleSummary[];
}