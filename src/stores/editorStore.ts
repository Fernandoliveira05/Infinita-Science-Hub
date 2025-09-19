import { create } from 'zustand';
import { ProofBlock, EdgeLink, EditorState, BlockType, BlockStatus } from '@/types/editor';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/components/ui/toast-feedback';

interface EditorStore extends EditorState {
  // Actions
  addBlock: (type: BlockType, position?: { x: number; y: number }) => void;
  updateBlock: (id: string, updates: Partial<ProofBlock>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  setStartBlock: (id: string) => void;
  
  addEdge: (edge: EdgeLink) => void;
  removeEdge: (edgeId: string) => void;
  
  selectBlock: (id: string | undefined) => void;
  openDrawer: (blockId?: string) => void;
  closeDrawer: () => void;
  
  getOrderedBlocks: () => ProofBlock[];
  validateBlock: (block: ProofBlock) => boolean;
}

const defaultBlocks: ProofBlock[] = [
  {
    id: '1',
    type: 'text',
    title: 'Research Introduction',
    description: 'Overview of the research topic',
    status: 'validated',
    position: { x: 100, y: 100 },
    content: { markdown: '# Introduction\n\nThis research explores...' }
  },
  {
    id: '2',
    type: 'reference',
    title: 'Literature Review',
    description: 'Key references and prior work',
    status: 'in_review',
    position: { x: 350, y: 200 },
    content: {
      reference: {
        author: 'Smith, J.',
        title: 'Advanced Research Methods',
        year: '2023',
        link: 'https://example.com'
      }
    }
  },
  {
    id: '3',
    type: 'image',
    title: 'Experimental Setup',
    description: 'Visual representation of methodology',
    status: 'validated',
    position: { x: 600, y: 150 },
    content: { imageUrl: '' }
  }
];

const defaultEdges: EdgeLink[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' }
];

export const useEditorStore = create<EditorStore>((set, get) => ({
  startBlockId: '1',
  blocks: defaultBlocks,
  edges: defaultEdges,
  selectedBlockId: undefined,
  isDrawerOpen: false,

  addBlock: (type: BlockType, position = { x: 250, y: 250 }) => {
    const newBlock: ProofBlock = {
      id: Date.now().toString(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Block`,
      status: 'in_review',
      position,
      content: {}
    };

    set((state) => ({
      blocks: [...state.blocks, newBlock],
      selectedBlockId: newBlock.id
    }));

    // Auto-connect to selected block if exists
    const selectedBlock = get().selectedBlockId;
    if (selectedBlock && selectedBlock !== newBlock.id) {
      get().addEdge({
        id: `e${selectedBlock}-${newBlock.id}`,
        source: selectedBlock,
        target: newBlock.id
      });
    }

    showSuccessToast(`${type.charAt(0).toUpperCase() + type.slice(1)} block created`);
  },

  updateBlock: (id: string, updates: Partial<ProofBlock>) => {
    set((state) => ({
      blocks: state.blocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      )
    }));
  },

  deleteBlock: (id: string) => {
    const block = get().blocks.find(b => b.id === id);
    if (!block) return;

    set((state) => ({
      blocks: state.blocks.filter(b => b.id !== id),
      edges: state.edges.filter(e => e.source !== id && e.target !== id),
      selectedBlockId: state.selectedBlockId === id ? undefined : state.selectedBlockId,
      startBlockId: state.startBlockId === id ? undefined : state.startBlockId
    }));

    showSuccessToast(`${block.title} deleted`);
  },

  duplicateBlock: (id: string) => {
    const block = get().blocks.find(b => b.id === id);
    if (!block) return;

    const newBlock: ProofBlock = {
      ...block,
      id: Date.now().toString(),
      title: `${block.title} (Copy)`,
      position: { x: block.position.x + 50, y: block.position.y + 50 }
    };

    set((state) => ({
      blocks: [...state.blocks, newBlock]
    }));

    showSuccessToast(`${block.title} duplicated`);
  },

  setStartBlock: (id: string) => {
    set({ startBlockId: id });
    showSuccessToast('Start block updated');
  },

  addEdge: (edge: EdgeLink) => {
    // Check for cycles
    const wouldCreateCycle = (newEdge: EdgeLink): boolean => {
      const edges = [...get().edges, newEdge];
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (nodeId: string): boolean => {
        if (recursionStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        const outgoingEdges = edges.filter(e => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (hasCycle(edge.target)) return true;
        }

        recursionStack.delete(nodeId);
        return false;
      };

      return hasCycle(newEdge.source);
    };

    if (wouldCreateCycle(edge)) {
      showWarningToast('Cannot create connection: would create a cycle');
      return;
    }

    set((state) => ({
      edges: [...state.edges, edge]
    }));
  },

  removeEdge: (edgeId: string) => {
    set((state) => ({
      edges: state.edges.filter(e => e.id !== edgeId)
    }));
  },

  selectBlock: (id: string | undefined) => {
    set({ selectedBlockId: id });
  },

  openDrawer: (blockId?: string) => {
    set({
      isDrawerOpen: true,
      selectedBlockId: blockId || get().selectedBlockId
    });
  },

  closeDrawer: () => {
    set({ isDrawerOpen: false });
  },

  getOrderedBlocks: () => {
    const { startBlockId, blocks, edges } = get();
    if (!startBlockId) return blocks;

    const visited = new Set<string>();
    const orderedIds: string[] = [];

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      orderedIds.push(nodeId);

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      outgoingEdges.forEach(edge => traverse(edge.target));
    };

    traverse(startBlockId);

    // Add any unconnected blocks at the end
    blocks.forEach(block => {
      if (!visited.has(block.id)) {
        orderedIds.push(block.id);
      }
    });

    return orderedIds.map(id => blocks.find(b => b.id === id)).filter(Boolean) as ProofBlock[];
  },

  validateBlock: (block: ProofBlock) => {
    if (!block.title.trim()) {
      showErrorToast('Title is required');
      return false;
    }

    if (block.type === 'reference' && block.content.reference) {
      const ref = block.content.reference;
      if (!ref.author.trim() || !ref.title.trim() || !ref.year.trim()) {
        showErrorToast('Reference requires author, title, and year');
        return false;
      }
    }

    return true;
  }
}));