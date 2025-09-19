import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { ProofBlock, EdgeLink, EditorState, BlockType } from '@/types/editor';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '@/components/ui/toast-feedback';

interface EditorStore extends EditorState {
  addBlock: (type: BlockType, position?: { x: number; y: number }, parentId?: string) => string;
  updateBlock: (id: string, updates: Partial<Omit<ProofBlock, 'status' | 'aiSummary'>>) => void; // status/aiSummary não por aqui
  updateBlockPosition: (id: string, position: { x: number; y: number }) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  setStartBlock: (id: string | undefined) => void;

  addEdge: (edge: EdgeLink) => void;
  removeEdge: (edgeId: string) => void;

  selectBlock: (id: string | undefined) => void;
  openDrawer: (blockId?: string) => void;
  closeDrawer: () => void;

  clearAll: () => void;

  // Auditoria IA (mock front-only)
  requestAIAudit: (id: string) => void;

  getOrderedBlocks: () => ProofBlock[];
  validateBlock: (block: ProofBlock) => boolean;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Estado inicial ZERADO
  startBlockId: undefined,
  blocks: [],
  edges: [],
  selectedBlockId: undefined,
  isDrawerOpen: false,

  addBlock: (type, position = { x: 250, y: 250 }, parentId) => {
    const id = nanoid();
    const newBlock: ProofBlock = {
      id,
      type,
      title: '',            // força usuário a preencher
      description: '',
      status: 'in_review',  // sempre começa em revisão
      aiSummary: undefined, // IA ainda não descreveu
      position,
      content: {}
    };

    set((state) => ({
      blocks: [...state.blocks, newBlock],
      selectedBlockId: id
    }));

    // conectar ao pai se houver (sem duplicata/self-loop/ciclo)
    if (parentId && parentId !== id) {
      const edgeId = `e${parentId}-${id}`;
      const dup = get().edges.some(e => e.id === edgeId || (e.source === parentId && e.target === id));
      if (!dup) {
        const wouldCreateCycle = (newEdge: EdgeLink): boolean => {
          const edges = [...get().edges, newEdge];
          const visited = new Set<string>();
          const stack = new Set<string>();
          const dfs = (n: string): boolean => {
            if (stack.has(n)) return true;
            if (visited.has(n)) return false;
            visited.add(n); stack.add(n);
            for (const e of edges.filter(e => e.source === n)) if (dfs(e.target)) return true;
            stack.delete(n); return false;
          };
          return dfs(newEdge.source);
        };
        if (!wouldCreateCycle({ id: edgeId, source: parentId, target: id })) {
          set((s) => ({ edges: [...s.edges, { id: edgeId, source: parentId, target: id }] }));
        } else {
          showWarningToast('Connection would create a cycle');
        }
      }
    }

    if (!get().startBlockId) set({ startBlockId: id });
    showSuccessToast(`${type.charAt(0).toUpperCase() + type.slice(1)} block created`);
    return id;
  },

