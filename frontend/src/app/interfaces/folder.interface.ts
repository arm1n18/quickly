export interface FolderSummary {
    title: string;
    slug: string;
    objects: number;
}

export interface FoldersSummary {
    folders: FolderSummary[]
}