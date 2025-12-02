import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers[citation:3]
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts per 10 minutes for login
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful logins against the limit[citation:3]
  standardHeaders: true,
});

export const userProfileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: "Too many profile requests, please try again later",
  standardHeaders: true,
});

export const createDynamicLimiter = (windowMinutes, maxRequests, message) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message,
    standardHeaders: true,
  });
};
