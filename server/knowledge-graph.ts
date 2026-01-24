import OpenAI from "openai";
import { storage } from "./storage";
import type { Entity, Relationship, GraphFact, GraphVisualization } from "@shared/schema";

// Simple fallback NER using regex patterns when LLM is unavailable
async function extractKnowledgeGraphFallback(
  documentId: string,
  content: string
): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  
  // Extract capitalized proper nouns as potential entities
  const properNounPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const matches = content.match(properNounPattern) || [];
  const uniqueNames = [...new Set(matches)].slice(0, 10);
  
  // Simple entity type inference
  const getType = (name: string): string => {
    if (/(?:Inc|Corp|Company|Organization|University|Institute)/i.test(name)) return "organization";
    if (/(?:City|Country|State|Region|Street)/i.test(name)) return "location";
    return "concept";
  };
  
  for (const name of uniqueNames) {
    if (name.length > 2 && name.length < 50) {
      const entity = await storage.createEntity({
        name,
        type: getType(name),
        description: `Extracted from document`,
        documentId,
      });
      entities.push(entity);
    }
  }
  
  // Create simple co-occurrence relationships
  for (let i = 0; i < entities.length - 1; i++) {
    const rel = await storage.createRelationship({
      sourceId: entities[i].id,
      targetId: entities[i + 1].id,
      type: "related_to",
      description: "Co-occurrence in document",
      documentId,
    });
    relationships.push(rel);
  }
  
  return { entities, relationships };
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Extract entities and relationships from document text using LLM
export async function extractKnowledgeGraph(
  documentId: string,
  content: string
): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  // Check if LLM is available - if not, use simple NER fallback
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY || !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    return extractKnowledgeGraphFallback(documentId, content);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are a knowledge extraction expert. Extract entities and relationships from the given text.
Output JSON with this structure:
{
  "entities": [
    {"name": "entity name", "type": "person|organization|location|concept|event|technology", "description": "brief description"}
  ],
  "relationships": [
    {"source": "source entity name", "target": "target entity name", "type": "relationship type", "description": "brief description"}
  ]
}

Extract only the most important entities and relationships. Limit to 10 entities and 10 relationships maximum.
Types of entities: person, organization, location, concept, event, technology
Relationship types: examples include "works_for", "located_in", "created_by", "part_of", "related_to", "causes", "enables", etc.`,
        },
        {
          role: "user",
          content: `Extract entities and relationships from this text:\n\n${content.slice(0, 3000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const entityNameToId = new Map<string, string>();

    // Create entities
    for (const e of result.entities || []) {
      const entity = await storage.createEntity({
        name: e.name,
        type: e.type || "concept",
        description: e.description,
        documentId,
      });
      entities.push(entity);
      entityNameToId.set(e.name.toLowerCase(), entity.id);
    }

    // Create relationships
    for (const r of result.relationships || []) {
      const sourceId = entityNameToId.get(r.source?.toLowerCase());
      const targetId = entityNameToId.get(r.target?.toLowerCase());
      
      if (sourceId && targetId) {
        const relationship = await storage.createRelationship({
          sourceId,
          targetId,
          type: r.type || "related_to",
          description: r.description,
          documentId,
        });
        relationships.push(relationship);
      }
    }

    return { entities, relationships };
  } catch (error) {
    console.error("Error extracting knowledge graph:", error);
    return { entities: [], relationships: [] };
  }
}

// Query knowledge graph for relevant facts
export async function queryKnowledgeGraph(
  query: string,
  entities: Entity[],
  relationships: Relationship[]
): Promise<GraphFact[]> {
  const queryLower = query.toLowerCase();
  const relevantFacts: GraphFact[] = [];

  // Find entities mentioned in the query
  const mentionedEntities = entities.filter((e) =>
    queryLower.includes(e.name.toLowerCase()) ||
    e.name.toLowerCase().split(/\s+/).some((word) => queryLower.includes(word))
  );

  // Get relationships involving mentioned entities
  const entityIds = new Set(mentionedEntities.map((e) => e.id));
  const relevantRels = relationships.filter(
    (r) => entityIds.has(r.sourceId) || entityIds.has(r.targetId)
  );

  // Build facts from relationships
  for (const rel of relevantRels) {
    const sourceEntity = entities.find((e) => e.id === rel.sourceId);
    const targetEntity = entities.find((e) => e.id === rel.targetId);

    if (sourceEntity && targetEntity) {
      relevantFacts.push({
        entity: sourceEntity.name,
        entityType: sourceEntity.type,
        relationship: rel.type,
        relatedEntity: targetEntity.name,
        relatedEntityType: targetEntity.type,
        confidence: 0.8,
      });
    }
  }

  return relevantFacts;
}

// Get full graph visualization data
export async function getGraphVisualization(): Promise<GraphVisualization> {
  const entities = await storage.getAllEntities();
  const relationships = await storage.getAllRelationships();

  // Generate positions in a circular layout
  const centerX = 300;
  const centerY = 200;
  const radius = 150;

  const nodes = entities.map((entity, i) => {
    const angle = (i / entities.length) * 2 * Math.PI;
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      description: entity.description,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      highlighted: false,
    };
  });

  const edges = relationships.map((rel) => ({
    id: rel.id,
    source: rel.sourceId,
    target: rel.targetId,
    type: rel.type,
    highlighted: false,
  }));

  return { nodes, edges };
}

// Get graph with highlighted nodes/edges based on query
export async function getHighlightedGraph(
  query: string,
  facts: GraphFact[]
): Promise<GraphVisualization> {
  const baseGraph = await getGraphVisualization();
  
  // Highlight nodes and edges that appear in facts
  const highlightedEntityNames = new Set<string>();
  for (const fact of facts) {
    highlightedEntityNames.add(fact.entity.toLowerCase());
    highlightedEntityNames.add(fact.relatedEntity.toLowerCase());
  }

  const highlightedNodeIds = new Set<string>();
  
  for (const node of baseGraph.nodes) {
    if (highlightedEntityNames.has(node.name.toLowerCase())) {
      node.highlighted = true;
      highlightedNodeIds.add(node.id);
    }
  }

  for (const edge of baseGraph.edges) {
    if (highlightedNodeIds.has(edge.source) && highlightedNodeIds.has(edge.target)) {
      edge.highlighted = true;
    }
  }

  return baseGraph;
}
