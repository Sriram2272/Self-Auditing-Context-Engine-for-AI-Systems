import { randomUUID } from "crypto";
import type {
  Document,
  Chunk,
  Entity,
  Relationship,
  ChatSession,
  ChatMessage,
  Evidence,
  GraphFact,
  AnswerResponse,
  GraphVisualization,
} from "@shared/schema";

export interface IStorage {
  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByDomain(domain: string): Promise<Document[]>;
  createDocument(doc: Omit<Document, "id" | "uploadedAt">): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // Chunks
  getChunk(id: string): Promise<Chunk | undefined>;
  getChunksByDocument(documentId: string): Promise<Chunk[]>;
  getAllChunks(): Promise<Chunk[]>;
  getChunksByDomain(domain: string): Promise<Chunk[]>;
  createChunk(chunk: Omit<Chunk, "id">): Promise<Chunk>;
  deleteChunksByDocument(documentId: string): Promise<void>;

  // Entities (Knowledge Graph nodes)
  getEntity(id: string): Promise<Entity | undefined>;
  getAllEntities(): Promise<Entity[]>;
  getEntitiesByDocument(documentId: string): Promise<Entity[]>;
  createEntity(entity: Omit<Entity, "id">): Promise<Entity>;
  deleteEntitiesByDocument(documentId: string): Promise<void>;

  // Relationships (Knowledge Graph edges)
  getRelationship(id: string): Promise<Relationship | undefined>;
  getAllRelationships(): Promise<Relationship[]>;
  getRelationshipsByDocument(documentId: string): Promise<Relationship[]>;
  createRelationship(rel: Omit<Relationship, "id">): Promise<Relationship>;
  deleteRelationshipsByDocument(documentId: string): Promise<void>;

  // Chat Sessions
  getSession(id: string): Promise<ChatSession | undefined>;
  getAllSessions(): Promise<ChatSession[]>;
  createSession(session: Omit<ChatSession, "id" | "createdAt" | "messages">): Promise<ChatSession>;
  deleteSession(id: string): Promise<void>;
  addMessageToSession(sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private documents: Map<string, Document> = new Map();
  private chunks: Map<string, Chunk> = new Map();
  private entities: Map<string, Entity> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private sessions: Map<string, ChatSession> = new Map();

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByDomain(domain: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter((d) => d.domain === domain);
  }

  async createDocument(doc: Omit<Document, "id" | "uploadedAt">): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...doc,
      id,
      uploadedAt: new Date().toISOString(),
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
    await this.deleteChunksByDocument(id);
    await this.deleteEntitiesByDocument(id);
    await this.deleteRelationshipsByDocument(id);
  }

  // Chunks
  async getChunk(id: string): Promise<Chunk | undefined> {
    return this.chunks.get(id);
  }

  async getChunksByDocument(documentId: string): Promise<Chunk[]> {
    return Array.from(this.chunks.values()).filter((c) => c.documentId === documentId);
  }

  async getAllChunks(): Promise<Chunk[]> {
    return Array.from(this.chunks.values());
  }

  async getChunksByDomain(domain: string): Promise<Chunk[]> {
    const docs = await this.getDocumentsByDomain(domain);
    const docIds = new Set(docs.map((d) => d.id));
    return Array.from(this.chunks.values()).filter((c) => docIds.has(c.documentId));
  }

  async createChunk(chunk: Omit<Chunk, "id">): Promise<Chunk> {
    const id = randomUUID();
    const newChunk: Chunk = { ...chunk, id };
    this.chunks.set(id, newChunk);
    return newChunk;
  }

  async deleteChunksByDocument(documentId: string): Promise<void> {
    for (const [id, chunk] of this.chunks) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
      }
    }
  }

  // Entities
  async getEntity(id: string): Promise<Entity | undefined> {
    return this.entities.get(id);
  }

  async getAllEntities(): Promise<Entity[]> {
    return Array.from(this.entities.values());
  }

  async getEntitiesByDocument(documentId: string): Promise<Entity[]> {
    return Array.from(this.entities.values()).filter((e) => e.documentId === documentId);
  }

  async createEntity(entity: Omit<Entity, "id">): Promise<Entity> {
    const id = randomUUID();
    const newEntity: Entity = { ...entity, id };
    this.entities.set(id, newEntity);
    return newEntity;
  }

  async deleteEntitiesByDocument(documentId: string): Promise<void> {
    for (const [id, entity] of this.entities) {
      if (entity.documentId === documentId) {
        this.entities.delete(id);
      }
    }
  }

  // Relationships
  async getRelationship(id: string): Promise<Relationship | undefined> {
    return this.relationships.get(id);
  }

  async getAllRelationships(): Promise<Relationship[]> {
    return Array.from(this.relationships.values());
  }

  async getRelationshipsByDocument(documentId: string): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter((r) => r.documentId === documentId);
  }

  async createRelationship(rel: Omit<Relationship, "id">): Promise<Relationship> {
    const id = randomUUID();
    const newRel: Relationship = { ...rel, id };
    this.relationships.set(id, newRel);
    return newRel;
  }

  async deleteRelationshipsByDocument(documentId: string): Promise<void> {
    for (const [id, rel] of this.relationships) {
      if (rel.documentId === documentId) {
        this.relationships.delete(id);
      }
    }
  }

  // Sessions
  async getSession(id: string): Promise<ChatSession | undefined> {
    return this.sessions.get(id);
  }

  async getAllSessions(): Promise<ChatSession[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createSession(session: Omit<ChatSession, "id" | "createdAt" | "messages">): Promise<ChatSession> {
    const id = randomUUID();
    const newSession: ChatSession = {
      ...session,
      id,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async addMessageToSession(
    sessionId: string,
    message: Omit<ChatMessage, "id" | "timestamp">
  ): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const newMessage: ChatMessage = {
      ...message,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    session.messages.push(newMessage);

    // Update session title based on first user message
    if (session.title === "New Conversation" && message.role === "user") {
      session.title = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
    }

    return newMessage;
  }
}

export const storage = new MemStorage();
