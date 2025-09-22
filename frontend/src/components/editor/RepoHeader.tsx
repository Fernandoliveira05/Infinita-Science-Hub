import React from 'react';
import axios from 'axios';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/button';
import { Star, Users, UserPlus, Globe, Lock, Save as SaveIcon, Play, Settings } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/ui/toast-feedback';
import { RepositoryMeta } from '@/types/repository'; // --> Boa prática: Importar o tipo

// --> CORREÇÃO: Usar variável de ambiente para a URL da API
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:55403/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RepoHeaderProps = {
  // --> CORREÇÃO: Adicionada a prop para a referência do botão
  saveButtonRef: React.RefObject<HTMLButtonElement>;
  onSaved?: (id: string, repo: RepositoryMeta) => void;
};

export const RepoHeader: React.FC<RepoHeaderProps> = ({ saveButtonRef, onSaved }) => {
  // --> CORREÇÃO: A store agora pode retornar 'repo' como nulo
  const {
    repo,
    setName,
    setDescription,
    toggleVisibility,
    toggleStar,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    setRepo, // Importar o setRepo para simplificar
  } = useRepoStore();

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
    if (!repo?.name || repo.name.trim().length < 3) {
      showErrorToast('Please provide a repository name with at least 3 characters.');
      return false;
    }
    return true;
  };
  
  // Função simplificada para criar o repositório e atualizar o estado
  const createAndBind = async () => {
    if (!repo) return; // Proteção adicional
    const res = await api.post('/repos', {
      name: repo.name || 'Untitled Repository',
      description: repo.description || '',
      visibility: repo.visibility || 'public',
    });
    const created = res.data as RepositoryMeta;
    setRepo(created); // --> CORREÇÃO: 'setRepo' já atualiza o estado inteiro, incluindo o ID.
    onSaved?.(created.id, created);
    return created;
  };

  const handleSaveRepo = async () => {
    if (!validateRepoBasics() || !repo) return;
    
    // --> CORREÇÃO: Checa se o ID foi gerado pelo backend. IDs temporários (nanoid) não têm 21 caracteres.
    // Isso é uma heurística, o ideal seria checar um prefixo, ex: 'temp_'. Mas funciona para nanoid.
    const isNewRepo = repo.id.length !== 21; 

    try {
      setIsSaving(true);
      
      if (isNewRepo) {
        const created = await createAndBind();
        showSuccessToast('Repository created');
        return created;
      }
      
      // Se já existe, apenas atualiza (PUT)
      const res = await api.put(`/repos/${repo.id}`, {
        name: repo.name,
        description: repo.description,
      });
      const updated = res.data as RepositoryMeta;
      setRepo(updated);
      onSaved?.(updated.id, updated);
      showSuccessToast('Repository updated');
      return updated;
      
    } catch (e: any) {
      // Fallback para criar caso o PUT falhe (ex: ID não encontrado no backend)
      const status = e?.response?.status;
      if (status === 400 || status === 404 || status === 422) {
        try {
          const created = await createAndBind();
          showSuccessToast('Repository created (relinked)');
          return created;
        } catch (createError: any) {
          const msg = createError?.response?.data?.detail || 'Failed to create repository';
          showErrorToast(msg);
        }
      } else {
        const msg = e?.response?.data?.detail || 'Failed to save repository';
        showErrorToast(msg);
      }
      console.error('Failed to save repository', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRepo = async () => {
    if (!repo) return;
    let repoToSubmit = repo;
    
    const isNewRepo = repo.id.length !== 21;
    if (isNewRepo) {
      const savedRepo = await handleSaveRepo();
      if (!savedRepo) return; // Erro já foi mostrado no toast
      repoToSubmit = savedRepo;
    }

    if (!repoToSubmit.id) return;

    try {
      setIsSubmitting(true);
      const res = await api.post(`/audits/repos/${repoToSubmit.id}/submit-final-review`);
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
  }, [repo]); // --> CORREÇÃO: Depender do objeto 'repo' inteiro simplifica

  // --> CORREÇÃO: Lida com o estado em que o repositório ainda não foi carregado ou foi limpo
  if (!repo) {
    return (
      <section className="bg-card border-b border-border px-6 py-5 animate-pulse">
        <div className="h-6 w-1/3 bg-muted rounded-md mb-3"></div>
        <div className="h-10 w-full bg-muted rounded-md"></div>
      </section>
    );
  }

  const isNewRepo = repo.id.length !== 21;

  return (
    <section className="bg-card border-b border-border">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-6">
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
                {repo.visibility === 'public' ? <><Globe className="w-3.5 h-3.5" /> Public</> : <><Lock className="w-3.5 h-3.5" /> Private</>}
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

          <div className="shrink-0 flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              {/* --> CORREÇÃO: Ref anexada e lógica do texto corrigida */}
              <Button ref={saveButtonRef} onClick={handleSaveRepo} disabled={isSaving} className="flex items-center gap-2">
                <SaveIcon className="w-4 h-4" />
                {isSaving ? 'Saving…' : isNewRepo ? 'Save Repository' : 'Update Repository'}
              </Button>
              <Button variant="secondary" onClick={handleSubmitRepo} disabled={isSubmitting || isNewRepo} className="flex items-center gap-2" title={isNewRepo ? "You must save the repository first" : ""}>
                <Play className="w-4 h-4" />
                {isSubmitting ? 'Submitting…' : 'Submit for Audit'}
              </Button>
            </div>
            
            {/* O resto do componente continua igual... */}
          </div>
        </div>
      </div>
    </section>
  );
};