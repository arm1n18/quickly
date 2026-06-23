export type MediaType = 'audio' | 'video' | 'image'

interface Media {
  type: MediaType;
  content: string;
}

export interface ContentBlock {
  text: string;
  media?: Media;
}

export interface Card {
  id: number;
  title: ContentBlock;
  description: ContentBlock;
}