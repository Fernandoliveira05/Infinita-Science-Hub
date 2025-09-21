import React from 'react';
import axios from 'axios';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/button';
import { Star, Users, UserPlus, Globe, Lock, Save as SaveIcon, Play, Settings } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/ui/toast-feedback';

// axios igual ao Editor
const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RepoHeaderProps = {
  /** opcional: use se quiser redirecionar ou atualizar estado do pai após salvar */
  onSaved?: (id: string, repo: any) => void;
};

export const RepoHeader: React.FC<RepoHeaderProps> = ({ onSaved }) => {
  const {
    repo,
    setName,
    setDescription,
    toggleVisibility,
    toggleStar,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
  } = useRepoStore();

  // acesso “any” para métodos opcionais do store (se existirem)
  const repoStoreAny = useRepoStore() as any;

  const [addOpen, setAddOpen] = React.useState(false);
  const [newCollabName, setNewCollabName] = React.useState('');
  const [newRole, setNewRole] = React.useState<'owner' | 'maintainer' | 'contributor' | 'viewer'>('contributor');

  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAdd = () => {
    if (!newCollabName.trim()) {
      showErrorToast('Collaborator name is required');
      return;
    }
    addCollaborator(newCollabName, newRole);
    setNewCollabName('');
    setNewRole('contributor');
    setAddOpen(false);
    showSuccessToast('Collaborator added');
  };

  const validateRepoBasics = () => {
    if (!repo.name || repo.name.trim().length < 3) {
      showErrorToast('Please provide a repository name with at least 3 characters.');
      return false;
    }
    return true;
  };

  // cria repo e sincroniza no store (sem navegar)
  const createAndBind = async () => {
    const res = await api.post('/repos', {
      name: repo.name || 'Untitled Repository',
      description: repo.description || '',
      visibility: repo.visibility || 'public',
    });
    const created = res.data;
    if (typeof repoStoreAny.setId === 'function') repoStoreAny.setId(created.id);
    if (typeof repoStoreAny.setRepo === 'function') repoStoreAny.setRepo(created);
    onSaved?.(created.id, created);
    return created;
  };

  const handleSaveRepo = async () => {
    if (!validateRepoBasics()) return;
    try {
      setIsSaving(true);

      if (!repo?.id) {
        const created = await createAndBind();
        showSuccessToast('Repository created');
        return created;
      }

      // tenta atualizar; se o seu id antigo não bater com o banco (ex.: nanoid), fazemos fallback pra create
      try {
        const res = await api.put(`/repos/${repo.id}`, {
          name: repo.name,
          description: repo.description,
        });
        const updated = res.data;
        if (typeof repoStoreAny.setRepo === 'function') repoStoreAny.setRepo(updated);
        onSaved?.(updated.id, updated);
        showSuccessToast('Repository updated');
        return updated;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 400 || status === 404 || status === 422) {
          const created = await createAndBind();
          showSuccessToast('Repository created (relinked canonical id)');
          return created;
        }
        throw e;
      }
    } catch (e: any) {
      console.error('Failed to save repository', e);
      const msg = e?.response?.data?.detail || 'Failed to save repository';
      showErrorToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRepo = async () => {
    if (!validateRepoBasics()) return;
    // garante que existe id válido antes de submeter
    let id = repo?.id;
    if (!id) {
      const created = await handleSaveRepo();
      // @ts-ignore
      id = created?.id;
      if (!id) return; // erro já tostateado acima
    }
    try {
      setIsSubmitting(true);
      const res = await api.post(`/audits/repos/${id}/submit-final-review`);
      const count = res?.data?.audit_count ?? 'ok';
      showSuccessToast(`Final review submitted. Audits: ${count}`);
    } catch (e: any) {
      console.error('Failed to submit repository', e);
      const msg = e?.response?.data?.detail || 'Failed to submit repository';
      showErrorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ctrl/Cmd + S
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      if ((isMac && e.metaKey && e.key.toLowerCase() === 's') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        handleSaveRepo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo?.name, repo?.description, repo?.id]);

  return (
    <section className="bg-card border-b border-border">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-6">
          {/* Left — Name + Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <input
                value={repo.name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Repository name (e.g., Smart Irrigation Study)"
                className="w-full max-w-xl text-xl font-semibold bg-transparent border border-transparent focus:border-border rounded-md px-2 py-1 outline-none text-foreground"
              />
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                  repo.visibility === 'public'
                    ? 'text-green-700 border-green-200 bg-green-50'
                    : 'text-amber-700 border-amber-200 bg-amber-50'
                } cursor-pointer select-none`}
                onClick={toggleVisibility}
                title="Toggle visibility"
              >
                {repo.visibility === 'public' ? (
                  <>
                    <Globe className="w-3.5 h-3.5" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Private
                  </>
                )}
              </span>
            </div>

            <textarea
              value={repo.description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this research repository..."
              className="mt-2 w-full max-w-3xl text-sm bg-transparent border border-border rounded-md px-3 py-2 outline-none text-foreground"
              rows={2}
            />
          </div>

          {/* Right — Actions + Star + Collaborators */}
          <div className="shrink-0 flex flex-col items-end gap-3">
            {/* Primary actions */}
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveRepo} disabled={isSaving} className="flex items-center gap-2">
                <SaveIcon className="w-4 h-4" />
                {isSaving ? 'Saving…' : repo?.id ? 'Save Repository' : 'Save Repository'}
              </Button>
              <Button variant="secondary" onClick={handleSubmitRepo} disabled={isSubmitting} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                {isSubmitting ? 'Submitting…' : 'Submit for Audit'}
              </Button>
            </div>

            {/* Star */}
            <Button
              variant={repo.isStarredByMe ? 'default' : 'outline'}
              onClick={toggleStar}
              className="flex items-center gap-2"
            >
              <Star className={`w-4 h-4 ${repo.isStarredByMe ? 'fill-current' : ''}`} />
              {repo.isStarredByMe ? 'Starred' : 'Star'}
              <span className="ml-1 text-xs opacity-75">{repo.stars}</span>
            </Button>

            {/* Collaborators */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {repo.collaborators.slice(0, 5).map((c: any) => (
                  <div
                    key={c.id ?? c.address ?? c.name}
                    title={`${c.name} — ${c.role}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium border border-border"
                  >
                    {String(c.name ?? c.username ?? '')
                      .split(' ')
                      .map((p: string) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => setAddOpen((v) => !v)}>
                <UserPlus className="w-4 h-4" /> Add
              </Button>
            </div>

            {/* Mini panel to manage collaborators */}
            {addOpen && (
              <div className="relative">
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-10">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Add collaborator
                  </h4>

                  <label className="block text-xs mb-1">Name</label>
                  <input
                    value={newCollabName}
                    onChange={(e) => setNewCollabName(e.target.value)}
                    className="w-full mb-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Full name or handle"
                  />

                  <label className="block text-xs mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full mb-4 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="owner">Owner</option>
                    <option value="maintainer">Maintainer</option>
                    <option value="contributor">Contributor</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd}>Add</Button>
                  </div>

                  {repo.collaborators.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium mb-2">Current collaborators</p>
                      <ul className="space-y-2">
                        {repo.collaborators.map((c: any) => (
                          <li key={c.id ?? c.address ?? c.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-muted text-[10px] font-medium flex items-center justify-center border border-border">
                                {String(c.name ?? c.username ?? '')
                                  .split(' ')
                                  .map((p: string) => p[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-medium">{c.name ?? c.username ?? 'User'}</p>
                                <p className="text-[11px] text-muted-foreground">{c.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={c.role}
                                onChange={(e) => updateCollaboratorRole(c.id ?? c.address, e.target.value as any)}
                                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                              >
                                <option value="owner">Owner</option>
                                <option value="maintainer">Maintainer</option>
                                <option value="contributor">Contributor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <Button variant="ghost" onClick={() => removeCollaborator(c.id ?? c.address)} className="text-xs">
                                Remove
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <Settings className="w-3.5 h-3.5" />
          <span>
            Tip: press <kbd className="px-1 py-0.5 rounded border bg-muted">Ctrl</kbd>/<kbd className="px-1 py-0.5 rounded border bg-muted">⌘</kbd>
            +<kbd className="px-1 py-0.5 rounded border bg-muted">S</kbd> to save quickly.
          </span>
        </div>
      </div>
    </section>
  );
};
