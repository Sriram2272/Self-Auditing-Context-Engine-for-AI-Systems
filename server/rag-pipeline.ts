import { storage } from "./storage";
import type { Chunk, Evidence } from "@shared/schema";

// Text chunking configuration
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

// Chunk text into overlapping segments
export function chunkText(text: string, documentName: string): { content: string; section: string; startIndex: number; endIndex: number }[] {
  const chunks: { content: string; section: string; startIndex: number; endIndex: number }[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = "";
  let currentSection = "Section 1";
  let sectionNum = 1;
  let startIndex = 0;
  let charCount = 0;

  for (const sentence of sentences) {
    // Detect section headers
    const headerMatch = sentence.match(/^(#+\s*|Chapter\s+\d+|Section\s+\d+|Part\s+\d+)[:\s]*(.*)/i);
    if (headerMatch) {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          section: currentSection,
          startIndex,
          endIndex: charCount,
        });
        currentChunk = "";
        startIndex = charCount;
      }
      sectionNum++;
      currentSection = headerMatch[2] || `Section ${sectionNum}`;
    }

    currentChunk += sentence + " ";

    if (currentChunk.length >= CHUNK_SIZE) {
      chunks.push({
        content: currentChunk.trim(),
        section: currentSection,
        startIndex,
        endIndex: charCount + sentence.length,
      });
      
      // Keep overlap
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP / 5));
      currentChunk = overlapWords.join(" ") + " ";
      startIndex = charCount + sentence.length - currentChunk.length;
    }

    charCount += sentence.length + 1;
  }

  // Add remaining content
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      section: currentSection,
      startIndex,
      endIndex: charCount,
    });
  }

  return chunks;
}

// Process and store a document
export async function processDocument(
  name: string,
  content: string,
  domain: string,
  source: string = "upload"
) {
  // Create document
  const document = await storage.createDocument({
    name,
    content,
    source,
    domain,
  });

  // Chunk the document
  const textChunks = chunkText(content, name);

  // Store chunks
  for (const chunk of textChunks) {
    await storage.createChunk({
      documentId: document.id,
      documentName: name,
      content: chunk.content,
      section: chunk.section,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
    });
  }

  return document;
}

// TF-IDF based similarity calculation
function calculateTFIDF(text: string, corpus: string[]): Map<string, number> {
  const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const wordFreq = new Map<string, number>();
  
  // Calculate TF
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Calculate IDF and TF-IDF
  const tfidf = new Map<string, number>();
  const N = corpus.length;

  for (const [word, tf] of wordFreq) {
    const docsWithWord = corpus.filter((doc) => 
      doc.toLowerCase().includes(word)
    ).length;
    const idf = Math.log((N + 1) / (docsWithWord + 1)) + 1;
    tfidf.set(word, (tf / words.length) * idf);
  }

  return tfidf;
}

// Calculate cosine similarity between two TF-IDF vectors
function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  const allWords = new Set([...vec1.keys(), ...vec2.keys()]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const word of allWords) {
    const v1 = vec1.get(word) || 0;
    const v2 = vec2.get(word) || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// Highlight matching terms in content
function highlightContent(content: string, query: string): string {
  const queryWords = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  let highlighted = content;

  for (const word of queryWords) {
    const regex = new RegExp(`\\b(${word}\\w*)\\b`, "gi");
    highlighted = highlighted.replace(regex, '<mark class="bg-primary/20 text-primary font-medium">$1</mark>');
  }

  return highlighted;
}

// Extract sentence-level evidence
function extractSentenceEvidence(
  content: string,
  query: string
): { sentence: string; relevance: number }[] {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const queryVec = calculateTFIDF(query, sentences);
  
  return sentences
    .map((sentence) => {
      const sentenceVec = calculateTFIDF(sentence, sentences);
      const relevance = cosineSimilarity(queryVec, sentenceVec);
      return { sentence: sentence.trim(), relevance };
    })
    .filter((s) => s.relevance > 0.1)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

// Search for relevant chunks using TF-IDF similarity
export async function searchChunks(
  query: string,
  domain?: string,
  topK: number = 5
): Promise<Evidence[]> {
  const chunks = domain 
    ? await storage.getChunksByDomain(domain)
    : await storage.getAllChunks();

  if (chunks.length === 0) {
    return [];
  }

  const corpus = chunks.map((c) => c.content);
  const queryVec = calculateTFIDF(query, corpus);

  const scoredChunks = chunks.map((chunk) => {
    const chunkVec = calculateTFIDF(chunk.content, corpus);
    const score = cosineSimilarity(queryVec, chunkVec);
    return { chunk, score };
  });

  // Sort by score and take top K
  const topChunks = scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((c) => c.score > 0.05);

  return topChunks.map(({ chunk, score }) => ({
    chunkId: chunk.id,
    documentName: chunk.documentName,
    section: chunk.section,
    content: chunk.content,
    highlightedContent: highlightContent(chunk.content, query),
    relevanceScore: score,
    sentenceEvidence: extractSentenceEvidence(chunk.content, query),
  }));
}

// Get document credibility scores (simulated based on source type)
export function calculateCredibility(documentName: string): number {
  // Simple heuristic based on document naming patterns
  const name = documentName.toLowerCase();
  
  if (name.includes("official") || name.includes("gov") || name.includes("research")) {
    return 0.9;
  }
  if (name.includes("wiki") || name.includes("encyclopedia")) {
    return 0.75;
  }
  if (name.includes("blog") || name.includes("article")) {
    return 0.6;
  }
  if (name.includes("forum") || name.includes("comment")) {
    return 0.4;
  }
  
  return 0.7; // Default credibility
}
