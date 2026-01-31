import fs from "fs";
import path from "path";

const CSV_FILE_NAME = "TeamXYZ.csv";
const CSV_FILE_PATH = path.join(process.cwd(), CSV_FILE_NAME);

const CSV_HEADERS = [
  "query_id",
  "timestamp",
  "user_id",
  "query_text",
  "final_answer",
  "answer_summary",
  "context_used",
  "context_excluded",
  "num_contexts_used",
  "audit_explanation",
  "reasoning_type",
  "evidence_strength",
  "hallucination_risk",
  "confidence_score",
  "response_time_ms",
  "model_name",
  "version",
];

export interface CSVLogEntry {
  queryId: string;
  timestamp: string;
  userId?: string;
  queryText: string;
  finalAnswer: string;
  answerSummary: string;
  contextUsed: string[];
  contextExcluded: string[];
  numContextsUsed: number;
  auditExplanation: string;
  reasoningType: "factual" | "logical" | "comparative";
  evidenceStrength: "weak" | "medium" | "strong";
  hallucinationRisk: "low" | "medium" | "high";
  confidenceScore: number;
  responseTimeMs: number;
  modelName: string;
  version: string;
}

let queryCounter = 0;

function loadQueryCounter(): void {
  try {
    if (fs.existsSync(CSV_FILE_PATH)) {
      const content = fs.readFileSync(CSV_FILE_PATH, "utf-8");
      const lines = content.trim().split("\n");
      queryCounter = Math.max(0, lines.length - 1);
    }
  } catch (error) {
    queryCounter = 0;
  }
}

loadQueryCounter();

export function getNextQueryId(): string {
  queryCounter++;
  return `q${queryCounter}`;
}

function escapeCSVField(value: string): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  
  // Prevent CSV injection by escaping special characters
  // Characters that can trigger formulas: =, +, -, @, tab, carriage return
  let sanitized = stringValue;
  if (sanitized.match(/^[=+\-@\t\r]/)) {
    // Prefix with tab and single quote to prevent formula execution
    sanitized = "\t'" + sanitized;
  }
  
  if (
    sanitized.includes(",") ||
    sanitized.includes('"') ||
    sanitized.includes("\n") ||
    sanitized.includes("\r")
  ) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

function ensureCSVFileExists(): void {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    const headerRow = CSV_HEADERS.join(",") + "\n";
    fs.writeFileSync(CSV_FILE_PATH, headerRow, { 
      encoding: "utf-8",
      mode: 0o600 // Owner read/write only (restrictive permissions)
    });
    console.log(`Created CSV file: ${CSV_FILE_PATH} with restrictive permissions (0600)`);
  }
}

export function appendToCSV(entry: CSVLogEntry): void {
  // Check if CSV logging is enabled (default: true)
  const csvLoggingEnabled = process.env.ENABLE_CSV_LOGGING !== "false";
  
  if (!csvLoggingEnabled) {
    console.log(`CSV logging disabled, skipping query ${entry.queryId}`);
    return;
  }
  
  ensureCSVFileExists();

  const row = [
    escapeCSVField(entry.queryId),
    escapeCSVField(entry.timestamp),
    escapeCSVField(entry.userId || "anonymous"),
    escapeCSVField(entry.queryText),
    escapeCSVField(entry.finalAnswer),
    escapeCSVField(entry.answerSummary),
    escapeCSVField(entry.contextUsed.join(";")),
    escapeCSVField(entry.contextExcluded.join(";")),
    escapeCSVField(String(entry.numContextsUsed)),
    escapeCSVField(entry.auditExplanation),
    escapeCSVField(entry.reasoningType),
    escapeCSVField(entry.evidenceStrength),
    escapeCSVField(entry.hallucinationRisk),
    escapeCSVField(entry.confidenceScore.toFixed(2)),
    escapeCSVField(String(entry.responseTimeMs)),
    escapeCSVField(entry.modelName),
    escapeCSVField(entry.version),
  ];

  const csvRow = row.join(",") + "\n";
  fs.appendFileSync(CSV_FILE_PATH, csvRow, "utf-8");
  console.log(`Appended query ${entry.queryId} to ${CSV_FILE_NAME}`);
}

export function getISTTimestamp(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().replace("T", " ").replace("Z", " IST");
}

export function determineReasoningType(
  reasoningSteps: Array<{ step: number; description: string }> | undefined
): "factual" | "logical" | "comparative" {
  if (!reasoningSteps || reasoningSteps.length === 0) {
    return "factual";
  }
  const stepsText = reasoningSteps.map((s) => s.description.toLowerCase()).join(" ");
  if (stepsText.includes("compar") || stepsText.includes("versus") || stepsText.includes("differ")) {
    return "comparative";
  }
  if (stepsText.includes("therefore") || stepsText.includes("because") || stepsText.includes("implies") || stepsText.includes("leads to")) {
    return "logical";
  }
  return "factual";
}

export function determineEvidenceStrength(confidence: number, evidenceCount: number): "weak" | "medium" | "strong" {
  if (confidence >= 0.8 && evidenceCount >= 3) {
    return "strong";
  }
  if (confidence >= 0.5 && evidenceCount >= 1) {
    return "medium";
  }
  return "weak";
}

export function determineHallucinationRisk(confidence: number, evidenceCount: number): "low" | "medium" | "high" {
  if (confidence >= 0.8 && evidenceCount >= 3) {
    return "low";
  }
  if (confidence >= 0.5 && evidenceCount >= 1) {
    return "medium";
  }
  return "high";
}

export function generateAnswerSummary(answer: string): string {
  const cleaned = answer.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 100) {
    return cleaned;
  }
  return cleaned.substring(0, 97) + "...";
}

export function generateAuditExplanation(
  evidenceCount: number,
  confidence: number,
  hasContradictions: boolean
): string {
  const parts: string[] = [];
  parts.push(`Based on ${evidenceCount} evidence chunk(s)`);
  parts.push(`confidence ${(confidence * 100).toFixed(0)}%`);
  if (hasContradictions) {
    parts.push("contradictions detected");
  }
  return parts.join("; ");
}
