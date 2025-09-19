import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ConnectionMode,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, Play, Settings, FileText, Image, Video, Mic, BookOpen, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editorStore';
import { ProofNode } from '@/components/editor/ProofNode';
import { BlockDetailsDrawer } from '@/components/editor/BlockDetailsDrawer';
import { BlockType } from '@/types/editor';
import { showSuccessToast } from '@/components/ui/toast-feedback';

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

const nodeTypes = {
  proofBlock: ProofNode,
};

const Editor = () => {
  const { 
    blocks, 
    edges, 
    addBlock, 
    addEdge: addStoreEdge, 
    removeEdge, 
    selectBlock, 
    openDrawer,
    getOrderedBlocks,
    selectedBlockId
  } = useEditorStore();

  // Convert store data to React Flow format
  const reactFlowNodes: Node[] = blocks.map(block => ({
    id: block.id,
    type: 'proofBlock',
    position: block.position,
    data: block as Record<string, unknown>,
    selected: selectedBlockId === block.id,
  }));

  const reactFlowEdges: Edge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Update React Flow when store changes
  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [blocks, selectedBlockId]);

  React.useEffect(() => {
    setEdges(reactFlowEdges);
  }, [edges]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      const newEdge = {
        id: `e${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
      };
      addStoreEdge(newEdge);
    }
  }, [addStoreEdge]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectBlock(node.id);
  }, [selectBlock]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    openDrawer(node.id);
  }, [openDrawer]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    removeEdge(edge.id);
  }, [removeEdge]);

  const handleAddBlock = (type: BlockType) => {
    // Calculate position based on viewport center
    const rect = document.querySelector('.react-flow')?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 400;
    const centerY = rect ? rect.height / 2 : 300;
    
    addBlock(type, { 
      x: centerX + Math.random() * 100 - 50, 
      y: centerY + Math.random() * 100 - 50 
    });
  };

  const orderedBlocks = getOrderedBlocks();

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
        {/* Sidebar - Block Palette & Ordered List */}
        <div className="w-80 bg-card border-r border-border p-6">
          <div className="space-y-6">
            {/* Add Blocks */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Add Proof Blocks</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(blockIcons).map(([type, Icon]) => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => handleAddBlock(type as BlockType)}
                    className="flex flex-col items-center gap-2 h-auto p-4 hover:scale-105 transition-transform group"
                  >
                    <div className={`w-10 h-10 ${blockColors[type as BlockType]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground capitalize">{type}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Ordered Block Structure */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Ordered Blocks
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({orderedBlocks.length})
                </span>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orderedBlocks.map((block, index) => {
                  const Icon = blockIcons[block.type];
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <div
                      key={block.id}
                      onClick={() => selectBlock(block.id)}
                      onDoubleClick={() => openDrawer(block.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'hover:bg-muted'
                      } border border-transparent`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-muted-foreground font-mono w-6">
                          #{(index + 1).toString().padStart(2, '0')}
                        </span>
                        <div className={`w-8 h-8 ${blockColors[block.type]} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {block.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {block.type} • {block.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {orderedBlocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No blocks yet</p>
                    <p className="text-xs">Add blocks to start building</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas - React Flow */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView={true}
            className="bg-background"
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
          >
            <Background 
              color="hsl(var(--muted-foreground))" 
              gap={20} 
              size={1}
              variant={BackgroundVariant.Dots}
            />
            <Controls 
              showZoom={true}
              showFitView={true}
              showInteractive={true}
              className="bg-card border border-border rounded-lg shadow-lg"
            />
            <MiniMap 
              nodeColor="hsl(var(--primary))"
              maskColor="hsl(var(--muted) / 0.8)"
              className="bg-card border border-border rounded-lg"
              pannable
              zoomable
            />
          </ReactFlow>

          {/* Canvas Instructions */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-xl font-semibold mb-2">Start Building Your Research</h3>
                <p>Add proof blocks from the sidebar to begin structuring your scientific workflow</p>
              </div>
            </div>
          )}
        </div>

        {/* Block Details Drawer */}
        <BlockDetailsDrawer />
      </div>
    </div>
  );
};

export default Editor;