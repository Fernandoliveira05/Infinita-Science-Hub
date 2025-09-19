// src/components/editor/RepoHeader.tsx
import React from 'react';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/button';
import { Star, Users, UserPlus, Globe, Lock, Save as SaveIcon, Play, Settings, X } from 'lucide-react';
import { showErrorToast, showSuccessToast, showInfoToast } from '@/components/ui/toast-feedback';

export const RepoHeader: React.FC = () => {
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

  // Acesso “flexível” a possíveis métodos do store (se você já tiver implementado no store):
  // saveDraft() e submitForAudit() — se não existirem, caímos no fallback (simulação local).
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
    // (Opcional) Você pode exigir descrição, mas deixei apenas nome obrigatório.
  };

  const handleSaveRepo = async () => {
    if (!validateRepoBasics()) return;
    try {
      setIsSaving(true);
      if (typeof repoStoreAny.saveDraft === 'function') {
        await repoStoreAny.saveDraft(); // sua implementação no store pode serializar repo/blocks etc.
      } else {
        // Fallback simulado (remova ao implementar no store)
        await new Promise((res) => setTimeout(res, 500));
      }
      showSuccessToast('Repository saved as draft');
    } catch (e) {
      showErrorToast('Failed to save repository');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRepo = async () => {
    if (!validateRepoBasics()) return;
    try {
      setIsSubmitting(true);
      if (typeof repoStoreAny.submitForAudit === 'function') {
        await repoStoreAny.submitForAudit(); // sua implementação deve iniciar o fluxo de auditoria por IA
      } else {
        // Fallback simulado (remova ao implementar no store)
        await new Promise((res) => setTimeout(res, 700));
      }
      showSuccessToast('Repository submitted for AI audit');
    } catch (e) {
      showErrorToast('Failed to submit repository');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atalho de teclado: Ctrl/Cmd+S para salvar
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
  }, [repo?.name, repo?.description]);

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
              <Button
                onClick={handleSaveRepo}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <SaveIcon className="w-4 h-4" />
                {isSaving ? 'Saving…' : 'Save Repository'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSubmitRepo}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
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
                    key={c.id}
                    title={`${c.name} — ${c.role}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium border border-border"
                  >
                    {c.name
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

                  {/* Existing collaborators list */}
                  {repo.collaborators.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium mb-2">Current collaborators</p>
                      <ul className="space-y-2">
                        {repo.collaborators.map((c: any) => (
                          <li key={c.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-muted text-[10px] font-medium flex items-center justify-center border border-border">
                                {c.name
                                  .split(' ')
                                  .map((p: string) => p[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-medium">{c.name}</p>
                                <p className="text-[11px] text-muted-foreground">{c.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={c.role}
                                onChange={(e) => updateCollaboratorRole(c.id, e.target.value as any)}
                                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                              >
                                <option value="owner">Owner</option>
                                <option value="maintainer">Maintainer</option>
                                <option value="contributor">Contributor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <Button variant="ghost" onClick={() => removeCollaborator(c.id)} className="text-xs">
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

        {/* Linha de ações secundárias (opcional) */}
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
