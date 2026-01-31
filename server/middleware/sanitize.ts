import { Request, Response, NextFunction } from "express";

/**
 * Sanitizes string by trimming whitespace and removing potential XSS vectors
 */
function sanitizeString(value: string): string {
  if (typeof value !== "string") return value;
  
  // Trim whitespace
  let sanitized = value.trim();
  
  // Remove potential script tags (basic protection, CSP is main defense)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
  
  return sanitized;
}

/**
 * Recursively sanitizes object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Validates content length to prevent huge payloads
 */
function validateContentLength(content: string, maxLength: number): boolean {
  return content.length <= maxLength;
}

/**
 * Input sanitization middleware
 * - Trims whitespace from string inputs
 * - Validates content length limits
 * - Sanitizes HTML/script tags from user inputs
 */
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
      
      // Validate specific content length limits
      if (req.body.content && typeof req.body.content === "string") {
        // Max 10MB for document content
        if (!validateContentLength(req.body.content, 10 * 1024 * 1024)) {
          res.status(400).json({ 
            error: "Bad Request", 
            message: "Content too large. Maximum size is 10MB" 
          });
          return;
        }
      }
      
      if (req.body.question && typeof req.body.question === "string") {
        // Max 1000 characters for questions
        if (!validateContentLength(req.body.question, 1000)) {
          res.status(400).json({ 
            error: "Bad Request", 
            message: "Question too long. Maximum length is 1000 characters" 
          });
          return;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Sanitization middleware error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: "Failed to process request" 
    });
  }
}
