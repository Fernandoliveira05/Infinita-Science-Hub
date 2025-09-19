import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {Navbar} from "../components/layouts/Navbar"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeChange,
  ConnectionMode,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, Play, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editorStore';
import { ProofNode } from '@/components/editor/ProofNode';
import { BlockDetailsDrawer } from '@/components/editor/BlockDetailsDrawer';
import { BlockType } from '@/types/editor';
import { RepoHeader } from '@/components/editor/RepoHeader';
import { FirstTimeHelp } from '@/components/editor/FirstTimeHelp';
import { CiTextAlignCenter } from 'react-icons/ci';
import { FaImages } from 'react-icons/fa';
import { FaVideo } from 'react-icons/fa6';
import { MdAudiotrack } from 'react-icons/md';
import { VscReferences } from 'react-icons/vsc';

const nodeTypes = {
  proofBlock: ProofNode,
};

const INTRO_KEY = 'ishub_seen_intro_v1';

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
    selectedBlockId,
    clearAll,
    updateBlockPosition
  } = useEditorStore();

  // Intro modal state persisted in localStorage
  const [showIntro, setShowIntro] = useState<boolean>(false);
  useEffect(() => {
    const seen = localStorage.getItem(INTRO_KEY);
    if (!seen) setShowIntro(true);
  }, []);
  const dismissIntro = (dontShowAgain: boolean) => {
    if (dontShowAgain) localStorage.setItem(INTRO_KEY, '1');
    setShowIntro(false);
  };

  // Mapa de ícones e cores para a paleta lateral
