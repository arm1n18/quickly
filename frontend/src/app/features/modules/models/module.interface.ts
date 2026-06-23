import { UserInfo } from "../../user/models/user.interface";
import { Card } from "../../cards/models/cards.interface";

export interface Keyword {
  name: string;
  slug: string;
}

interface Author {
  name: string;
}

export interface Module {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  author: Author;
  isOwner: boolean;
  isSaved: boolean;
  keywords: Keyword[] | null;
  cards: Card[];
}

export interface UserModule {
  id: number;
  title: string;
  slug: string;
  objects: number;
  isOwner: boolean;
  isSaved: boolean;
  hasImages: boolean;
}

export interface ModuleSummary {
  id: number;
  title: string;
  slug: string;
  author: UserInfo;
  isOwner: boolean;
  isSaved: boolean;
  objects: number;
  media: {
    hasMedia: boolean;
    thumbnail?: string;
  }
}

export interface ModulesSummary {
  modules: ModuleSummary[];
}

export interface CreateModuleRequest {
  title: string;
  private: boolean;
  cards: Card[];
}