// src/components/editor/BlockDetailsDrawer.tsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, Upload, ExternalLink } from 'lucide-react';
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

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });
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

export const BlockDetailsDrawer = () => {
  const { isDrawerOpen, selectedBlockId, blocks, closeDrawer, updateBlock, validateBlock } =
    useEditorStore();
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // form state
  const [formData, setFormData] = useState<Pick<ProofBlock, 'title' | 'description' | 'content'>>({
    title: '',
    description: '',
    content: {},
  });

  // Refs dos inputs de arquivo
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Guardar os Files (brutos) para upload no Save
  const pendingFiles = useRef<{ image?: File; video?: File; audio?: File }>({});

  // URLs blob (para limpar)
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

    // guarda o File bruto
    if (field === 'imageUrl') pendingFiles.current.image = file;
    if (field === 'videoUrl') pendingFiles.current.video = file;
    if (field === 'audioUrl') pendingFiles.current.audio = file;
  };

  useEffect(() => {
    if (selectedBlock) {
      setFormData({
        title: selectedBlock.title ?? '',
        description: selectedBlock.description ?? '',
        content: selectedBlock.content ?? {},
      });
      // limpa pendências antigas
      pendingFiles.current = {};
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

  const handleSave = async () => {
    if (!selectedBlock) return;

    // título obrigatório
    if (!formData.title?.trim()) {
      showErrorToast('Title is required');
      return;
    }

    // 1) validação local
    const candidate: ProofBlock = {
      ...selectedBlock,
      title: formData.title,
      description: formData.description,
      content: formData.content,
    };
    if (!validateBlock(candidate)) return;

    try {
      const blockId = selectedBlock.id; // após a hidratação, já é o id REAL do backend

      // 2) upload de arquivos brutos (se houver)
      const [imgUrl, vidUrl, audUrl] = await Promise.all([
        uploadIfNeeded(blockId, 'image', pendingFiles.current.image),
        uploadIfNeeded(blockId, 'video', pendingFiles.current.video),
        uploadIfNeeded(blockId, 'audio', pendingFiles.current.audio),
      ]);

      // 3) substitui blob: pelos public URLs retornados
      const nextContent: any = { ...(formData.content || {}) };
      if (imgUrl) nextContent.imageUrl = imgUrl;
      if (vidUrl) nextContent.videoUrl = vidUrl;
      if (audUrl) nextContent.audioUrl = audUrl;

      // 4) atualiza no backend
      await api.put(`/blocks/${blockId}`, {
        title: formData.title,
        description: formData.description,
        content: nextContent,
      });

      // 5) atualiza no store
      updateBlock(blockId, {
        title: formData.title,
        description: formData.description,
        content: nextContent,
      });

      showSuccessToast('Block updated successfully');
      closeDrawer();
    } catch (err) {
      console.error('Erro ao salvar bloco:', err);
      showErrorToast('Failed to save block');
    }
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
          Marking as screen capture helps route to a cheaper AI specialized in UI/desktop frames and
          reduces token usage.
        </p>
      </div>
    );
  };

  const renderImageUploader = () => (
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
          <span className="text-xs text-muted-foreground">PNG, JPG, GIF, SVG…</span>
        </div>
        {renderMediaMeta()}
      </div>

      {(formData.content as any)?.imageUrl && (
        <div className="border rounded-lg p-4">
          <img
            src={(formData.content as any).imageUrl}
            alt="Preview"
            className="max-w-full h-auto rounded"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );

  const renderVideoUploader = () => (
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
          <span className="text-xs text-muted-foreground">MP4, WebM, MOV…</span>
        </div>
        {renderMediaMeta()}
      </div>

      {(formData.content as any)?.videoUrl && (
        <div className="border rounded-lg p-4">
          <video className="w-full rounded" controls src={(formData.content as any).videoUrl} />
        </div>
      )}
    </div>
  );

  const renderAudioUploader = () => (
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
          <span className="text-xs text-muted-foreground">MP3, WAV, OGG…</span>
        </div>
      </div>

      {(formData.content as any)?.audioUrl && (
        <div className="border rounded-lg p-4">
          <audio controls className="w-full">
            <source src={(formData.content as any).audioUrl} />
            Your browser does not support audio playback.
          </audio>
        </div>
      )}
    </div>
  );

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
          <div className="sticky top-0 z-10 bg-card border-b border-border">
            <DrawerHeader className="px-6 py-4">
              <DrawerTitle className="flex items-center gap-3">
                Edit {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Block
                <span className="text-sm font-normal text-muted-foreground">
                  #{selectedBlock.id.slice(-4)}
                </span>
              </DrawerTitle>
              <DrawerDescription className="flex items-center justify-between">
                Configure the content and properties of this proof block.
                <StatusBadge status={selectedBlock.status} />
              </DrawerDescription>
            </DrawerHeader>
          </div>

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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
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

          <div className="sticky bottom-0 z-10 bg-card border-t border-border">
            <DrawerFooter className="px-6 py-4">
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" type="button">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
