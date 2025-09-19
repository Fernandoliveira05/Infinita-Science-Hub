import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Save, Play, Settings, FileText, Image, Video, Mic, BookOpen, Trash2 } from "lucide-react";

interface Block {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'reference';
  content: string;
  position: { x: number; y: number };
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

const Editor = () => {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'text', content: 'Research Introduction', position: { x: 100, y: 100 } },
    { id: '2', type: 'reference', content: 'Literature Review', position: { x: 350, y: 200 } },
    { id: '3', type: 'image', content: 'Experimental Setup', position: { x: 600, y: 150 } },
  ]);
  
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: `New ${type} block`,
      position: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 }
    };
    setBlocks([...blocks, newBlock]);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    setSelectedBlock(null);
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBlock) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setBlocks(blocks.map(block => 
      block.id === draggedBlock 
        ? { ...block, position: { x: x - 50, y: y - 25 } }
        : block
    ));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IS</span>
              </div>
              <span className="font-bold text-xl text-foreground">Research Editor</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button className="btn-ghost flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <Play className="w-4 h-4" />
                Preview
              </button>
              <button className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Research
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Instruction Banner */}
      <div className="bg-primary/5 border-b border-primary/20 px-6 py-4">
        <p className="text-primary">
          <strong>Visual Research Builder:</strong> Build your research as a visual workflow. 
          Connect blocks of text, media, and references to structure your scientific proof. 
          Drag blocks to rearrange the logical flow of your research.
        </p>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Block Palette */}
        <div className="w-80 bg-card border-r border-border p-6">
          <div className="space-y-6">
            {/* Add Blocks */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Add Proof Blocks</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(blockIcons).map(([type, Icon]) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type as Block['type'])}
                    className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className={`w-10 h-10 ${blockColors[type as Block['type']]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Block List */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Block Structure</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {blocks.map((block, index) => {
                  const Icon = blockIcons[block.type];
                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlock(block.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedBlock === block.id 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      } border border-transparent`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-gray-400 font-mono w-6">
                          #{(index + 1).toString().padStart(2, '0')}
                        </span>
                        <div className={`w-8 h-8 ${blockColors[block.type]} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {block.content}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {block.type} block
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(block.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="w-full h-full bg-gray-50 dark:bg-gray-900 relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{ 
              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Canvas Instructions */}
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Start Building Your Research</h3>
                  <p>Add proof blocks from the sidebar to begin structuring your scientific workflow</p>
                </div>
              </div>
            )}

            {/* Render Blocks */}
            {blocks.map((block) => {
              const Icon = blockIcons[block.type];
              const isSelected = selectedBlock === block.id;
              const isDragging = draggedBlock === block.id;

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedBlock(block.id)}
                  className={`absolute cursor-move ${
                    isDragging ? 'dragging' : 'draggable-block'
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  style={{
                    left: block.position.x,
                    top: block.position.y,
                    zIndex: isDragging ? 50 : isSelected ? 20 : 10
                  }}
                >
                  <div className="bg-card border-2 border-border rounded-xl shadow-lg p-4 min-w-48 max-w-64">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 ${blockColors[block.type]} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        {block.content}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 capitalize flex items-center gap-2">
                      <span>{block.type} block</span>
                      <span className="font-mono">#{block.id.slice(-4)}</span>
                    </div>
                  </div>

                  {/* Connection Points */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md"></div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md"></div>
                </div>
              );
            })}

            {/* Connection Lines (simplified visualization) */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
              {blocks.map((block, index) => {
                if (index === blocks.length - 1) return null;
                const nextBlock = blocks[index + 1];
                return (
                  <line
                    key={`${block.id}-${nextBlock.id}`}
                    x1={block.position.x + 96}
                    y1={block.position.y + 60}
                    x2={nextBlock.position.x + 96}
                    y2={nextBlock.position.y}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;