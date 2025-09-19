// src/components/editor/ProofBlock.tsx
import React from 'react';
import { FaVideo } from 'react-icons/fa6';
import { FaImages } from 'react-icons/fa';
import { CiTextAlignCenter } from 'react-icons/ci';
import { MdAudiotrack, MdHelpOutline } from 'react-icons/md';
import { VscReferences } from 'react-icons/vsc';
import { FiTrash2 } from 'react-icons/fi';

interface ProofBlockProps {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'reference';
  content: string;
  position: { x: number; y: number };
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
}

// Componente de ícone genérico (react-icons aceita className/size)
type IconComponent = React.ComponentType<{ className?: string; size?: number }>;

const blockIcons: Record<ProofBlockProps['type'], IconComponent> = {
  text: CiTextAlignCenter,
  image: FaImages,
  video: FaVideo,
  audio: MdAudiotrack,
  reference: VscReferences,
};

const blockColors: Record<ProofBlockProps['type'], string> = {
  text: 'bg-blue-500',
  image: 'bg-green-500',
  video: 'bg-purple-500',
  audio: 'bg-orange-500',
  reference: 'bg-pink-500',
};

const ProofBlock: React.FC<ProofBlockProps> = ({
  id,
  type,
  content,
  position,
  isSelected = false,
  isDragging = false,
  onSelect,
  onDelete,
  onDragStart,
  onDragEnd,
}) => {
  const Icon: IconComponent = blockIcons[type] ?? MdHelpOutline;
  const colorClass = blockColors[type] ?? 'bg-gray-400';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect?.(id)}
      className={`absolute cursor-move ${
        isDragging ? 'dragging' : 'draggable-block'
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 50 : isSelected ? 20 : 10,
      }}
      role="button"
      aria-label={`Proof block ${type}`}
    >
      <div className="bg-card border-2 border-border rounded-xl shadow-lg p-4 min-w-48 max-w-64 group">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center shrink-0`}
            aria-hidden="true"
          >
            {/* react-icons usa currentColor; 'text-white' funciona */}
            <Icon className="text-white" size={16} />
          </div>

          <span className="font-medium text-foreground text-sm flex-1 truncate">
            {content || 'Untitled'}
          </span>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete block"
              type="button"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 capitalize flex items-center gap-2">
          <span>{type} block</span>
          <span className="font-mono">#{id.slice(-4)}</span>
        </div>
      </div>

      {/* Connection Points */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />
    </div>
  );
};

export default ProofBlock;
