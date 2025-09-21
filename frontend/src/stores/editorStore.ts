// src/stores/editorStore.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { ProofBlock, EdgeLink, EditorState, BlockType } from '@/types/editor';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '@/components/ui/toast-feedback';

interface EditorStore extends EditorState {
  /** Cria bloco. Se vier um bloco do backend em `initial`, o id do backend é preservado */
  addBlock: (
    type: BlockType,
    position?: { x: number; y: number },
    parentId?: string,
    initial?: Partial<ProofBlock>
  ) => ProofBlock;

  /** Atualiza campos do bloco (conteúdo, título etc). */
  updateBlock: (id: string, updates: Partial<Omit<ProofBlock, 'status' | 'aiSummary'>>) => void;

  /** Atualiza posição do bloco (apenas no estado, não envia para backend). */
  updateBlockPosition: (id: string, position: { x: number; y: number }) => void;

  /** Remove bloco e arestas relacionadas. */
  deleteBlock: (id: string) => void;

  /** Duplica bloco localmente (novo id local). */
  duplicateBlock: (id: string) => void;

  /** Marca qual é o bloco inicial (para ordenação). */
  setStartBlock: (id: string | undefined) => void;

  /** Liga dois blocos (sem ciclos). */
  addEdge: (edge: EdgeLink) => void;

  /** Remove uma aresta. */
  removeEdge: (edgeId: string) => void;

  /** Seleciona um bloco. */
  selectBlock: (id: string | undefined) => void;

  /** Abre o Drawer do bloco selecionado (ou de um específico). */
  openDrawer: (blockId?: string) => void;

  /** Fecha Drawer. */
  closeDrawer: () => void;

  /** Limpa tudo (estado do editor). */
  clearAll: () => void;

  /** Mock de auditoria por IA (front-only). */
  requestAIAudit: (id: string) => void;

  /** Retorna blocos ordenados a partir do startBlock (fallback: todos) */
  getOrderedBlocks: () => ProofBlock[];

  /** Validação básica do bloco antes de salvar. */
  validateBlock: (block: ProofBlock) => boolean;

  /** Troca um id local por um id real do backend (e atualiza edges/seleção). */
  replaceBlockId: (oldId: string, newBlock: ProofBlock) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Estado inicial
  startBlockId: undefined,
  blocks: [],
  edges: [],
  selectedBlockId: undefined,
  isDrawerOpen: false,

