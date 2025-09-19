export type BlockType = 'text' | 'image' | 'video' | 'audio' | 'reference';
export type BlockStatus = 'validated' | 'in_review' | 'error';

export interface ProofBlock extends Record<string, unknown> {
  id: string;
  type: BlockType;
  title: string;
  description?: string;
  status: BlockStatus;
  position: { x: number; y: number };
  content: {
    markdown?: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    reference?: { 
      author: string; 
      title: string; 
      year: string; 
      link?: string;
      doi?: string;
    };
  };
}

export interface EdgeLink {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface EditorState {
  startBlockId?: string;
  blocks: ProofBlock[];
  edges: EdgeLink[];
  selectedBlockId?: string;
  isDrawerOpen: boolean;
}