// src/components/editor/BlockDetailsDrawer.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Save, Upload, ExternalLink, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEditorStore } from '@/stores/editorStore';
import { ProofBlock } from '@/types/editor';
import { showSuccessToast, showErrorToast } from '@/components/ui/toast-feedback';

const api = axios.create({ baseURL: 'http://localhost:55403/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const StatusBadge = ({ status }: { status: ProofBlock['status'] }) => {
  const map = {
    in_review: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  } as const;

  const label =
    status === 'in_review'
      ? 'In review (AI will decide)'
      : status === 'approved'
      ? 'Approved by AI'
      : 'Rejected by AI';

  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status]}`}>{label}</span>;
};

/** ---------- Helpers de normalização ---------- */
type AnyContent = Record<string, any> | string | null | undefined;

function asObject(c: AnyContent): Record<string, any> {
  if (!c) return {};
  if (typeof c === 'string') {
    try {
      return JSON.parse(c);
    } catch {
      return { url: c };
    }
  }
  if (typeof c === 'object') return { ...c };
  return {};
}

function normalizeContent(raw: AnyContent, type?: ProofBlock['type']) {
  const c = asObject(raw);

  if (c.image_url && !c.imageUrl) c.imageUrl = c.image_url;
  if (c.video_url && !c.videoUrl) c.videoUrl = c.video_url;
  if (c.audio_url && !c.audioUrl) c.audioUrl = c.audio_url;

  if (!c.imageUrl && type === 'image' && c.url) c.imageUrl = c.url;
  if (!c.videoUrl && type === 'video' && c.url) c.videoUrl = c.url;
  if (!c.audioUrl && type === 'audio' && c.url) c.audioUrl = c.url;

  return c;
}

function denormalizeContent(cIn: AnyContent) {
  return asObject(cIn);
}

function pickUrl(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNestedUrl(obj: any) {
  const candidates = [
    obj?.asset?.url,
    obj?.file?.url,
    obj?.image?.url,
    obj?.video?.url,
    obj?.audio?.url,
    obj?.data?.url,
    obj?.meta?.url,
  ].filter(Boolean);
  return candidates.length ? String(candidates[0]).trim() : undefined;
}

function resolveMediaUrl(c: any, type?: ProofBlock['type']) {
  if (!c || typeof c !== 'object') return undefined;

  const common = () =>
    c.url ||
    c.publicUrl ||
    c.public_url ||
    c.src ||
    pickNestedUrl(c) ||
    pickUrl(c, ['file', 'href']);

  if (type === 'image') return (c.imageUrl || c.image_url || common())?.trim();
  if (type === 'video') return (c.videoUrl || c.video_url || common())?.trim();
  if (type === 'audio') return (c.audioUrl || c.audio_url || common())?.trim();
  return undefined;
}

export const BlockDetailsDrawer = () => {
  const {
    isDrawerOpen,
    selectedBlockId,
    blocks,
    closeDrawer,
    updateBlock,
    deleteBlock,
    validateBlock,
  } = useEditorStore();

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId),
    [blocks, selectedBlockId]
  );

  const [formData, setFormData] = useState<Pick<ProofBlock, 'title' | 'description' | 'content'>>({
    title: '',
    description: '',
    content: {},
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingAsset, setIsRemovingAsset] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);

  const [mediaError, setMediaError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const pendingFiles = useRef<{ image?: File; video?: File; audio?: File }>({});
  const objectUrls = useRef<string[]>([]);

  const setObjectUrl = (field: 'imageUrl' | 'videoUrl' | 'audioUrl', file: File) => {
    const prevUrl = (formData.content as any)?.[field] as string | undefined;
    if (prevUrl && prevUrl.startsWith('blob:')) {
      URL.revokeObjectURL(prevUrl);
      objectUrls.current = objectUrls.current.filter((u) => u !== prevUrl);
    }
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);

    setFormData((prev) => ({
      ...prev,
      content: { ...prev.content, [field]: url } as any,
    }));

    if (field === 'imageUrl') pendingFiles.current.image = file;
    if (field === 'videoUrl') pendingFiles.current.video = file;
    if (field === 'audioUrl') pendingFiles.current.audio = file;

    setMediaError(null);
  };

  const hydrateSelected = async (id: string) => {
    try {
      setIsHydrating(true);
      setMediaError(null);
      const res = await api.get(`/blocks/${id}`);
      const b = res.data as ProofBlock;

      const normalized = normalizeContent(b.content, b.type);

      updateBlock(id, {
        title: b.title,
        description: b.description,
        content: normalized,
        status: b.status,
        aiSummary: (b as any).aiSummary,
      });

      setFormData({
        title: b.title ?? '',
        description: b.description ?? '',
        content: normalized,
      });
    } catch (e: any) {
      console.error('Erro ao hidratar bloco:', e);
      if (e?.response?.status === 404) {
        deleteBlock(id);
        closeDrawer();
        showErrorToast('Block not found (it may have been deleted)');
      } else {
        showErrorToast('Failed to load block');
      }
    } finally {
      setIsHydrating(false);
    }
  };

  useEffect(() => {
    if (isDrawerOpen && selectedBlockId) {
      hydrateSelected(selectedBlockId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen, selectedBlockId]);

  useEffect(() => {
    if (selectedBlock) {
      setFormData({
        title: selectedBlock.title ?? '',
        description: selectedBlock.description ?? '',
        content: normalizeContent(selectedBlock.content, selectedBlock.type),
      });
      pendingFiles.current = {};
      setMediaError(null);
    }
    return () => {
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrls.current = [];
      pendingFiles.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlock?.id]);

  const uploadIfNeeded = async (blockId: string, kind: 'image' | 'video' | 'audio', file?: File) => {
    if (!file) return undefined;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    const res = await api.post(`/blocks/${blockId}/assets`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.url as string | undefined;
  };

  const removeAsset = async (blockId: string, url: string) => {
    setIsRemovingAsset(true);
    try {
      await api.delete(`/blocks/${blockId}/assets`, { params: { asset_url: url } });

      setFormData((prev) => {
        const next = { ...(prev.content as any) };
        (['imageUrl', 'videoUrl', 'audioUrl'] as const).forEach((k) => {
          if (next[k] === url) next[k] = undefined;
        });
        if (next.url === url) next.url = undefined;
        if (next.src === url) next.src = undefined;
        return { ...prev, content: next };
      });

      showSuccessToast('File removed from storage');
      setMediaError(null);
    } catch (e: any) {
      console.error('Erro ao remover asset:', e);
      showErrorToast(e?.response?.data?.detail || 'Failed to remove file');
    } finally {
      setIsRemovingAsset(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBlock) return;

    if (!formData.title?.trim()) {
      showErrorToast('Title is required');
      return;
    }

    const candidate: ProofBlock = {
      ...selectedBlock,
      title: formData.title,
      description: formData.description,
      content: formData.content,
    };
    if (!validateBlock(candidate)) return;

    try {
      setIsSaving(true);

      const blockId = selectedBlock.id;

      const [imgUrl, vidUrl, audUrl] = await Promise.all([
        uploadIfNeeded(blockId, 'image', pendingFiles.current.image),
        uploadIfNeeded(blockId, 'video', pendingFiles.current.video),
        uploadIfNeeded(blockId, 'audio', pendingFiles.current.audio),
      ]);

      const nextContent: any = { ...denormalizeContent(formData.content) };
      if (imgUrl) nextContent.imageUrl = imgUrl;
      if (vidUrl) nextContent.videoUrl = vidUrl;
      if (audUrl) nextContent.audioUrl = audUrl;

      const res = await api.put(`/blocks/${blockId}`, {
        title: formData.title,
        description: formData.description,
        content: nextContent,
      });

      const normalized = normalizeContent(res.data.content, selectedBlock.type);

      updateBlock(blockId, {
        title: res.data.title,
        description: res.data.description,
        content: normalized,
        status: res.data.status,
        aiSummary: (res.data as any).aiSummary,
      });

      showSuccessToast('Block saved');

      await hydrateSelected(blockId);
    } catch (err: any) {
      console.error('Erro ao salvar bloco:', err);
      showErrorToast(err?.response?.data?.detail || 'Failed to save block');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!selectedBlock) return;
    if (!confirm('Delete this block permanently?')) return;

    try {
      setIsDeleting(true);
      await api.delete(`/blocks/${selectedBlock.id}`);
    } catch (e: any) {
      if (e?.response?.status !== 404) {
        console.error('Erro ao deletar bloco:', e);
        showErrorToast(e?.response?.data?.detail || 'Failed to delete block');
        setIsDeleting(false);
        return;
      }
    }

    deleteBlock(selectedBlock.id);
    showSuccessToast('Block deleted');
    closeDrawer();
    setIsDeleting(false);
  };

  // ---------- PREVIEW DE CONTEÚDO (sem link/URL visível) ----------
  const ContentPreview = () => {
    if (!selectedBlock) return null;
    const c = formData.content as any;
    const resolved = resolveMediaUrl(c, selectedBlock.type);

    const onLoadError = () => {
      setMediaError('Falha ao carregar a mídia. Pode ser URL expirada (signed), permissão do bucket ou CORS.');
    };

    if (selectedBlock.type === 'image') {
      return (
        <div className="mt-4">
          <Label>Preview</Label>
          <div className="border rounded-lg p-4 mt-2">
            {resolved ? (
              <>
                <img
                  src={resolved}
                  alt="Image preview"
                  className="max-w-full h-auto rounded"
                  onError={onLoadError}
                />
                {mediaError && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {mediaError}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">no image URL</p>
            )}
          </div>
        </div>
      );
    }

    if (selectedBlock.type === 'video') {
      return (
        <div className="mt-4">
          <Label>Preview</Label>
          <div className="border rounded-lg p-4 mt-2">
            {resolved ? (
              <>
                <video className="w-full rounded" controls onError={onLoadError}>
                  <source src={resolved} />
                </video>
                {mediaError && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {mediaError}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">no video URL</p>
            )}
          </div>
        </div>
      );
    }

    if (selectedBlock.type === 'audio') {
      return (
        <div className="mt-4">
          <Label>Preview</Label>
          <div className="border rounded-lg p-4 mt-2">
            {resolved ? (
              <>
                <audio controls className="w-full" onError={onLoadError}>
                  <source src={resolved} />
                </audio>
                {mediaError && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {mediaError}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">no audio URL</p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // ---------- EDITORES DE CONTEÚDO ----------
  const renderTextEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="markdown">Content (Markdown)</Label>
        <Textarea
          id="markdown"
          placeholder="Write your content using Markdown syntax..."
          value={(formData.content as any)?.markdown || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              content: { ...(prev.content as any), markdown: e.target.value },
            }))
          }
          className="min-h-48 font-mono text-sm"
        />
      </div>
    </div>
  );

  const renderMediaMeta = () => {
    const isScreenCapture = Boolean((formData.content as any)?.meta?.isScreenCapture);
    return (
      <div className="mt-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isScreenCapture}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                content: {
                  ...(prev.content as any),
                  meta: {
                    ...((prev.content as any)?.meta || {}),
                    isScreenCapture: e.target.checked,
                  },
                } as any,
              }))
            }
          />
          This is a screen capture / screenshot
        </label>
        <p className="text-[11px] text-muted-foreground mt-1">
          Marking as screen capture helps route to a cheaper AI specialized in UI/desktop frames and reduces token usage.
        </p>
      </div>
    );
  };

  const renderImageUploader = () => {
    const imageUrl = resolveMediaUrl(formData.content as any, 'image');

    return (
      <div className="space-y-4">
        <div>
          <Label>Image file</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) setObjectUrl('imageUrl', file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose image
            </Button>

            {imageUrl && !String(imageUrl).startsWith('blob:') && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeAsset(selectedBlock!.id, String(imageUrl))}
                disabled={isRemovingAsset}
                className="flex items-center gap-2 text-rose-600"
              >
                {isRemovingAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Remove current
              </Button>
            )}

            <span className="text-xs text-muted-foreground">PNG, JPG, GIF, SVG…</span>
          </div>
          {renderMediaMeta()}
        </div>

        <ContentPreview />
      </div>
    );
  };

  const renderVideoUploader = () => {
    const videoUrl = resolveMediaUrl(formData.content as any, 'video');

    return (
      <div className="space-y-4">
        <div>
          <Label>Video file</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) setObjectUrl('videoUrl', file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose video
            </Button>

            {videoUrl && !String(videoUrl).startsWith('blob:') && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeAsset(selectedBlock!.id, String(videoUrl))}
                disabled={isRemovingAsset}
                className="flex items-center gap-2 text-rose-600"
              >
                {isRemovingAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Remove current
              </Button>
            )}

            <span className="text-xs text-muted-foreground">MP4, WebM, MOV…</span>
          </div>
          {renderMediaMeta()}
        </div>

        <ContentPreview />
      </div>
    );
  };

  const renderAudioUploader = () => {
    const audioUrl = resolveMediaUrl(formData.content as any, 'audio');

    return (
      <div className="space-y-4">
        <div>
          <Label>Audio file</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) setObjectUrl('audioUrl', file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => audioInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose audio
            </Button>

            {audioUrl && !String(audioUrl).startsWith('blob:') && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeAsset(selectedBlock!.id, String(audioUrl))}
                disabled={isRemovingAsset}
                className="flex items-center gap-2 text-rose-600"
              >
                {isRemovingAsset ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Remove current
              </Button>
            )}

            <span className="text-xs text-muted-foreground">MP3, WAV, OGG…</span>
          </div>
        </div>

        <ContentPreview />
      </div>
    );
  };

  const renderReferenceEditor = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="author">Author *</Label>
          <Input
            id="author"
            placeholder="Smith, J."
            value={(formData.content as any)?.reference?.author || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                content: {
                  ...(prev.content as any),
                  reference: {
                    ...((prev.content as any)?.reference || {}),
                    author: e.target.value,
                  },
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            placeholder="2023"
            value={(formData.content as any)?.reference?.year || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                content: {
                  ...(prev.content as any),
                  reference: {
                    ...((prev.content as any)?.reference || {}),
                    year: e.target.value,
                  },
                },
              }))
            }
          />
        </div>
      </div>
      <div>
        <Label htmlFor="refTitle">Title *</Label>
        <Input
          id="refTitle"
          placeholder="Research Paper Title"
          value={(formData.content as any)?.reference?.title || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              content: {
                ...(prev.content as any),
                reference: {
                  ...((prev.content as any)?.reference || {}),
                  title: e.target.value,
                },
              },
            }))
          }
        />
      </div>
      <div>
        <Label htmlFor="link">Link/URL (optional)</Label>
        <div className="flex gap-2">
          <Input
            id="link"
            placeholder="https://doi.org/10.1000/xyz or https://example.com"
            value={(formData.content as any)?.reference?.link || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                content: {
                  ...(prev.content as any),
                  reference: {
                    ...((prev.content as any)?.reference || {}),
                    link: e.target.value,
                  },
                },
              }))
            }
          />
          {(formData.content as any)?.reference?.link && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={(formData.content as any).reference.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="doi">DOI</Label>
        <Input
          id="doi"
          placeholder="10.1000/xyz123"
          value={(formData.content as any)?.reference?.doi || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              content: {
                ...(prev.content as any),
                reference: {
                  ...((prev.content as any)?.reference || {}),
                  doi: e.target.value,
                },
              },
            }))
          }
        />
      </div>
    </div>
  );

  const renderContentEditor = () => {
    if (!selectedBlock) return null;
    switch (selectedBlock.type) {
      case 'text':
        return renderTextEditor();
      case 'image':
        return renderImageUploader();
      case 'video':
        return renderVideoUploader();
      case 'audio':
        return renderAudioUploader();
      case 'reference':
        return renderReferenceEditor();
      default:
        return null;
    }
  };

  if (!selectedBlock) return null;

  return (
    <Drawer open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="max-w-2xl mx-auto p-0">
        <div className="h-[85vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border">
            <DrawerHeader className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DrawerTitle className="flex items-center gap-3">
                    Edit {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Block
                    <span className="text-sm font-normal text-muted-foreground">
                      #{selectedBlock.id.slice(-4)}
                    </span>
                  </DrawerTitle>
                  <DrawerDescription>
                    Configure the content and properties of this proof block.
                  </DrawerDescription>
                </div>

                {/* Delete */}
                <Button
                  variant="outline"
                  className="text-rose-600"
                  onClick={handleDeleteBlock}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </Button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={selectedBlock.status} />
                {isHydrating && (
                  <span className="inline-flex items-center text-xs text-muted-foreground gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> loading…
                  </span>
                )}
              </div>
            </DrawerHeader>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter block title..."
                  value={formData.title || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this block (optional)"
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* AI Summary (read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>AI Summary (read-only)</Label>
                </div>
                <Textarea
                  readOnly
                  value={selectedBlock.aiSummary ?? 'Awaiting backend audit…'}
                  className="h-24 text-sm text-muted-foreground bg-background/60"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The AI will generate this summary and set the status after audit. You cannot change it manually.
                </p>
              </div>
            </div>

            {/* Content Editor */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Content</h3>
              {renderContentEditor()}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 bg-card border-t border-border">
            <DrawerFooter className="px-6 py-4">
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" type="button" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={closeDrawer} type="button">
                  Cancel
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
