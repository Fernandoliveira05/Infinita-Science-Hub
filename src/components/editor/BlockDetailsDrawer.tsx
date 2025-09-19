import { useState, useEffect } from 'react';
import { X, Save, Upload, ExternalLink } from 'lucide-react';
import { 
  Drawer,
  DrawerClose,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditorStore } from '@/stores/editorStore';
import { ProofBlock, BlockStatus } from '@/types/editor';
import { showSuccessToast, showErrorToast } from '@/components/ui/toast-feedback';

export const BlockDetailsDrawer = () => {
  const { isDrawerOpen, selectedBlockId, blocks, closeDrawer, updateBlock, validateBlock } = useEditorStore();
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const [formData, setFormData] = useState<Partial<ProofBlock>>({});

  useEffect(() => {
    if (selectedBlock) {
      setFormData(selectedBlock);
    }
  }, [selectedBlock]);

  const handleSave = () => {
    if (!selectedBlock || !formData.title?.trim()) {
      showErrorToast('Title is required');
      return;
    }

    const updatedBlock = { ...selectedBlock, ...formData } as ProofBlock;
    
    if (!validateBlock(updatedBlock)) {
      return;
    }

    updateBlock(selectedBlock.id, formData);
    showSuccessToast('Block updated successfully');
    closeDrawer();
  };

  const handleCancel = () => {
    setFormData(selectedBlock || {});
    closeDrawer();
  };

  const renderContentEditor = () => {
    if (!selectedBlock) return null;

    switch (selectedBlock.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="markdown">Content (Markdown)</Label>
              <Textarea
                id="markdown"
                placeholder="Write your content using Markdown syntax..."
                value={formData.content?.markdown || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  content: { ...prev.content, markdown: e.target.value }
                }))}
                className="min-h-48 font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg or upload file"
                  value={formData.content?.imageUrl || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, imageUrl: e.target.value }
                  }))}
                />
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {formData.content?.imageUrl && (
              <div className="border rounded-lg p-4">
                <img 
                  src={formData.content.imageUrl} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="flex gap-2">
                <Input
                  id="videoUrl"
                  placeholder="https://youtube.com/watch?v=... or upload file"
                  value={formData.content?.videoUrl || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, videoUrl: e.target.value }
                  }))}
                />
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {formData.content?.videoUrl && (
              <div className="border rounded-lg p-4">
                <div className="aspect-video bg-muted rounded flex items-center justify-center">
                  <span className="text-muted-foreground">Video Preview</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="audioUrl">Audio URL</Label>
              <div className="flex gap-2">
                <Input
                  id="audioUrl"
                  placeholder="Audio file URL or upload"
                  value={formData.content?.audioUrl || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, audioUrl: e.target.value }
                  }))}
                />
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {formData.content?.audioUrl && (
              <div className="border rounded-lg p-4">
                <audio controls className="w-full">
                  <source src={formData.content.audioUrl} />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}
          </div>
        );

      case 'reference':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  placeholder="Smith, J."
                  value={formData.content?.reference?.author || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      reference: {
                        ...prev.content?.reference,
                        author: e.target.value,
                        title: prev.content?.reference?.title || '',
                        year: prev.content?.reference?.year || ''
                      }
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  placeholder="2023"
                  value={formData.content?.reference?.year || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      reference: {
                        ...prev.content?.reference,
                        author: prev.content?.reference?.author || '',
                        title: prev.content?.reference?.title || '',
                        year: e.target.value
                      }
                    }
                  }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="refTitle">Title *</Label>
              <Input
                id="refTitle"
                placeholder="Research Paper Title"
                value={formData.content?.reference?.title || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    reference: {
                      ...prev.content?.reference,
                      author: prev.content?.reference?.author || '',
                      year: prev.content?.reference?.year || '',
                      title: e.target.value
                    }
                  }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="link">Link/URL</Label>
              <div className="flex gap-2">
                <Input
                  id="link"
                  placeholder="https://doi.org/10.1000/xyz or https://example.com"
                  value={formData.content?.reference?.link || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      reference: {
                        ...prev.content?.reference,
                        author: prev.content?.reference?.author || '',
                        title: prev.content?.reference?.title || '',
                        year: prev.content?.reference?.year || '',
                        link: e.target.value
                      }
                    }
                  }))}
                />
                {formData.content?.reference?.link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={formData.content.reference.link} target="_blank" rel="noopener noreferrer">
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
                value={formData.content?.reference?.doi || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    reference: {
                      ...prev.content?.reference,
                      author: prev.content?.reference?.author || '',
                      title: prev.content?.reference?.title || '',
                      year: prev.content?.reference?.year || '',
                      doi: e.target.value
                    }
                  }
                }))}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!selectedBlock) return null;

  return (
    <Drawer open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="max-w-2xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-3">
            Edit {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Block
            <span className="text-sm font-normal text-muted-foreground">#{selectedBlock.id.slice(-4)}</span>
          </DrawerTitle>
          <DrawerDescription>
            Configure the content and properties of this proof block.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter block title..."
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this block (optional)"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: BlockStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Content</h3>
            {renderContentEditor()}
          </div>
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};