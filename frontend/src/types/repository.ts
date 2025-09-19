export type RepoVisibility = 'public' | 'private';

export type CollaboratorRole = 'owner' | 'maintainer' | 'contributor' | 'viewer';

export interface Collaborator {
  id: string;
  name: string;
  avatarUrl?: string;
  role: CollaboratorRole;
}

export interface RepositoryMeta {
  id: string;
  name: string;
  description?: string;
  visibility: RepoVisibility;
  stars: number;
  isStarredByMe: boolean;
  collaborators: Collaborator[];
}
