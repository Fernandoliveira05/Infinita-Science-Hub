// src/pages/Editor.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "../components/layouts/Navbar";
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
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Save, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { ProofNode } from "@/components/editor/ProofNode";
import { BlockDetailsDrawer } from "@/components/editor/BlockDetailsDrawer";
import { BlockType } from "@/types/editor";
import { RepoHeader } from "@/components/editor/RepoHeader";
import { FirstTimeHelp } from "@/components/editor/FirstTimeHelp";
import { CiTextAlignCenter } from "react-icons/ci";
import { FaImages } from "react-icons/fa";
import { FaVideo } from "react-icons/fa6";
import { MdAudiotrack } from "react-icons/md";
import { VscReferences } from "react-icons/vsc";
import axios from "axios";
import { useRepoStore } from "@/stores/repoStore";

const nodeTypes = { proofBlock: ProofNode };
const INTRO_KEY = "ishub_seen_intro_v1";

const blockPaletteIcons: Record<
  BlockType,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  text: CiTextAlignCenter,
  image: FaImages,
  video: FaVideo,
  audio: MdAudiotrack,
  reference: VscReferences,
};
const blockPaletteColors: Record<BlockType, string> = {
  text: "bg-blue-500",
  image: "bg-green-500",
  video: "bg-purple-500",
  audio: "bg-orange-500",
  reference: "bg-pink-500",
};

