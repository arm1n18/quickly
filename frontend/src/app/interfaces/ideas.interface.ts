export interface Ideas {
    date: string,
    ideas: Idea[]
}

export interface Idea {
    id: number,
    title: string,
    description: string,
    votes: number,
    voted: boolean,
    date: string;
}

export interface Task {
    id: number,
    title: string,
    description: string,
    date: string;
}

interface RoadmapItem {
    date: string,
    tasks: Task[]
}

export interface Roadmap {
    inProgress: Task[],
    inFuture: Task[],
    completed: RoadmapItem[]
}