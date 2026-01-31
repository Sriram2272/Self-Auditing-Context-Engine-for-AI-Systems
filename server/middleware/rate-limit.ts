import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Applies to most API endpoints
 * Limit: 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: false,
  // Skip failed requests from counting against the limit
  skipFailedRequests: false,
});

/**
 * Strict rate limiter for /api/ask endpoint
 * LLM calls are expensive, so we apply stricter limits
 * Limit: 20 requests per 15 minutes per IP
 */
export const askRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many question requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Strict rate limiter for document uploads
 * Limit: 10 uploads per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: "Too Many Requests",
    message: "Too many document uploads from this IP, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
