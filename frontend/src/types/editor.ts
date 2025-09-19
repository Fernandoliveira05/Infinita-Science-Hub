export type BlockType = 'text' | 'image' | 'video' | 'audio' | 'reference';
export type BlockStatus = 'in_review' | 'approved' | 'rejected';

export interface ProofBlock {
  id: string;
  type: BlockType;
  title: string;            // obrigatório
  description?: string;     // opcional (do autor)
  status: BlockStatus;      // controlado pela auditoria (backend)
  aiSummary?: string;       // resumo gerado pela IA (somente leitura)
  position: { x: number; y: number };
  content: {
    // TEXT
    markdown?: string;

    // IMAGE / VIDEO / AUDIO
    imageUrl?: string;   // blob:ObjectURL (upload-only no front)
    videoUrl?: string;   // blob:ObjectURL (upload-only no front)
    audioUrl?: string;   // blob:ObjectURL (upload-only no front)

    // Metadados comuns p/ roteamento de IA (ex.: image/video)
    meta?: {
      isScreenCapture?: boolean; // true = captura de tela/print; false/undefined = câmera/outros
    };

    // REFERENCE
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
}

export interface EditorState {
  startBlockId?: string;
  blocks: ProofBlock[];
  edges: EdgeLink[];
  selectedBlockId?: string;
  isDrawerOpen: boolean;
}