  /**
   * Cria bloco localmente.
   * - Se `initial?.id` existir (hidratação do backend), preserva esse id.
   * - Caso contrário, gera um nanoid local.
   */
  addBlock: (type, position = { x: 250, y: 250 }, parentId, initial) => {
    const id = initial?.id ?? nanoid();

    const newBlock: ProofBlock = {
      id,
      type,
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      status: (initial?.status as ProofBlock['status']) ?? 'in_review',
      aiSummary: initial?.aiSummary ?? undefined,
      position,
      content: initial?.content ?? {},
    };

    set((state) => ({
      blocks: [...state.blocks, newBlock],
      selectedBlockId: id,
    }));

    // Conectar ao pai (sem duplicata/self-loop/ciclo)
    if (parentId && parentId !== id) {
      const edgeId = `e${parentId}-${id}`;
      const dup = get().edges.some(
        (e) => e.id === edgeId || (e.source === parentId && e.target === id)
      );
      if (!dup) {
        const wouldCreateCycle = (newEdge: EdgeLink): boolean => {
          const edges = [...get().edges, newEdge];
          const visited = new Set<string>();
          const stack = new Set<string>();
          const dfs = (n: string): boolean => {
            if (stack.has(n)) return true;
            if (visited.has(n)) return false;
            visited.add(n);
            stack.add(n);
            for (const e of edges.filter((e) => e.source === n)) {
              if (dfs(e.target)) return true;
            }
            stack.delete(n);
            return false;
          };
          return dfs(newEdge.source);
        };
        if (!wouldCreateCycle({ id: edgeId, source: parentId, target: id })) {
          set((s) => ({
            edges: [...s.edges, { id: edgeId, source: parentId, target: id }],
          }));
        } else {
          showWarningToast('Connection would create a cycle');
        }
      }
    }

    if (!get().startBlockId) set({ startBlockId: id });

    // Só mostra “created” quando não é hidratação
    if (!initial?.id) {
      showSuccessToast(`${type.charAt(0).toUpperCase() + type.slice(1)} block created`);
    }

    return newBlock;
  },

  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  updateBlockPosition: (id, position) =>
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, position } : b)),
    })),

  deleteBlock: (id) => {
    const blk = get().blocks.find((b) => b.id === id);
    if (!blk) return;
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedBlockId: state.selectedBlockId === id ? undefined : state.selectedBlockId,
      startBlockId: state.startBlockId === id ? undefined : state.startBlockId,
    }));
    showSuccessToast(`${blk.title || 'Block'} deleted`);
  },

  duplicateBlock: (id) => {
    const blk = get().blocks.find((b) => b.id === id);
    if (!blk) return;
    const newId = nanoid();
    const copy: ProofBlock = {
      ...blk,
      id: newId,
      title: blk.title ? `${blk.title} (Copy)` : 'Untitled (Copy)',
      status: 'in_review',
      aiSummary: undefined,
      position: { x: blk.position.x + 50, y: blk.position.y + 50 },
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
    const dup = get().edges.some(
      (e) => e.id === edge.id || (e.source === edge.source && e.target === edge.target)
    );
    if (dup) return;

    const wouldCreateCycle = (newEdge: EdgeLink): boolean => {
      const edges = [...get().edges, newEdge];
      const visited = new Set<string>();
      const stack = new Set<string>();
      const dfs = (n: string): boolean => {
        if (stack.has(n)) return true;
        if (visited.has(n)) return false;
        visited.add(n);
        stack.add(n);
        for (const e of edges.filter((e) => e.source === n)) {
          if (dfs(e.target)) return true;
        }
        stack.delete(n);
        return false;
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
    set((state) => ({ edges: state.edges.filter((e) => e.id !== edgeId) })),

  selectBlock: (id) => set({ selectedBlockId: id }),

  openDrawer: (blockId) =>
    set({
      isDrawerOpen: true,
      selectedBlockId: blockId ?? get().selectedBlockId,
    }),

  closeDrawer: () => set({ isDrawerOpen: false }),

  clearAll: () =>
    set({
      startBlockId: undefined,
      blocks: [],
      edges: [],
      selectedBlockId: undefined,
      isDrawerOpen: false,
    }),

  requestAIAudit: (id) => {
    const block = get().blocks.find((b) => b.id === id);
    if (!block) return;
    if (!block.title || !block.title.trim()) {
      showErrorToast('Please set a Title before requesting AI audit.');
      return;
    }

    const base = `This block (“${block.title.trim()}”) summarizes a ${block.type} step: `;
    const detailByType: Record<string, string> = {
      text: 'it contains narrative or markdown content relevant to the research.',
      image: 'it includes an illustrative figure or setup photo supporting the methodology.',
      video: 'it provides a recorded demonstration or experiment capture.',
      audio: 'it provides a recorded explanation, interview, or sensor audio.',
      reference: 'it lists bibliographic sources that support this step.',
    };
    const aiSummary =
      base + (detailByType[block.type] || 'it contains supporting materials.');

    const approved = block.title.trim().length >= 3;

    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, aiSummary, status: approved ? 'approved' : 'rejected' } : b
      ),
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
      edges
        .filter((e) => e.source === nodeId)
        .forEach((e) => traverse(e.target));
    };

    traverse(startBlockId);
    blocks.forEach((b) => {
      if (!visited.has(b.id)) ordered.push(b.id);
    });

    return ordered
      .map((id) => blocks.find((b) => b.id === id))
      .filter(Boolean) as ProofBlock[];
  },

  validateBlock: (block) => {
    if (!block.title || !block.title.trim()) {
      showErrorToast('Title is required');
      return false;
    }
    if (block.type === 'reference' && (block.content as any)?.reference) {
      const ref = (block.content as any).reference;
      if (!ref.author?.trim() || !ref.title?.trim() || !ref.year?.trim()) {
        showErrorToast('Reference requires author, title, and year');
        return false;
      }
    }
    return true;
  },

  /**
   * Troca um id local (ex.: nanoid) pelo id real do backend (UUID),
   * atualizando edges e seleção.
   */
  replaceBlockId: (oldId, newBlock) =>
    set((s) => {
      const blocks = s.blocks.map((b) => (b.id === oldId ? { ...newBlock } : b));

      const edges = s.edges.map((e) => {
        const newSource = e.source === oldId ? newBlock.id : e.source;
        const newTarget = e.target === oldId ? newBlock.id : e.target;
        const newId =
          e.id === `e${e.source}-${e.target}` ? `e${newSource}-${newTarget}` : e.id;
        return { ...e, source: newSource, target: newTarget, id: newId };
      });

      const selectedBlockId = s.selectedBlockId === oldId ? newBlock.id : s.selectedBlockId;
      const startBlockId = s.startBlockId === oldId ? newBlock.id : s.startBlockId;

      return { blocks, edges, selectedBlockId, startBlockId };
    }),
}));
