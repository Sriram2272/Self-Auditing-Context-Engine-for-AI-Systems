import OpenAI from "openai";
import { searchChunks, calculateCredibility } from "./rag-pipeline";
import { queryKnowledgeGraph, getHighlightedGraph } from "./knowledge-graph";
import { storage } from "./storage";
import type {
  Evidence,
  GraphFact,
  AnswerResponse,
  ReasoningStep,
  Contradiction,
  GraphVisualization,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Detect contradictions between evidence sources
async function detectContradictions(
  evidence: Evidence[],
  question: string
): Promise<Contradiction[]> {
  if (evidence.length < 2) return [];

  // Check if LLM is available
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY || !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    return [];
  }

  try {
    const evidenceTexts = evidence.map(
      (e) => `[${e.documentName}]: ${e.content}`
    ).join("\n\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are an expert at detecting contradictions and inconsistencies between sources.
Analyze the evidence and identify any contradicting claims. Output JSON:
{
  "contradictions": [
    {
      "claim1": "first claim",
      "source1": "source name",
      "claim2": "contradicting claim",
      "source2": "source name",
      "explanation": "brief explanation of the contradiction"
    }
  ]
}
If no contradictions exist, return {"contradictions": []}`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nEvidence:\n${evidenceTexts}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    return result.contradictions || [];
  } catch (error) {
    console.error("Error detecting contradictions:", error);
    return [];
  }
}

// Generate multi-hop reasoning explanation
async function generateReasoningSteps(
  question: string,
  evidence: Evidence[],
  facts: GraphFact[]
): Promise<ReasoningStep[]> {
  if (evidence.length === 0 && facts.length === 0) return [];

  // Check if LLM is available
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY || !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    // Return basic reasoning steps from evidence
    return evidence.slice(0, 3).map((e, i) => ({
      step: i + 1,
      description: `Retrieved relevant information from ${e.documentName}`,
      evidence: e.content.slice(0, 150) + "...",
      source: e.documentName,
    }));
  }

  try {
    const evidenceContext = evidence
      .map((e) => `[${e.documentName}]: ${e.content}`)
      .join("\n\n");

    const factsContext = facts
      .map((f) => `${f.entity} ${f.relationship} ${f.relatedEntity}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are an expert at explaining reasoning. Break down the reasoning process into clear steps.
Output JSON:
{
  "steps": [
    {
      "step": 1,
      "description": "what was determined in this step",
      "evidence": "the specific evidence used",
      "source": "source name"
    }
  ]
}
Maximum 5 steps. Each step should build on previous ones for multi-hop reasoning.`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nEvidence:\n${evidenceContext}\n\nKnowledge Graph Facts:\n${factsContext}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    return result.steps || [];
  } catch (error) {
    console.error("Error generating reasoning steps:", error);
    return [];
  }
}

// Calculate confidence score based on evidence quality
function calculateConfidence(
  evidence: Evidence[],
  facts: GraphFact[],
  contradictions: Contradiction[]
): number {
  if (evidence.length === 0 && facts.length === 0) return 0.1;

  let score = 0;

  // Evidence contribution
  const avgEvidenceScore = evidence.length > 0
    ? evidence.reduce((sum, e) => sum + e.relevanceScore, 0) / evidence.length
    : 0;
  score += avgEvidenceScore * 0.5;

  // Knowledge graph contribution
  if (facts.length > 0) {
    const avgFactConfidence = facts.reduce((sum, f) => sum + f.confidence, 0) / facts.length;
    score += avgFactConfidence * 0.3;
  }

  // Multiple sources bonus
  const uniqueSources = new Set(evidence.map((e) => e.documentName)).size;
  if (uniqueSources >= 2) score += 0.1;
  if (uniqueSources >= 3) score += 0.1;

  // Contradiction penalty
  score -= contradictions.length * 0.1;

  return Math.max(0.1, Math.min(0.95, score));
}

// Generate answer using LLM grounded in evidence
async function generateAnswer(
  question: string,
  evidence: Evidence[],
  facts: GraphFact[]
): Promise<{ answer: string; insufficientEvidence: boolean }> {
  if (evidence.length === 0 && facts.length === 0) {
    return {
      answer: "I don't have enough information in the knowledge base to answer this question. Please upload relevant documents to help me provide an accurate answer.",
      insufficientEvidence: true,
    };
  }

  // Check if LLM is available
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY || !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    // Fallback: Generate a summary from evidence without LLM
    const topEvidence = evidence.slice(0, 2);
    const summaryParts = topEvidence.map((e) => 
      `According to ${e.documentName} (${e.section}): ${e.content.slice(0, 300)}...`
    );
    
    const factsSummary = facts.length > 0 
      ? `\n\nRelated facts from knowledge graph: ${facts.map((f) => 
          `${f.entity} ${f.relationship} ${f.relatedEntity}`
        ).join("; ")}`
      : "";

    return {
      answer: `Based on the available evidence:\n\n${summaryParts.join("\n\n")}${factsSummary}\n\n(Note: AI-powered answer synthesis is currently unavailable. Showing raw evidence excerpts.)`,
      insufficientEvidence: false,
    };
  }

  try {
    const evidenceContext = evidence
      .map((e) => `[Source: ${e.documentName}, Section: ${e.section}]\n${e.content}`)
      .join("\n\n---\n\n");

    const factsContext = facts.length > 0
      ? "\n\nKnowledge Graph Facts:\n" + facts
          .map((f) => `- ${f.entity} (${f.entityType}) ${f.relationship} ${f.relatedEntity} (${f.relatedEntityType})`)
          .join("\n")
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based ONLY on the provided evidence.
Rules:
1. ONLY use information from the provided evidence and knowledge graph facts
2. If the evidence is insufficient, say so honestly
3. Cite sources when making claims
4. Be concise but thorough
5. Never make up information not found in the evidence`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nEvidence:\n${evidenceContext}${factsContext}\n\nAnswer the question based only on the above evidence:`,
        },
      ],
      max_completion_tokens: 1024,
    });

    const answer = response.choices[0]?.message?.content || "Unable to generate an answer.";
    
    return {
      answer,
      insufficientEvidence: false,
    };
  } catch (error) {
    console.error("Error generating answer:", error);
    return {
      answer: "An error occurred while generating the answer. Please try again.",
      insufficientEvidence: true,
    };
  }
}

// Main function to process a question
export async function processQuestion(
  question: string,
  domain: string,
  explainabilityMode: boolean
): Promise<{ answer: AnswerResponse; graphData: GraphVisualization }> {
  // 1. Search for relevant evidence chunks
  const evidence = await searchChunks(question, domain === "general" ? undefined : domain);

  // 2. Get knowledge graph entities and relationships
  const entities = await storage.getAllEntities();
  const relationships = await storage.getAllRelationships();

  // 3. Query knowledge graph for relevant facts
  const facts = await queryKnowledgeGraph(question, entities, relationships);

  // 4. Detect contradictions (if explainability mode)
  const contradictions = explainabilityMode
    ? await detectContradictions(evidence, question)
    : [];

  // 5. Generate multi-hop reasoning (if explainability mode)
  const reasoningSteps = explainabilityMode
    ? await generateReasoningSteps(question, evidence, facts)
    : [];

  // 6. Calculate source credibility scores
  const sourceCredibility: Record<string, number> = {};
  for (const e of evidence) {
    if (!sourceCredibility[e.documentName]) {
      sourceCredibility[e.documentName] = calculateCredibility(e.documentName);
    }
  }

  // 7. Calculate confidence score
  const confidence = calculateConfidence(evidence, facts, contradictions);

  // 8. Generate answer
  const { answer, insufficientEvidence } = await generateAnswer(question, evidence, facts);

  // 9. Get highlighted graph visualization
  const graphData = await getHighlightedGraph(question, facts);

  return {
    answer: {
      answer,
      confidence,
      evidenceChunks: evidence,
      graphFacts: facts,
      reasoningSteps: explainabilityMode ? reasoningSteps : undefined,
      contradictions: explainabilityMode && contradictions.length > 0 ? contradictions : undefined,
      sourceCredibility: Object.keys(sourceCredibility).length > 0 ? sourceCredibility : undefined,
      insufficientEvidence,
    },
    graphData,
  };
}
