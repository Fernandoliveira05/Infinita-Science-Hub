import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { RepositoryMeta, Collaborator, CollaboratorRole, RepoVisibility } from '@/types/repository';
import { showSuccessToast, showErrorToast } from '@/components/ui/toast-feedback';

// Boas práticas: separar o estado das ações na tipagem
interface RepoState {
  repo: RepositoryMeta | null; // Pode ser nulo quando nada está carregado
}

interface RepoActions {
  setRepo: (repoData: RepositoryMeta) => void;
  setName: (name:string) => void;
  setDescription: (desc: string) => void;
  toggleVisibility: () => void;
  toggleStar: () => void;
  addCollaborator: (name: string, role: CollaboratorRole) => void;
  removeCollaborator: (id: string) => void;
  updateCollaboratorRole: (id: string, role: CollaboratorRole) => void;
  clearRepo: () => void; // --> CORREÇÃO 1: Adicionada à interface
}

// Boas práticas: definir o estado inicial fora da store
const initialState: RepoState = {
  repo: {
    id: nanoid(), // Gera um ID para um repositório "em rascunho"
    name: '',
    description: '',
    visibility: 'public',
    stars: 0,
    isStarredByMe: false,
    collaborators: [],
  },
};

export const useRepoStore = create<RepoState & RepoActions>((set, get) => ({
  ...initialState,

  // --> CORREÇÃO 2: Adicionada a função para carregar um repo existente
  setRepo: (repoData) => set({ repo: repoData }),
  
  // --> CORREÇÃO 3: Adicionada a função para limpar/resetar a store
  clearRepo: () => set({ ...initialState, repo: { ...initialState.repo, id: nanoid() } }), // Gera um novo ID para o próximo rascunho

  setName: (name) =>
    set((state) => (state.repo ? { repo: { ...state.repo, name } } : {})),

  setDescription: (description) =>
    set((state) => (state.repo ? { repo: { ...state.repo, description } } : {})),

  toggleVisibility: () =>
    set((state) => {
      if (!state.repo) return {};
      const visibility: RepoVisibility = state.repo.visibility === 'public' ? 'private' : 'public';
      showSuccessToast(`Repository visibility set to ${visibility}`);
      return { repo: { ...state.repo, visibility } };
    }),

  toggleStar: () =>
    set((state) => {
      if (!state.repo) return {};
      const isStarredByMe = !state.repo.isStarredByMe;
      const stars = state.repo.stars + (isStarredByMe ? 1 : -1);
      return { repo: { ...state.repo, isStarredByMe, stars: Math.max(0, stars) } };
    }),

  addCollaborator: (name, role) => {
    if (!name.trim()) {
      showErrorToast('Collaborator name is required');
      return;
    }
    const newCollaborator: Collaborator = {
      id: nanoid(),
      name: name.trim(),
      role,
    };
    set((state) => {
      if (!state.repo) return {};
      return {
        repo: { ...state.repo, collaborators: [...state.repo.collaborators, newCollaborator] },
      };
    });
    showSuccessToast(`Added ${name} as ${role}`);
  },

  removeCollaborator: (id) =>
    set((state) => {
      if (!state.repo) return {};
      const target = state.repo.collaborators.find((c) => c.id === id);
      if (target) showSuccessToast(`Removed ${target.name}`);
      return {
        repo: { ...state.repo, collaborators: state.repo.collaborators.filter((c) => c.id !== id) },
      };
    }),

  updateCollaboratorRole: (id, role) =>
    set((state) => {
      if (!state.repo) return {};
      return {
        repo: {
          ...state.repo,
          collaborators: state.repo.collaborators.map((c) => (c.id === id ? { ...c, role } : c)),
        },
      };
    }),
}));