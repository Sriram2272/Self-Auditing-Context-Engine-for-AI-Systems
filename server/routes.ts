import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processDocument } from "./rag-pipeline";
import { extractKnowledgeGraph, getGraphVisualization } from "./knowledge-graph";
import { processQuestion } from "./answer-engine";
import { questionRequestSchema, uploadRequestSchema } from "@shared/schema";
import {
  appendToCSV,
  getNextQueryId,
  getISTTimestamp,
  determineReasoningType,
  determineEvidenceStrength,
  determineHallucinationRisk,
  generateAnswerSummary,
  generateAuditExplanation,
  type CSVLogEntry,
} from "./csv-logger";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all chat sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Get a specific session
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Create a new session
  app.post("/api/sessions", async (req, res) => {
    try {
      const { domain = "general" } = req.body;
      const session = await storage.createSession({
        title: "New Conversation",
        domain,
      });
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Delete a session
  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      await storage.deleteSession(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Ask a question
  app.post("/api/ask", async (req, res) => {
    const startTime = Date.now();
    try {
      const parsed = questionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error });
      }

      const { question, domain, sessionId, explainabilityMode } = parsed.data;

      // Add user message to session
      if (sessionId) {
        await storage.addMessageToSession(sessionId, {
          role: "user",
          content: question,
        });
      }

      // Process the question
      const { answer, graphData } = await processQuestion(question, domain, explainabilityMode);

      // Calculate response time
      const responseTimeMs = Date.now() - startTime;

      // Log to CSV for hackathon evaluation
      try {
        const evidenceTexts = answer.evidenceChunks?.map((e) => e.content.substring(0, 100)) || [];
        const allChunks = domain 
          ? await storage.getChunksByDomain(domain)
          : await storage.getAllChunks();
        const usedChunkIds = new Set(answer.evidenceChunks?.map((e) => e.chunkId) || []);
        const excludedContexts = allChunks
          .filter((c) => !usedChunkIds.has(c.id))
          .map((c) => c.content.substring(0, 50));

        const csvEntry: CSVLogEntry = {
          queryId: getNextQueryId(),
          timestamp: getISTTimestamp(),
          queryText: question,
          finalAnswer: answer.answer,
          answerSummary: generateAnswerSummary(answer.answer),
          contextUsed: evidenceTexts,
          contextExcluded: excludedContexts.slice(0, 5),
          numContextsUsed: answer.evidenceChunks?.length || 0,
          auditExplanation: generateAuditExplanation(
            answer.evidenceChunks?.length || 0,
            answer.confidence,
            (answer.contradictions?.length || 0) > 0
          ),
          reasoningType: determineReasoningType(answer.reasoningSteps),
          evidenceStrength: determineEvidenceStrength(
            answer.confidence,
            answer.evidenceChunks?.length || 0
          ),
          hallucinationRisk: determineHallucinationRisk(
            answer.confidence,
            answer.evidenceChunks?.length || 0
          ),
          confidenceScore: answer.confidence,
          responseTimeMs,
          modelName: "gpt-4.1-mini",
          version: "v1.0",
        };

        appendToCSV(csvEntry);
      } catch (csvError) {
        console.error("Error logging to CSV:", csvError);
      }

      // Add assistant message to session
      if (sessionId) {
        await storage.addMessageToSession(sessionId, {
          role: "assistant",
          content: answer.answer,
          answerData: answer,
        });
      }

      res.json({ answer, graphData });
    } catch (error) {
      console.error("Error processing question:", error);
      res.status(500).json({ error: "Failed to process question" });
    }
  });

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Upload a document
  app.post("/api/documents", async (req, res) => {
    try {
      const parsed = uploadRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error });
      }

      const { name, content, domain } = parsed.data;

      // Process document for RAG
      const document = await processDocument(name, content, domain);

      // Extract knowledge graph
      await extractKnowledgeGraph(document.id, content);

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Delete a document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Get knowledge graph data
  app.get("/api/graph", async (req, res) => {
    try {
      const graphData = await getGraphVisualization();
      res.json(graphData);
    } catch (error) {
      console.error("Error fetching graph:", error);
      res.status(500).json({ error: "Failed to fetch graph" });
    }
  });

  return httpServer;
}