  // NÃO permite mudar status/aiSummary por aqui (apenas requestAIAudit)
  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map(b =>
        b.id === id ? { ...b, ...updates } : b
      )
    })),

  updateBlockPosition: (id, position) =>
    set((state) => ({
      blocks: state.blocks.map(b => (b.id === id ? { ...b, position } : b))
    })),

  deleteBlock: (id) => {
    const blk = get().blocks.find(b => b.id === id);
    if (!blk) return;
    set((state) => ({
      blocks: state.blocks.filter(b => b.id !== id),
      edges: state.edges.filter(e => e.source !== id && e.target !== id),
      selectedBlockId: state.selectedBlockId === id ? undefined : state.selectedBlockId,
      startBlockId: state.startBlockId === id ? undefined : state.startBlockId
    }));
    showSuccessToast(`${blk.title || 'Block'} deleted`);
  },

  duplicateBlock: (id) => {
    const blk = get().blocks.find(b => b.id === id);
    if (!blk) return;
    const newId = nanoid();
    const copy: ProofBlock = {
      ...blk,
      id: newId,
      title: blk.title ? `${blk.title} (Copy)` : 'Untitled (Copy)',
      status: 'in_review',
      aiSummary: undefined,
      position: { x: blk.position.x + 50, y: blk.position.y + 50 }
    };
    set((state) => ({ blocks: [...state.blocks, copy] }));
    showSuccessToast(`${blk.title || 'Block'} duplicated`);
  },

  setStartBlock: (id) => {
    set({ startBlockId: id });
    showSuccessToast('Start block updated');
  },

  addEdge: (edge) => {
    if (edge.source === edge.target) {
      showWarningToast('Cannot connect a block to itself');
      return;
    }
    const dup = get().edges.some(e => e.id === edge.id || (e.source === edge.source && e.target === edge.target));
    if (dup) return;

    const wouldCreateCycle = (newEdge: EdgeLink): boolean => {
      const edges = [...get().edges, newEdge];
      const visited = new Set<string>();
      const stack = new Set<string>();
      const dfs = (n: string): boolean => {
        if (stack.has(n)) return true;
        if (visited.has(n)) return false;
        visited.add(n); stack.add(n);
        for (const e of edges.filter(e => e.source === n)) if (dfs(e.target)) return true;
        stack.delete(n); return false;
      };
      return dfs(newEdge.source);
    };
    if (wouldCreateCycle(edge)) {
      showWarningToast('Cannot create connection: cycle detected');
      return;
    }

    set((state) => ({ edges: [...state.edges, edge] }));
  },

  removeEdge: (edgeId) =>
    set((state) => ({ edges: state.edges.filter(e => e.id !== edgeId) })),

  selectBlock: (id) => set({ selectedBlockId: id }),

  openDrawer: (blockId) =>
    set({
      isDrawerOpen: true,
      selectedBlockId: blockId ?? get().selectedBlockId
    }),

  closeDrawer: () => set({ isDrawerOpen: false }),

  clearAll: () =>
    set({
      startBlockId: undefined,
      blocks: [],
      edges: [],
      selectedBlockId: undefined,
      isDrawerOpen: false
    }),

  // Auditoria IA (demo): gera um resumo e define Approved/Rejected
  requestAIAudit: (id) => {
    const block = get().blocks.find(b => b.id === id);
    if (!block) return;
    if (!block.title || !block.title.trim()) {
      showErrorToast('Please set a Title before requesting AI audit.');
      return;
    }

    // Geração simples de resumo (mock)
    const base = `This block (“${block.title.trim()}”) summarizes a ${block.type} step: `;
    const detailByType: Record<string, string> = {
      text: 'it contains narrative or markdown content relevant to the research.',
      image: 'it includes an illustrative figure or setup photo supporting the methodology.',
      video: 'it provides a recorded demonstration or experiment capture.',
      audio: 'it provides a recorded explanation, interview, or sensor audio.',
      reference: 'it lists bibliographic sources that support this step.'
    };
    const aiSummary = base + (detailByType[block.type] || 'it contains supporting materials.');

    // “Lógica” mock para aprovar/reprovar (pura demo)
    const approved = block.title.trim().length >= 3;

    set((state) => ({
      blocks: state.blocks.map(b =>
        b.id === id ? { ...b, aiSummary, status: approved ? 'approved' : 'rejected' } : b
      )
    }));

    showInfoToast('AI audit completed (demo).');
  },

  getOrderedBlocks: () => {
    const { startBlockId, blocks, edges } = get();
    if (!startBlockId) return blocks;

    const visited = new Set<string>();
    const ordered: string[] = [];

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      ordered.push(nodeId);
      edges.filter(e => e.source === nodeId).forEach(e => traverse(e.target));
    };

    traverse(startBlockId);
    blocks.forEach(b => { if (!visited.has(b.id)) ordered.push(b.id); });

    return ordered
      .map(id => blocks.find(b => b.id === id))
      .filter(Boolean) as ProofBlock[];
  },

  validateBlock: (block) => {
    if (!block.title || !block.title.trim()) {
      showErrorToast('Title is required');
      return false;
    }
    if (block.type === 'reference' && block.content.reference) {
      const ref = block.content.reference;
      if (!ref.author?.trim() || !ref.title?.trim() || !ref.year?.trim()) {
        showErrorToast('Reference requires author, title, and year');
        return false;
      }
    }
    return true;
  }
}));
