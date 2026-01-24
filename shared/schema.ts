import { z } from "zod";

// Document schema for ingested documents
export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  source: z.string(),
  domain: z.string(),
  uploadedAt: z.string(),
});

export type Document = z.infer<typeof documentSchema>;

// Document chunk schema for RAG
export const chunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentName: z.string(),
  content: z.string(),
  section: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
});

export type Chunk = z.infer<typeof chunkSchema>;

// Knowledge graph entity schema
export const entitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  documentId: z.string(),
});

export type Entity = z.infer<typeof entitySchema>;

// Knowledge graph relationship schema
export const relationshipSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  type: z.string(),
  description: z.string().optional(),
  documentId: z.string(),
});

export type Relationship = z.infer<typeof relationshipSchema>;

// Evidence from document search
export const evidenceSchema = z.object({
  chunkId: z.string(),
  documentName: z.string(),
  section: z.string(),
  content: z.string(),
  highlightedContent: z.string(),
  relevanceScore: z.number(),
  sentenceEvidence: z.array(z.object({
    sentence: z.string(),
    relevance: z.number(),
  })).optional(),
});

export type Evidence = z.infer<typeof evidenceSchema>;

// Knowledge graph fact from query
export const graphFactSchema = z.object({
  entity: z.string(),
  entityType: z.string(),
  relationship: z.string(),
  relatedEntity: z.string(),
  relatedEntityType: z.string(),
  confidence: z.number(),
});

export type GraphFact = z.infer<typeof graphFactSchema>;

// Contradiction detection result
export const contradictionSchema = z.object({
  claim1: z.string(),
  source1: z.string(),
  claim2: z.string(),
  source2: z.string(),
  explanation: z.string(),
});

export type Contradiction = z.infer<typeof contradictionSchema>;

// Multi-hop reasoning step
export const reasoningStepSchema = z.object({
  step: z.number(),
  description: z.string(),
  evidence: z.string(),
  source: z.string(),
});

export type ReasoningStep = z.infer<typeof reasoningStepSchema>;

// Complete answer response
export const answerResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number(),
  evidenceChunks: z.array(evidenceSchema),
  graphFacts: z.array(graphFactSchema),
  reasoningSteps: z.array(reasoningStepSchema).optional(),
  contradictions: z.array(contradictionSchema).optional(),
  sourceCredibility: z.record(z.string(), z.number()).optional(),
  insufficientEvidence: z.boolean().optional(),
});

export type AnswerResponse = z.infer<typeof answerResponseSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
  answerData: answerResponseSchema.optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Chat session schema
export const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  domain: z.string(),
  createdAt: z.string(),
  messages: z.array(chatMessageSchema),
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

// Question request schema
export const questionRequestSchema = z.object({
  question: z.string().min(1),
  domain: z.string(),
  sessionId: z.string().optional(),
  explainabilityMode: z.boolean().default(false),
});

export type QuestionRequest = z.infer<typeof questionRequestSchema>;

// Document upload request
export const uploadRequestSchema = z.object({
  name: z.string(),
  content: z.string(),
  domain: z.string(),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

// Knowledge graph visualization data
export const graphVisualizationSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    highlighted: z.boolean().optional(),
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string(),
    highlighted: z.boolean().optional(),
  })),
});

export type GraphVisualization = z.infer<typeof graphVisualizationSchema>;

// Domain options
export const domains = [
  { value: "general", label: "General Knowledge" },
  { value: "science", label: "Science & Technology" },
  { value: "business", label: "Business & Finance" },
  { value: "medical", label: "Medical & Health" },
  { value: "legal", label: "Legal & Compliance" },
] as const;

export type Domain = typeof domains[number]["value"];
