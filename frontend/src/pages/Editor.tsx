import React, { useCallback, useEffect, useState } from "react";
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
import { Plus, Save, Play, X } from "lucide-react";
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
const api = axios.create({ baseURL: "http://127.0.0.1:8000/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const Editor = () => {
  const params = useParams<{ repoId: string }>();
  const [repoId, setRepoId] = useState<string | null>(params.repoId || null);

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
    updateBlockPosition,
  } = useEditorStore();

  // repo info
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");

  // Intro modal
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(INTRO_KEY)) setShowIntro(true);
  }, []);
  const dismissIntro = (dontShowAgain: boolean) => {
    if (dontShowAgain) localStorage.setItem(INTRO_KEY, "1");
    setShowIntro(false);
  };

  // ReactFlow state
  const reactFlowNodes: Node[] = blocks.map((block) => ({
    id: block.id, // id DO BACKEND após hidratação
    type: "proofBlock",
    position: block.position || { x: 100, y: 100 },
    data: block as Record<string, unknown>,
    selected: selectedBlockId === block.id,
  }));

  const reactFlowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    animated: true,
    style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  useEffect(() => setNodes(reactFlowNodes), [blocks, selectedBlockId, setNodes]);
  useEffect(() => setEdges(reactFlowEdges), [edges, setEdges]);

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
      // (Opcional) persistir edges no back aqui se tiver endpoint
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

  // Persistir posição SOMENTE quando soltar o nó
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      changes.forEach(async (c) => {
        if (c.type === "position" && c.position && c.id) {
          updateBlockPosition(c.id, c.position);

          // @ts-expect-error dragging existe em runtime
          const dragging = c.dragging as boolean | undefined;
          if (dragging === false || dragging === undefined) {
            try {
              await api.put(`/blocks/${c.id}`, { position: c.position });
            } catch (err) {
              console.error("Erro ao salvar posição do bloco:", err);
            }
          }
        }
      });
    },
    [onNodesChange, updateBlockPosition]
  );

  // ---------------------------
  // Backend Integration helpers
  // ---------------------------

  const loadBlocksFromApi = useCallback(async (rId: string) => {
    const res = await api.get(`/blocks/repo/${rId}`);
    clearAll();
    // IMPORTANTE: Hidratar store com os dados 1:1 do backend (incluindo id do backend!)
    res.data.forEach((block: any) => {
      addBlock(block.type, block.position || { x: 100, y: 100 }, undefined, block);
    });
    return res.data as any[];
  }, [clearAll, addBlock]);

  // Carregar repo + blocos
  useEffect(() => {
    if (!repoId) return;

    api
      .get(`/repos/${repoId}`)
      .then((res) => {
        setRepoName(res.data.name || "");
        setRepoDescription(res.data.description || "");
      })
      .catch((err) => console.error("Erro ao carregar repo:", err));

    loadBlocksFromApi(repoId).catch((err) =>
      console.error("Erro ao carregar blocos:", err)
    );
  }, [repoId, loadBlocksFromApi]);

  const handleAddBlock = async (type: BlockType) => {
    if (!repoId) {
      alert("You need to save the repository first!");
      return;
    }
    const pos = { x: 200, y: 200 };
    try {
      const res = await api.post("/blocks", {
        repo_id: repoId,
        type,
        title: "",
        description: "",
        position: pos,
      });

      // Após criar, **rehidrata** para garantir que o ID da store é o do backend
      await loadBlocksFromApi(repoId);

      // Seleciona o recém-criado
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
        position: block.position,
      });
      alert(`Block saved and sent to AI audit!`);
    } catch (err) {
      console.error("Erro ao salvar bloco:", err);
    }
  };

  const handleSaveRepository = async () => {
    try {
      if (!repoId) {
        // Primeiro save => cria repo
        const res = await api.post("/repos", {
          name: repoName || "Untitled Repository",
          description: repoDescription || "",
          visibility: "public",
        });
        setRepoId(res.data.id); // mantém na mesma página
        // nada de reload/redirect
      } else {
        // Updates subsequentes
        await api.put(`/repos/${repoId}`, {
          name: repoName,
          description: repoDescription,
        });
      }
    } catch (err) {
      console.error("Erro ao salvar repositório:", err);
    }
  };

  const handleSubmitFinalReview = async () => {
    if (!repoId) return;
    try {
      const res = await api.post(`/audits/repos/${repoId}/submit-final-review`);
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
      <RepoHeader
        repoName={repoName}
        setRepoName={setRepoName}
        repoDescription={repoDescription}
        setRepoDescription={setRepoDescription}
      />

      <FirstTimeHelp />

      {/* Toolbar */}
      <div className="flex gap-4 px-6 py-3 border-b border-border bg-card">
        <Button
          onClick={handleSaveRepository}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {repoId ? "Update Repository" : "Save Repository"}
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
                  <div
                    className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}
                  >
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
