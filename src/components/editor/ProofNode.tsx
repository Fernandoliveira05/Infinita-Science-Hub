import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText, Image, Video, Mic, BookOpen, Edit3, Copy, Trash2, Play } from 'lucide-react';
import { ProofBlock, BlockType } from '@/types/editor';
import { useEditorStore } from '@/stores/editorStore';

const blockIcons: Record<BlockType, typeof FileText> = {
  text: FileText,
  image: Image,
  video: Video,
  audio: Mic,
  reference: BookOpen,
};

const blockColors: Record<BlockType, string> = {
  text: 'bg-blue-500',
  image: 'bg-green-500',
  video: 'bg-purple-500',
  audio: 'bg-orange-500',
  reference: 'bg-pink-500',
};

const statusColors = {
  validated: 'bg-success text-success-foreground',
  in_review: 'bg-warning text-warning-foreground',
  error: 'bg-error text-error-foreground',
};

const statusLabels = {
  validated: 'Validated',
  in_review: 'In Review',
  error: 'Error',
};

interface ProofNodeProps extends NodeProps {
  data: ProofBlock;
}

export const ProofNode = memo(({ data, selected }: ProofNodeProps) => {
  const { openDrawer, deleteBlock, duplicateBlock, setStartBlock, startBlockId } = useEditorStore();
  const blockData = data as ProofBlock;
  const Icon = blockIcons[blockData.type];
  const isStart = startBlockId === blockData.id;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Context menu could be implemented here
  };

  return (
    <div
      className={`group relative bg-card border-2 rounded-xl shadow-lg transition-all duration-200 min-w-64 max-w-80 ${
        selected ? 'border-primary shadow-primary/20' : 'border-border hover:border-primary/50'
      } ${isStart ? 'ring-2 ring-primary/30' : ''}`}
      onContextMenu={handleContextMenu}
    >
      {/* Drag Handle */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full border-2 border-background cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-full rounded-full bg-primary-hover"></div>
      </div>

      {/* Start Indicator */}
      {isStart && (
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center">
          <Play className="w-3 h-3 text-primary-foreground fill-current" />
        </div>
      )}

      {/* Node Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 ${blockColors[blockData.type]} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
              {blockData.title}
            </h3>
            {blockData.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {blockData.description}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[blockData.status]} flex-shrink-0`}>
            {statusLabels[blockData.status]}
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openDrawer(blockData.id)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Edit block"
          >
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => duplicateBlock(blockData.id)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Duplicate block"
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => setStartBlock(blockData.id)}
            className={`p-1.5 hover:bg-muted rounded-md transition-colors ${
              isStart ? 'text-primary' : 'text-muted-foreground'
            }`}
            title="Set as start block"
          >
            <Play className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => deleteBlock(blockData.id)}
            className="p-1.5 hover:bg-error/10 hover:text-error rounded-md transition-colors"
            title="Delete block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Type Badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground capitalize">
            {blockData.type} block
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            #{blockData.id.slice(-4)}
          </span>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-background"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background"
        style={{ bottom: -6 }}
      />
    </div>
  );
});

ProofNode.displayName = 'ProofNode';