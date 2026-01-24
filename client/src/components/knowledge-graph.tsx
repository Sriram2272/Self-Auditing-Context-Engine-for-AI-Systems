import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Network, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GraphVisualization, GraphFact } from "@shared/schema";

interface KnowledgeGraphProps {
  graphData: GraphVisualization;
  facts: GraphFact[];
}

interface NodeDetails {
  id: string;
  name: string;
  type: string;
  description?: string;
  connections: { name: string; relationship: string; direction: "in" | "out" }[];
}

const NODE_COLORS: Record<string, string> = {
  person: "#3b82f6",
  organization: "#8b5cf6",
  location: "#10b981",
  concept: "#f59e0b",
  event: "#ef4444",
  technology: "#06b6d4",
  default: "#6b7280",
};

export function KnowledgeGraph({ graphData, facts }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = useMemo(() => {
    if (graphData.nodes.length === 0) return [];
    
    const centerX = 300;
    const centerY = 200;
    const radius = 150;
    
    return graphData.nodes.map((node, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      return {
        ...node,
        x: node.x ?? centerX + radius * Math.cos(angle),
        y: node.y ?? centerY + radius * Math.sin(angle),
      };
    });
  }, [graphData.nodes]);

  const getNodeConnections = useCallback(
    (nodeId: string) => {
      const connections: NodeDetails["connections"] = [];
      graphData.edges.forEach((edge) => {
        if (edge.source === nodeId) {
          const target = nodes.find((n) => n.id === edge.target);
          if (target) {
            connections.push({
              name: target.name,
              relationship: edge.type,
              direction: "out",
            });
          }
        }
        if (edge.target === nodeId) {
          const source = nodes.find((n) => n.id === edge.source);
          if (source) {
            connections.push({
              name: source.name,
              relationship: edge.type,
              direction: "in",
            });
          }
        }
      });
      return connections;
    },
    [graphData.edges, nodes]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;

      const clickedNode = nodes.find((node) => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 30;
      });

      if (clickedNode) {
        setSelectedNode({
          id: clickedNode.id,
          name: clickedNode.name,
          type: clickedNode.type,
          description: clickedNode.description,
          connections: getNodeConnections(clickedNode.id),
        });
      }
    },
    [nodes, offset, zoom, getNodeConnections]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isDragging) {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;

      const hoveredNode = nodes.find((node) => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 30;
      });

      setHoveredNode(hoveredNode?.id || null);
      canvas.style.cursor = hoveredNode ? "pointer" : isDragging ? "grabbing" : "grab";
    },
    [nodes, offset, zoom, isDragging, dragStart]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    },
    [offset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    graphData.edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = edge.highlighted
        ? "hsl(200, 95%, 50%)"
        : hoveredNode === source.id || hoveredNode === target.id
        ? "rgba(255,255,255,0.4)"
        : "rgba(255,255,255,0.15)";
      ctx.lineWidth = edge.highlighted ? 2 : 1;
      ctx.stroke();

      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px Inter";
      ctx.textAlign = "center";
      ctx.fillText(edge.type, midX, midY - 5);
    });

    nodes.forEach((node) => {
      const isHovered = hoveredNode === node.id;
      const isHighlighted = node.highlighted;
      const color = NODE_COLORS[node.type.toLowerCase()] || NODE_COLORS.default;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered ? 28 : 24, 0, Math.PI * 2);
      
      if (isHighlighted || isHovered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      }
      
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = isHovered || isHighlighted ? "#fff" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = isHovered || isHighlighted ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "11px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const displayName = node.name.length > 10 ? node.name.slice(0, 8) + "..." : node.name;
      ctx.fillText(displayName, node.x, node.y);

      ctx.font = "9px Inter";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(node.type, node.x, node.y + 35);
    });

    ctx.restore();
  }, [graphData, nodes, zoom, offset, hoveredNode]);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  if (graphData.nodes.length === 0) {
    return (
      <Card className="border-card-border">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <Network className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No knowledge graph data</p>
            <p className="text-xs">Upload documents to build the graph</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="animated-border animated-border-subtle" data-testid="panel-knowledge-graph">
        <Card className="border-0 glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4 text-primary pulse-glow" />
                <span className="gradient-text">Knowledge Graph</span>
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="hover-glow" data-testid="button-zoom-out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="hover-glow" data-testid="button-zoom-in">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleReset} className="hover-glow" data-testid="button-reset-view">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className="relative rounded-lg glass-subtle border border-primary/20 overflow-hidden neon-glow"
              style={{ height: "400px" }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-move"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                data-testid="canvas-knowledge-graph"
              />
            
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  type !== "default" && (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-xs capitalize glass-subtle hover-glow"
                      style={{ borderColor: color, color }}
                    >
                      {type}
                    </Badge>
                  )
                ))}
              </div>
            </div>

            {facts.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="gradient-text">Extracted Facts ({facts.length})</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {facts.slice(0, 5).map((fact, i) => (
                    <div
                      key={i}
                      className="text-xs glass-subtle rounded-lg p-2 flex items-center gap-2 hover-border-glow transition-all"
                      data-testid={`text-fact-${i}`}
                    >
                      <Badge variant="outline" className="text-xs shrink-0 border-dance">
                        {fact.entityType}
                      </Badge>
                      <span className="font-medium gradient-text">{fact.entity}</span>
                      <span className="text-muted-foreground">{fact.relationship}</span>
                      <span className="font-medium">{fact.relatedEntity}</span>
                      <Badge variant="secondary" className="ml-auto text-xs neon-glow">
                        {Math.round(fact.confidence * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent data-testid="dialog-node-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor:
                    NODE_COLORS[selectedNode?.type.toLowerCase() || "default"] ||
                    NODE_COLORS.default,
                }}
              />
              {selectedNode?.name}
            </DialogTitle>
            <DialogDescription>
              <Badge variant="secondary" className="mt-1">
                {selectedNode?.type}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNode?.description && (
              <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
            )}
            {selectedNode?.connections && selectedNode.connections.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Connections</div>
                <div className="space-y-1">
                  {selectedNode.connections.map((conn, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      {conn.direction === "out" ? (
                        <>
                          <span className="text-primary">{conn.relationship}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{conn.name}</span>
                        </>
                      ) : (
                        <>
                          <span>{conn.name}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary">{conn.relationship}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
