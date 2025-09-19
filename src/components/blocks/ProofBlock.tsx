import { ReactNode } from "react";
import { FileText, Image, Video, Mic, BookOpen, Trash2 } from "lucide-react";

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

const blockIcons = {
  text: FileText,
  image: Image,
  video: Video,
  audio: Mic,
  reference: BookOpen,
};

const blockColors = {
  text: 'bg-blue-500',
  image: 'bg-green-500',
  video: 'bg-purple-500',
  audio: 'bg-orange-500',
  reference: 'bg-pink-500',
};

const ProofBlock = ({
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
}: ProofBlockProps) => {
  const Icon = blockIcons[type];

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
        zIndex: isDragging ? 50 : isSelected ? 20 : 10
      }}
    >
      <div className="bg-card border-2 border-border rounded-xl shadow-lg p-4 min-w-48 max-w-64 group">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 ${blockColors[type]} rounded-lg flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-foreground text-sm flex-1">
            {content}
          </span>
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500 capitalize flex items-center gap-2">
          <span>{type} block</span>
          <span className="font-mono">#{id.slice(-4)}</span>
        </div>
      </div>

      {/* Connection Points */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md"></div>
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md"></div>
    </div>
  );
};

export default ProofBlock;