const blockPaletteIcons: Record<BlockType, React.ComponentType<{ className?: string; size?: number }>> = {
  text: CiTextAlignCenter,
  image: FaImages,
  video: FaVideo,
  audio: MdAudiotrack,
  reference: VscReferences,
};
const blockPaletteColors: Record<BlockType, string> = {
  text: 'bg-blue-500',
  image: 'bg-green-500',
  video: 'bg-purple-500',
  audio: 'bg-orange-500',
  reference: 'bg-pink-500',
};

  // store -> reactflow nodes
  const reactFlowNodes: Node[] = blocks.map((block) => ({
    id: block.id,
    type: 'proofBlock',
    position: block.position,
    data: block as Record<string, unknown>,
    selected: selectedBlockId === block.id,
  }));

  // store -> reactflow edges
  const reactFlowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  useEffect(() => { setNodes(reactFlowNodes); }, [blocks, selectedBlockId, setNodes]);
  useEffect(() => { setEdges(reactFlowEdges); }, [edges, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    const id = `e${connection.source}-${connection.target}`;
    if (edges.some((e) => e.id === id || (e.source === connection.source && e.target === connection.target))) return;
    addStoreEdge({ id, source: connection.source, target: connection.target });
  }, [addStoreEdge, edges]);

  const onNodeClick = useCallback((_, node: Node) => {
    selectBlock(node.id);
  }, [selectBlock]);

  const onNodeDoubleClick = useCallback((_, node: Node) => {
    openDrawer(node.id);
  }, [openDrawer]);

  const onEdgeClick = useCallback((_, edge: Edge) => {
    removeEdge(edge.id);
  }, [removeEdge]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    changes.forEach((c) => {
      if (c.type === 'position' && c.position && c.id) {
        updateBlockPosition(c.id, c.position);
      }
    });
  }, [onNodesChange, updateBlockPosition]);

  // Add and auto-connect
  const getOrdered = useCallback(() => getOrderedBlocks(), [getOrderedBlocks]);

  const handleAddBlock = (type: BlockType) => {
    const ordered = getOrdered();
    const parentId = selectedBlockId ?? (ordered.length ? ordered[ordered.length - 1].id : undefined);
    const parent = blocks.find((b) => b.id === parentId);

    const rect = document.querySelector('.react-flow')?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 400;
    const centerY = rect ? rect.height / 2 : 300;

    const pos = parent
      ? { x: parent.position.x + 260, y: parent.position.y }
      : { x: centerX - 100, y: centerY - 30 };

    const id = addBlock(type, pos, parentId);
    selectBlock(id);
    openDrawer(id);
  };

  // Starter template for first-time users (optional)
  const addStarterTemplate = () => {
    // Clear only if empty, to avoid messing up existing work
    if (blocks.length > 0) return;

    const idIntro = addBlock('text', { x: 100, y: 200 }, undefined);
    // Give the user a hint by pre-filling common titles; editing still required
    // (mantemos sem conteúdo para respeitar sua regra de título obrigatório via drawer)
    const idMethod = addBlock('image', { x: 360, y: 200 }, idIntro);
    const idResult = addBlock('reference', { x: 620, y: 200 }, idMethod);

    // Open the first block for immediate editing
    selectBlock(idIntro);
    openDrawer(idIntro);
  };

  const orderedBlocks = getOrdered();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Repo options (GitHub-like) */}
      <RepoHeader />

      {/* Instruction Banner (simple, high-contrast, readable) */}
      {/* <div className="bg-primary/5 border-b border-primary/20 px-6 py-4">
        <p className="text-primary text-sm md:text-base">
          <strong>Visual Research Builder:</strong> Add a block from the left, then edit its Title and Description. New blocks auto-connect; use the handles to adjust the order. The “Ordered Blocks” list reflects your publishing sequence.
        </p>
      </div> */}

      {/* First-time help (collapsible) */}
      <FirstTimeHelp defaultOpen onAddStarterTemplate={addStarterTemplate} />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-card border-r border-border p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Add Proof Blocks</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['text', 'image', 'video', 'audio', 'reference'] as BlockType[]).map((type) => {
                  const Icon = blockPaletteIcons[type];
                  const color = blockPaletteColors[type];
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => handleAddBlock(type)}
                      className="flex flex-col items-center gap-2 h-auto p-4 hover:scale-105 transition-transform group"
                    >
                      <div
                        className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        {/* react-icons usa currentColor; definimos texto branco */}
                        <Icon className="text-white" size={18} />
                      </div>
                      <span className="text-sm font-medium text-foreground capitalize">{type}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Ordered Blocks
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({orderedBlocks.length})
                </span>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto" aria-label="Ordered block list">
                {orderedBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    onClick={() => selectBlock(block.id)}
                    onDoubleClick={() => openDrawer(block.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedBlockId === block.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'
                    } border border-transparent`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${block.title || 'Untitled Block'}`}
                    onKeyDown={(e) => { if (e.key === 'Enter') openDrawer(block.id); }}
                  >
                    <span className="text-sm text-muted-foreground font-mono w-6" aria-hidden>
                      #{(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {block.title || 'Untitled Block'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {block.type} • {block.status}
                      </p>
                    </div>
                  </div>
                ))}

                {orderedBlocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No blocks yet</p>
                    <p className="text-xs">Click one of the buttons above to add your first block</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={flowEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="react-flow bg-background"
            nodesDraggable
            nodesConnectable
            elementsSelectable
          >
            <Background
              color="hsl(var(--muted-foreground))"
              gap={20}
              size={1}
              variant={BackgroundVariant.Dots}
            />
            <Controls
              showZoom
              showFitView
              showInteractive
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
                <p>Add your first Proof Block on the left; blocks auto-connect to guide your flow.</p>
              </div>
            </div>
          )}
        </div>

        <BlockDetailsDrawer />
      </div>

      {/* Intro Modal for first-time users */}
      {showIntro && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-[92vw] p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">Welcome to Infinita Science Hub</h3>
              <button aria-label="Close" onClick={() => dismissIntro(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This workspace lets you build your research as a visual workflow. Each “Proof Block” represents a step:
                hypothesis, method, data, results or references.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Add</strong> blocks from the left panel.</li>
                <li><strong>Edit</strong> a block by double-clicking it to set Title, Description and content.</li>
                <li><strong>Connect</strong> blocks to define the order; new blocks auto-connect for you.</li>
                <li><strong>Review</strong> the path in “Ordered Blocks” before saving or publishing.</li>
              </ul>
              <p>You can reopen this guide anytime in the help section below the banner.</p>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) localStorage.setItem(INTRO_KEY, '1');
                    else localStorage.removeItem(INTRO_KEY);
                  }}
                />
                Don’t show this again
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => dismissIntro(false)}>Got it</Button>
                <Button onClick={() => { dismissIntro(true); addStarterTemplate(); }}>Add Starter Template</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
