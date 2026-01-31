import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase-admin";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
  };
}

/**
 * Authentication middleware that verifies Firebase ID tokens
 * Extracts token from Authorization header (Bearer <token>)
 * Attaches decoded user information to req.user
 * Returns 401 if token is missing or invalid
 */
export async function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: "Unauthorized", 
        message: "Missing Authorization header" 
      });
      return;
    }

    // Check for Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({ 
        error: "Unauthorized", 
        message: "Invalid Authorization header format. Expected 'Bearer <token>'" 
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({ 
        error: "Unauthorized", 
        message: "Missing authentication token" 
      });
      return;
    }

    // Verify token with Firebase Admin SDK
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Attach user information to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
      };
      
      next();
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      res.status(401).json({ 
        error: "Unauthorized", 
        message: "Invalid or expired authentication token" 
      });
      return;
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: "Authentication failed" 
    });
    return;
  }
}