// axios client com token
const api = axios.create({ baseURL: "http://localhost:55403/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// layout efêmero horizontal
const START_X = 80;
const START_Y = 160;
const H_SPACING = 360; // distância entre cards

const Editor = () => {
  const params = useParams<{ repoId: string }>();
  const [repoId, setRepoId] = useState<string | null>(params.repoId || null);

  // repo store (RepoHeader lê daqui)
  const repoStore = useRepoStore();
  const repoStoreAny = repoStore as any;

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
  } = useEditorStore();

  // Intro modal
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(INTRO_KEY)) setShowIntro(true);
  }, []);
  const dismissIntro = (dontShowAgain: boolean) => {
    if (dontShowAgain) localStorage.setItem(INTRO_KEY, "1");
    setShowIntro(false);
  };

  // =========== POSIÇÃO SOMENTE EM MEMÓRIA ===========
  const autoLayoutPosRef = useRef<Record<string, { x: number; y: number }>>({});
  const sessionPosRef = useRef<Record<string, { x: number; y: number }>>({});

  const computeInlinePositions = useCallback(() => {
    const ordered = getOrderedBlocks();
    const next: Record<string, { x: number; y: number }> = {};
    let x = START_X;
    const y = START_Y;
    for (const b of ordered) {
      next[b.id] = { x, y };
      x += H_SPACING;
    }
    autoLayoutPosRef.current = next;
  }, [getOrderedBlocks]);

  const ensureSequentialEdges = useCallback(() => {
    const ordered = getOrderedBlocks();
    if (ordered.length < 2) return;
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i];
      const b = ordered[i + 1];
      const id = `e${a.id}-${b.id}`;
      const exists =
        edges.some(
          (e) => e.id === id || (e.source === a.id && e.target === b.id)
        );
      if (!exists) {
        addStoreEdge({ id, source: a.id, target: b.id });
      }
    }
  }, [edges, addStoreEdge, getOrderedBlocks]);

  const reactFlowNodes: Node[] = useMemo(
    () =>
      blocks.map((block) => ({
        id: block.id,
        type: "proofBlock",
        position:
          sessionPosRef.current[block.id] ||
          autoLayoutPosRef.current[block.id] || { x: START_X, y: START_Y },
        data: block as Record<string, unknown>,
        selected: selectedBlockId === block.id,
      })),
    [blocks, selectedBlockId]
  );

  const reactFlowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      })),
    [edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  useEffect(() => setNodes(reactFlowNodes), [reactFlowNodes, setNodes]);
  useEffect(() => setEdges(reactFlowEdges), [reactFlowEdges, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;
      const id = `e${connection.source}-${connection.target}`;
      if (
        edges.some(
          (e) =>
            e.id === id ||
            (e.source === connection.source && e.target === connection.target)
        )
      )
        return;
      addStoreEdge({ id, source: connection.source, target: connection.target });
    },
    [addStoreEdge, edges]
  );

  const onNodeClick = useCallback(
    (_, node: Node) => selectBlock(node.id),
    [selectBlock]
  );
  const onNodeDoubleClick = useCallback(
    (_, node: Node) => openDrawer(node.id),
    [openDrawer]
  );
  const onEdgeClick = useCallback(
    (_, edge: Edge) => removeEdge(edge.id),
    [removeEdge]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach((c) => {
        if (c.type === "position" && c.position && c.id) {
          sessionPosRef.current[c.id] = { x: c.position.x, y: c.position.y };
        }
      });
    },
    [onNodesChange]
  );

  // ---------------------------
  // Backend helpers
  // ---------------------------
  const loadBlocksFromApi = useCallback(
    async (rId: string) => {
      const res = await api.get(`/blocks/repo/${rId}`);
      clearAll();

      // Hidrata SEM posição do backend
      res.data.forEach((block: any) => {
        const clone = { ...block };
        delete clone.position;
        addBlock(clone.type, undefined, undefined, clone);
      });

      // reseta layout efêmero
      sessionPosRef.current = {};
      computeInlinePositions();
      ensureSequentialEdges();

      return res.data as any[];
    },
    [clearAll, addBlock, computeInlinePositions, ensureSequentialEdges]
  );

  // Carregar repo + blocos e **SINCRONIZAR COM o repoStore**
  useEffect(() => {
    const id = params.repoId || repoId || (repoStore as any)?.repo?.id;
    if (!id) return;

    api
      .get(`/repos/${id}`)
      .then((res) => {
        const r = res.data;
        setRepoId(r.id);

        // ---- MUITO IMPORTANTE: popular o store que o RepoHeader usa ----
        if (typeof repoStoreAny.setRepo === "function") {
          repoStoreAny.setRepo(r);
        } else {
          if (typeof repoStoreAny.setId === "function") repoStoreAny.setId(r.id);
          if (typeof repoStoreAny.setName === "function") repoStoreAny.setName(r.name || "");
          if (typeof repoStoreAny.setDescription === "function")
            repoStoreAny.setDescription(r.description || "");
          if (typeof repoStoreAny.setVisibility === "function")
            repoStoreAny.setVisibility(r.visibility || "public");
        }
      })
      .catch((err) => console.error("Erro ao carregar repo:", err));

    loadBlocksFromApi(id).catch((err) =>
      console.error("Erro ao carregar blocos:", err)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.repoId]);

  const effectiveRepoId =
    repoId || (repoStore as any)?.repo?.id || null;

  const handleAddBlock = async (type: BlockType) => {
    if (!effectiveRepoId) {
      alert("You need to save the repository first!");
      return;
    }
    try {
      const res = await api.post("/blocks", {
        repo_id: effectiveRepoId,
        type,
        title: "",
        description: "",
      });

      await loadBlocksFromApi(effectiveRepoId);

      const newId = res.data.id;
      selectBlock(newId);
      openDrawer(newId);
    } catch (err) {
      console.error("Erro ao criar bloco:", err);
    }
  };

  const handleSaveBlock = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    try {
      await api.put(`/blocks/${blockId}`, {
        title: block.title,
        description: block.description,
        content: block.content,
      });
      alert(`Block saved and sent to AI audit!`);
    } catch (err) {
      console.error("Erro ao salvar bloco:", err);
    }
  };

  const handleSaveRepository = async () => {
    try {
      if (!effectiveRepoId) {
        const res = await api.post("/repos", {
          name: repoStoreAny?.repo?.name || "Untitled Repository",
          description: repoStoreAny?.repo?.description || "",
          visibility: repoStoreAny?.repo?.visibility || "public",
        });
        setRepoId(res.data.id);
        if (typeof repoStoreAny.setRepo === "function") repoStoreAny.setRepo(res.data);
      } else {
        const res = await api.put(`/repos/${effectiveRepoId}`, {
          name: repoStoreAny?.repo?.name,
          description: repoStoreAny?.repo?.description,
        });
        if (typeof repoStoreAny.setRepo === "function") repoStoreAny.setRepo(res.data);
      }
    } catch (err) {
      console.error("Erro ao salvar repositório:", err);
    }
  };

  const handleSubmitFinalReview = async () => {
    if (!effectiveRepoId) return;
    try {
      const res = await api.post(
        `/audits/repos/${effectiveRepoId}/submit-final-review`
      );
      alert(`Final review submitted. Audits: ${res.data.audit_count}`);
    } catch (err) {
      console.error("Erro ao submeter revisão final:", err);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  const orderedBlocks = getOrderedBlocks();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* RepoHeader lê do useRepoStore; agora store é preenchido ao carregar */}
      <RepoHeader onSaved={(id) => setRepoId(id)} />

      <FirstTimeHelp />

      {/* Toolbar */}
      <div className="flex gap-4 px-6 py-3 border-b border-border bg-card">
        <Button
          onClick={handleSaveRepository}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {effectiveRepoId ? "Update Repository" : "Save Repository"}
        </Button>

        {selectedBlockId && (
          <Button
            onClick={() => handleSaveBlock(selectedBlockId)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Block
          </Button>
        )}

        <Button
          onClick={handleSubmitFinalReview}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" /> Submit Final Review
        </Button>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-card border-r border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Add Proof Blocks</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.keys(blockPaletteIcons) as BlockType[]).map((type) => {
              const Icon = blockPaletteIcons[type];
              const color = blockPaletteColors[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => handleAddBlock(type)}
                  className="flex flex-col items-center gap-2 h-auto p-4"
                >
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white" size={18} />
                  </div>
                  <span className="text-sm capitalize">{type}</span>
                </Button>
              );
            })}
          </div>

          {/* Ordered Blocks */}
          <h3 className="text-lg font-semibold mb-4">
            Ordered Blocks
            <span className="ml-2 text-sm text-muted-foreground">
              ({orderedBlocks.length})
            </span>
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orderedBlocks.map((block, index) => (
              <div
                key={block.id}
                onClick={() => selectBlock(block.id)}
                onDoubleClick={() => openDrawer(block.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                  selectedBlockId === block.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted"
                }`}
              >
                <span className="text-sm font-mono w-6 text-muted-foreground">
                  #{(index + 1).toString().padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {block.title || "Untitled Block"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {block.type} • {block.status}
                  </p>
                </div>
              </div>
            ))}
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
          >
            <Background
              color="hsl(var(--muted-foreground))"
              gap={20}
              size={1}
              variant={BackgroundVariant.Dots}
            />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <BlockDetailsDrawer />
      </div>

      {/* Intro Modal */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-[92vw] p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold">Welcome to Infinita Hub</h3>
              <button onClick={() => dismissIntro(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Build your research visually with Proof Blocks.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => dismissIntro(false)}>Got it</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
