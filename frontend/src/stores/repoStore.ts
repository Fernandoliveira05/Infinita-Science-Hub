import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { RepositoryMeta, Collaborator, CollaboratorRole, RepoVisibility } from '@/types/repository';
import { showSuccessToast, showErrorToast } from '@/components/ui/toast-feedback';

interface RepoState {
  repo: RepositoryMeta;
  setName: (name: string) => void;
  setDescription: (desc: string) => void;
  toggleVisibility: () => void;
  toggleStar: () => void;
  addCollaborator: (name: string, role: CollaboratorRole) => void;
  removeCollaborator: (id: string) => void;
  updateCollaboratorRole: (id: string, role: CollaboratorRole) => void;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repo: {
    id: nanoid(),
    name: '',
    description: '',
    visibility: 'public',
    stars: 0,
    isStarredByMe: false,
    collaborators: [],
  },

  setName: (name) =>
    set((s) => ({ repo: { ...s.repo, name } })),

  setDescription: (description) =>
    set((s) => ({ repo: { ...s.repo, description } })),

  toggleVisibility: () =>
    set((s) => {
      const visibility: RepoVisibility = s.repo.visibility === 'public' ? 'private' : 'public';
      showSuccessToast(`Repository visibility set to ${visibility}`);
      return { repo: { ...s.repo, visibility } };
    }),

  toggleStar: () =>
    set((s) => {
      const isStarredByMe = !s.repo.isStarredByMe;
      const stars = s.repo.stars + (isStarredByMe ? 1 : -1);
      return { repo: { ...s.repo, isStarredByMe, stars: Math.max(0, stars) } };
    }),

  addCollaborator: (name, role) => {
    if (!name.trim()) {
      showErrorToast('Collaborator name is required');
      return;
    }
    const collab: Collaborator = {
      id: nanoid(),
      name: name.trim(),
      role,
    };
    set((s) => ({ repo: { ...s.repo, collaborators: [...s.repo.collaborators, collab] } }));
    showSuccessToast(`Added ${name} as ${role}`);
  },

  removeCollaborator: (id) =>
    set((s) => {
      const target = s.repo.collaborators.find((c) => c.id === id);
      if (target) showSuccessToast(`Removed ${target.name}`);
      return { repo: { ...s.repo, collaborators: s.repo.collaborators.filter((c) => c.id !== id) } };
    }),

  updateCollaboratorRole: (id, role) =>
    set((s) => ({
      repo: {
        ...s.repo,
        collaborators: s.repo.collaborators.map((c) => (c.id === id ? { ...c, role } : c)),
      },
    })),
}));
