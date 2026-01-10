// src/app.ts
import express from "express";
import { createRequire } from "module";
import compression from "compression";

// src/config/env.ts
var NODE_ENV = process.env.NODE_ENV ?? "development";
var IS_PRODUCTION = NODE_ENV === "production";
var IS_DEVELOPMENT = NODE_ENV === "development";
var PORT = Number(process.env.PORT) || 8e3;
var DATABASE_URL = process.env.DATABASE_URL ?? "";
var REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
var REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
var REDIS_USERNAME = process.env.REDIS_USERNAME ?? "default";
var REDIS_PASSWORD = process.env.REDIS_PASSWORD;
var JWT_SECRET = process.env.JWT_SECRET ?? "";
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
var GMAIL_ACCOUNT = process.env.GMAIL_ACCOUNT ?? "";
var GMAIL_PASSWORD = process.env.GMAIL_PASSWORD ?? "";
var CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",").map((origin) => origin.trim());
var validateEnv = () => {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
};

// src/routes/index.ts
import { Router as Router7 } from "express";

// src/routes/auth/index.ts
import { Router as Router4 } from "express";

// src/routes/auth/user.auth.routes.ts
import { Router } from "express";

// src/models/user.model.ts
import mongoose, { Schema } from "mongoose";
var UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    mobile: { type: String, sparse: true },
    password: { type: String, required: true, select: false },
    // never returned by default
    avatarLink: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);
var UserModel = mongoose.model("User", UserSchema);

// src/models/admin.model.ts
import mongoose2, { Schema as Schema2 } from "mongoose";
var AdminSchema = new Schema2(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    avatarLink: { type: String },
    invitedBy: { type: Schema2.Types.ObjectId, ref: "Administrator" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
var AdminModel = mongoose2.model("Admin", AdminSchema);

// src/models/administrator.model.ts
import mongoose3, { Schema as Schema3 } from "mongoose";
var AdministratorSchema = new Schema3(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    avatarLink: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
var AdministratorModel = mongoose3.model("Administrator", AdministratorSchema);

// src/services/auth.service.ts
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";

// src/constants/auth.constants.ts
var STAKEHOLDER = { USER: "USER", ADMIN: "ADMIN", ADMINISTRATOR: "ADMINISTRATOR" };
var AUTH_COOKIE = { USER: "UToken", ADMIN: "AToken", ADMINISTRATOR: "SToken" };
var SESSION_LIMIT = { USER: 1, ADMIN: 2, ADMINISTRATOR: 2 };
var SESSION_TTL = 15 * 24 * 60 * 60;
var DEVICE = { MOBILE: "mobile", TABLET: "tablet", LAPTOP: "laptop", DESKTOP: "desktop", UNKNOWN: "unknown" };
var COOKIE_CONFIG = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: SESSION_TTL * 1e3, path: "/" };
var PASSWORD_RESET_TTL = 3600;
var RESET_TOKEN_PREFIX = { USER: "usr", ADMIN: "adm", ADMINISTRATOR: "sup" };
var PREFIX_TO_STAKEHOLDER = { usr: "USER", adm: "ADMIN", sup: "ADMINISTRATOR" };

// src/services/auth.service.ts
var hashPassword = async (password) => argon2.hash(password, { type: argon2.argon2id });
var verifyPassword = async (password, hash2) => argon2.verify(hash2, password);
var generateJWT = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_TTL });
var verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};
var setAuthCookie = (res, token, role) => {
  res.cookie(AUTH_COOKIE[role], token, COOKIE_CONFIG);
};
var clearAuthCookie = (res, role) => {
  res.clearCookie(AUTH_COOKIE[role], { path: "/" });
};

// src/services/session.service.ts
import { randomUUID } from "crypto";

// src/db/mongodb.ts
import mongoose4 from "mongoose";
var connectMongoDB = async () => {
  mongoose4.connection.on("connected", () => console.log("[MongoDB] Connected"));
  mongoose4.connection.on("error", (err) => console.error("[MongoDB] Error:", err));
  mongoose4.connection.on("disconnected", () => console.log("[MongoDB] Disconnected"));
  await mongoose4.connect(DATABASE_URL, { maxPoolSize: NODE_ENV === "production" ? 100 : 10 });
};
var isMongoDBConnected = () => mongoose4.connection.readyState === 1;

// src/db/redis.ts
import { createClient } from "redis";
var redis = null;
var connectRedis = async () => {
  if (redis) return redis;
  redis = createClient({
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    socket: { host: REDIS_HOST, port: REDIS_PORT }
  });
  redis.on("connect", () => console.log("[Redis] Connected"));
  redis.on("error", (err) => console.error("[Redis] Error:", err.message));
  await redis.connect();
  return redis;
};
var getRedis = () => {
  if (!redis) throw new Error("Redis not initialized. Call connectRedis() first.");
  return redis;
};
var isRedisConnected = () => redis?.isReady ?? false;

// src/services/session.service.ts
var sessionKey = (role, userId, sessionId) => `session:${role}:${userId}:${sessionId}`;
var sessionPattern = (role, userId) => `session:${role}:${userId}:*`;
var scanKeys = async (pattern) => {
  const redis2 = getRedis();
  const keys = [];
  for await (const key of redis2.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    if (typeof key === "string") {
      keys.push(key);
    }
  }
  return keys;
};
var createSession = async (userId, role, device, ip, userAgent, location = null) => {
  const redis2 = getRedis();
  const activeSessions = await getActiveSessions(userId, role);
  const limitExceeded = activeSessions.length >= SESSION_LIMIT[role];
  const session = {
    sessionId: randomUUID(),
    userId,
    role,
    device,
    ip,
    location,
    userAgent,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastActiveAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!limitExceeded) {
    await redis2.setEx(sessionKey(role, userId, session.sessionId), SESSION_TTL, JSON.stringify(session));
  }
  return { session, limitExceeded, activeSessions };
};
var getActiveSessions = async (userId, role) => {
  const redis2 = getRedis();
  const keys = await scanKeys(sessionPattern(role, userId));
  if (keys.length === 0) return [];
  const values = await redis2.mGet(keys);
  const sessions = values.filter((data) => data !== null).map((data) => JSON.parse(data));
  return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
var validateSession = async (sessionId, userId, role) => {
  const redis2 = getRedis();
  return await redis2.exists(sessionKey(role, userId, sessionId)) === 1;
};
var invalidateSession = async (sessionId, userId, role) => {
  const redis2 = getRedis();
  await redis2.del(sessionKey(role, userId, sessionId));
};
var updateSessionActivity = async (sessionId, userId, role) => {
  const redis2 = getRedis();
  await redis2.expire(sessionKey(role, userId, sessionId), SESSION_TTL);
};

// src/utils/date.utils.ts
var formatDate = (date, options = {}) => {
  const d = new Date(date);
  const { locale = "en-IN", timeOnly = false, includeTime = false, includeSeconds = false, use24Hour = false, shortMonth = true, includeYear = true, includeWeekday = false } = options;
  if (timeOnly) {
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !use24Hour,
      ...includeSeconds && { second: "2-digit" }
    }).format(d);
  }
  const dateOptions = {
    month: shortMonth ? "short" : "long",
    day: "numeric",
    ...includeYear && { year: "numeric" },
    ...includeWeekday && { weekday: options.shortDay !== false ? "short" : "long" }
  };
  if (includeTime) {
    dateOptions.hour = "numeric";
    dateOptions.minute = "2-digit";
    dateOptions.hour12 = !use24Hour;
    if (includeSeconds) dateOptions.second = "2-digit";
  }
  return new Intl.DateTimeFormat(locale, dateOptions).format(d);
};
var formatDuration = (seconds, options = {}) => {
  const { short = false, includeSeconds = true } = options;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  const parts = [];
  if (short) {
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (includeSeconds && secs > 0 && days === 0) parts.push(`${secs}s`);
  } else {
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    if (includeSeconds && secs > 0 && days === 0) parts.push(`${secs} second${secs !== 1 ? "s" : ""}`);
  }
  return parts.length > 0 ? parts.join(short ? " " : ", ") : short ? "0s" : "0 seconds";
};

// src/constants/http.constants.ts
var HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};
var HTTP_ERROR_MESSAGES = {
  BAD_REQUEST: "Invalid request data",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access denied",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource already exists",
  INTERNAL_ERROR: "An unexpected error occurred",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable"
};
var DEBUG_LOG_TTL = 604800;
var DEBUG_LOG_KEY_PREFIX = "debuglog";
var DEBUG_LOG_EXCLUDED_PATHS = ["/api/health"];

// src/services/debugLog.service.ts
var generateId = () => {
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.getTime();
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp}_${random}`;
};
var buildLogKey = (id) => {
  const date = formatDate(/* @__PURE__ */ new Date(), { includeYear: true });
  return `${DEBUG_LOG_KEY_PREFIX}:${date}:${id}`;
};
var createDebugLog = async (entry) => {
  try {
    const redis2 = getRedis();
    const id = generateId();
    const logEntry = { id, ...entry };
    const key = buildLogKey(id);
    await redis2.setEx(key, DEBUG_LOG_TTL, JSON.stringify(logEntry));
  } catch (error) {
    console.error("[DebugLog] Failed to write log:", error);
  }
};

// src/services/mail.service.ts
import nodemailer from "nodemailer";

// src/constants/email.constants.ts
var EMAIL_LOG_TTL = 604800;
var EMAIL_LOG_KEY_PREFIX = "maillog";
var EMAIL_STATUS = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED"
};
var GMAIL_SMTP_CONFIG = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true
};
var EMAIL_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1e3,
  backoffMultiplier: 2
};
var DEFAULT_SENDER = {
  name: "SakalSense",
  replyTo: "aaditya.hasabnis@gmail.com"
};

// src/lib/templates/email.templates.ts
var baseLayout = (content, title) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .otp-box { background-color: #f8f9fa; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0; }
        .text-muted { color: #666; font-size: 14px; }
        p { margin: 0 0 16px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${DEFAULT_SENDER.name}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${DEFAULT_SENDER.name}. All rights reserved.</p>
            <p class="text-muted">This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
`;
var passwordResetEmailTemplate = (recipientName, resetLink, expiresIn = "1 hour") => {
  const html = baseLayout(
    `
        <p>Hello${recipientName ? ` ${recipientName}` : ""},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        <p class="text-muted">This link will expire in <strong>${expiresIn}</strong>.</p>
        <p class="text-muted">If you didn't request this, you can safely ignore this email.</p>
        <p class="text-muted" style="margin-top: 24px; font-size: 12px;">If the button doesn't work, copy and paste this link: ${resetLink}</p>
        `,
    "Reset Your Password"
  );
  const text = `Hello${recipientName ? ` ${recipientName}` : ""},

We received a request to reset your password.

Click here to reset: ${resetLink}

This link will expire in ${expiresIn}.

If you didn't request this, you can safely ignore this email.

${DEFAULT_SENDER.name}`;
  return { html, text };
};
var testEmailTemplate = (subject, body) => {
  const html = baseLayout(
    `
        <p>${body.replace(/\n/g, "<br>")}</p>
        <p class="text-muted" style="margin-top: 24px;">This is a test email sent from the administrator panel.</p>
        `,
    subject
  );
  const text = `${body}

This is a test email sent from the administrator panel.

${DEFAULT_SENDER.name}`;
  return { html, text };
};

// src/utils/mail.utils.ts
var EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false;
  return EMAIL_REGEX.test(email);
};
var sanitizeEmailAddress = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim().replace(/[\r\n]/g, "");
};
var generateEmailId = () => {
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.getTime();
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp}_${random}`;
};
var buildEmailLogKey = (status, id) => {
  const date = formatDate(/* @__PURE__ */ new Date(), { includeYear: true });
  return `${EMAIL_LOG_KEY_PREFIX}:${status}:${date}:${id}`;
};
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// src/middlewares/asyncHandler.ts
var asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// src/middlewares/errorHandler.ts
var errorHandler = (err, _req, res, _next) => {
  console.error("[Error]", err.stack);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: NODE_ENV === "development" ? err.message : HTTP_ERROR_MESSAGES.INTERNAL_ERROR
  });
};

// src/middlewares/requestLogger.ts
var requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};

// src/middlewares/cors.middleware.ts
import cors from "cors";
var corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"]
});

// src/middlewares/auth.middleware.ts
import cookieParser from "cookie-parser";
var parseCookies = cookieParser();
var createAuthMiddleware = (role) => {
  return async (req, res, next) => {
    const token = req.cookies?.[AUTH_COOKIE[role]];
    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: "Authentication required" });
      return;
    }
    const payload = verifyJWT(token);
    if (!payload || payload.role !== role) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: "Invalid token" });
      return;
    }
    const isValid = await validateSession(payload.sessionId, payload.userId, role);
    if (!isValid) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: "Session expired" });
      return;
    }
    updateSessionActivity(payload.sessionId, payload.userId, role);
    req.user = payload;
    next();
  };
};
var authenticateUser = createAuthMiddleware(STAKEHOLDER.USER);
var authenticateAdmin = createAuthMiddleware(STAKEHOLDER.ADMIN);
var authenticateAdministrator = createAuthMiddleware(STAKEHOLDER.ADMINISTRATOR);

// src/middlewares/debugLogger.middleware.ts
var sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;
  const sanitized = { ...body };
  const sensitiveFields = ["password", "currentPassword", "newPassword", "token", "secret"];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
};
var extractStakeholder = (req) => {
  const cookies = req.cookies || {};
  for (const [_role, cookieName] of Object.entries(AUTH_COOKIE)) {
    const token = cookies[cookieName];
    if (token) {
      const payload = verifyJWT(token);
      if (payload) {
        return { type: payload.role, id: payload.userId };
      }
    }
  }
  return null;
};
var extractErrorMessage = (body) => {
  if (!body || typeof body !== "object") return null;
  const obj = body;
  if ("error" in obj && typeof obj.error === "string") return obj.error;
  if ("message" in obj && typeof obj.message === "string") return obj.message;
  return null;
};
var getStatusCategory = (status) => {
  if (status >= 200 && status < 300) return "SUCCESS";
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  return "SERVER_ERROR";
};
var debugLoggerMiddleware = (req, res, next) => {
  if (DEBUG_LOG_EXCLUDED_PATHS.some((path) => req.path.startsWith(path))) {
    next();
    return;
  }
  const startTime = Date.now();
  const requestBody = sanitizeBody(req.body);
  const originalJson = res.json.bind(res);
  let responseBody = null;
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const stakeholder = extractStakeholder(req);
    const status = res.statusCode;
    const statusCategory = getStatusCategory(status);
    const logEntry = {
      timestamp: formatDate(/* @__PURE__ */ new Date(), { includeTime: true, includeSeconds: true }),
      method: req.method,
      url: req.originalUrl,
      requestBody,
      responseBody: sanitizeBody(responseBody),
      status,
      duration,
      statusCategory
    };
    if (stakeholder) {
      logEntry.stakeholder = stakeholder.type;
      if (stakeholder.id) logEntry.stakeholderId = stakeholder.id;
    }
    if (statusCategory !== "SUCCESS") {
      const errorMsg = extractErrorMessage(responseBody);
      if (errorMsg) logEntry.errorMessage = errorMsg;
    }
    createDebugLog(logEntry);
  });
  next();
};

// src/middlewares/mailLogger.middleware.ts
var STATS_KEY = {
  SENT: `${EMAIL_LOG_KEY_PREFIX}:stats:sent`,
  FAILED: `${EMAIL_LOG_KEY_PREFIX}:stats:failed`,
  TOTAL: `${EMAIL_LOG_KEY_PREFIX}:stats:total`
};
var createMailLog = async (entry) => {
  try {
    const redis2 = getRedis();
    const id = generateEmailId();
    const timestamp = formatDate(/* @__PURE__ */ new Date(), { includeTime: true, includeSeconds: true });
    const logEntry = { id, timestamp, ...entry };
    const key = buildEmailLogKey(entry.status, id);
    const pipeline = redis2.multi();
    pipeline.setEx(key, EMAIL_LOG_TTL, JSON.stringify(logEntry));
    pipeline.incr(STATS_KEY.TOTAL);
    pipeline.incr(entry.status === "SENT" ? STATS_KEY.SENT : STATS_KEY.FAILED);
    await pipeline.exec();
  } catch (error) {
    console.error("[MailLog] Failed to write log:", error);
  }
};
var scanKeys2 = async (pattern, limit) => {
  const redis2 = getRedis();
  const keys = [];
  for await (const key of redis2.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    if (typeof key === "string") {
      keys.push(key);
      if (limit && keys.length >= limit) break;
    }
  }
  return keys;
};
var getRecentMailLogs = async (limit = 50) => {
  try {
    const redis2 = getRedis();
    const pattern = `${EMAIL_LOG_KEY_PREFIX}:*`;
    const keys = await scanKeys2(pattern, limit * 2);
    if (keys.length === 0) return [];
    const values = await redis2.mGet(keys);
    const logs = values.filter((data) => data !== null).map((data) => JSON.parse(data));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  } catch (error) {
    console.error("[MailLog] Failed to read logs:", error);
    return [];
  }
};
var getMailLogStats = async () => {
  try {
    const redis2 = getRedis();
    const values = await redis2.mGet([STATS_KEY.TOTAL, STATS_KEY.SENT, STATS_KEY.FAILED]);
    return {
      total: parseInt(values[0] ?? "0", 10),
      sent: parseInt(values[1] ?? "0", 10),
      failed: parseInt(values[2] ?? "0", 10)
    };
  } catch (error) {
    console.error("[MailLog] Failed to get stats:", error);
    return { total: 0, sent: 0, failed: 0 };
  }
};

// src/constants/rateLimit.constants.ts
var RATE_LIMIT_STANDARD = { windowMs: 6e4, maxRequests: 100 };
var RATE_LIMIT_STRICT = { windowMs: 6e4, maxRequests: 10 };
var RATE_LIMIT_AUTH = { windowMs: 3e5, maxRequests: 5 };
var RATE_LIMIT_KEY_PREFIX = "ratelimit";

// src/services/rateLimit.service.ts
var sanitizeId = (id) => id.replace(/[:/\\]/g, "_").toLowerCase();
var buildKey = (identifier) => `${RATE_LIMIT_KEY_PREFIX}:${sanitizeId(identifier)}`;
var consumeRateLimit = async (identifier, config) => {
  const redis2 = getRedis();
  const key = buildKey(identifier);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const requestId = `${now}_${Math.random().toString(36).slice(2, 6)}`;
  const pipeline = redis2.multi();
  pipeline.zRemRangeByScore(key, 0, windowStart);
  pipeline.zCard(key);
  pipeline.zAdd(key, { score: now, value: requestId });
  pipeline.expire(key, Math.ceil(config.windowMs / 1e3));
  const results = await pipeline.exec();
  const currentCount = typeof results?.[1] === "number" ? results[1] : 0;
  const resetAt = now + config.windowMs;
  if (currentCount >= config.maxRequests) {
    await redis2.zRem(key, requestId);
    const oldest = await redis2.zRangeWithScores(key, 0, 0);
    const oldestTime = oldest[0]?.score ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldestTime + config.windowMs - now) / 1e3));
    return { allowed: false, remaining: 0, resetAt, retryAfter };
  }
  return { allowed: true, remaining: config.maxRequests - currentCount - 1, resetAt };
};

// src/utils/device.utils.ts
var detectDevice = (userAgent) => {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile")) return DEVICE.MOBILE;
  if (ua.includes("tablet")) return DEVICE.TABLET;
  if (ua.includes("laptop") || ua.includes("macbook")) return DEVICE.LAPTOP;
  return DEVICE.DESKTOP;
};
var getClientIP = (req) => {
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
};

// src/middlewares/rateLimit.middleware.ts
var rateLimit = (config, keyFn = getClientIP) => {
  return async (req, res, next) => {
    const identifier = keyFn(req);
    const result = await consumeRateLimit(identifier, config);
    res.setHeader("X-RateLimit-Limit", config.maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1e3));
    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfter ?? 60);
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: "Too many requests. Please try again later.",
        data: { retryAfter: result.retryAfter, resetAt: new Date(result.resetAt).toISOString() }
      });
      return;
    }
    next();
  };
};
var rateLimitStandard = rateLimit(RATE_LIMIT_STANDARD);
var rateLimitStrict = rateLimit(RATE_LIMIT_STRICT);
var rateLimitAuth = rateLimit(RATE_LIMIT_AUTH);

// src/services/mail.service.ts
var transporter;
var initTransporter = () => {
  return nodemailer.createTransport({
    ...GMAIL_SMTP_CONFIG,
    auth: {
      user: GMAIL_ACCOUNT,
      pass: GMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
      // Bypass self-signed certificate issues
    }
  });
};
var createTransporter = () => {
  if (!transporter) {
    transporter = initTransporter();
  }
  return transporter;
};
var getTransporter = () => createTransporter();
var sendEmail = async (payload, emailType) => {
  const startTime = Date.now();
  const t = getTransporter();
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const invalidRecipients = recipients.filter((email) => !validateEmail(email));
  if (invalidRecipients.length > 0) {
    const error = `Invalid email address(es): ${invalidRecipients.join(", ")}`;
    await createMailLog({
      recipient: recipients[0] ?? "unknown",
      subject: payload.subject,
      type: emailType,
      status: EMAIL_STATUS.FAILED,
      duration: Date.now() - startTime,
      errorMessage: error
    });
    return { success: false, error };
  }
  const sanitizedTo = recipients.map(sanitizeEmailAddress);
  try {
    const info = await t.sendMail({
      from: `"${DEFAULT_SENDER.name}" <${GMAIL_ACCOUNT}>`,
      to: sanitizedTo.join(", "),
      cc: payload.cc,
      bcc: payload.bcc,
      replyTo: payload.replyTo ?? DEFAULT_SENDER.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments
    });
    const duration = Date.now() - startTime;
    await createMailLog({
      recipient: sanitizedTo[0] ?? "unknown",
      subject: payload.subject,
      type: emailType,
      status: EMAIL_STATUS.SENT,
      duration,
      messageId: info.messageId
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await createMailLog({
      recipient: sanitizedTo[0] ?? "unknown",
      subject: payload.subject,
      type: emailType,
      status: EMAIL_STATUS.FAILED,
      duration,
      errorMessage
    });
    return { success: false, error: errorMessage };
  }
};
var sendEmailWithRetry = async (payload, emailType) => {
  let lastError = "Unknown error";
  let retryCount = 0;
  for (let attempt = 1; attempt <= EMAIL_RETRY_CONFIG.maxAttempts; attempt++) {
    const result = await sendEmail(payload, emailType);
    if (result.success) {
      return { ...result, retryCount };
    }
    lastError = result.error ?? "Unknown error";
    retryCount = attempt;
    if (attempt < EMAIL_RETRY_CONFIG.maxAttempts) {
      const delayTime = EMAIL_RETRY_CONFIG.initialDelayMs * Math.pow(EMAIL_RETRY_CONFIG.backoffMultiplier, attempt - 1);
      await delay(delayTime);
    }
  }
  return { success: false, error: lastError, retryCount };
};
var sendPasswordResetEmail = async (to, data) => {
  const { html, text } = passwordResetEmailTemplate(data.recipientName ?? "", data.resetLink, data.expiresIn);
  return sendEmailWithRetry({ to, subject: "Reset Your Password", html, text }, "PASSWORD_RESET");
};
var sendTestEmail = async (to, subject, body, cc, bcc) => {
  const { html, text } = testEmailTemplate(subject, body);
  return sendEmail({ to, subject, html, text, cc, bcc }, "TEST");
};

// src/services/password-reset.service.ts
import { randomBytes } from "crypto";
var resetTokenKey = (role, token) => `pwreset:${role}:${token}`;
var parseResetToken = (prefixedToken) => {
  const [prefix, token] = prefixedToken.split("_");
  if (!prefix || !token) return null;
  const role = PREFIX_TO_STAKEHOLDER[prefix];
  return role ? { role, token } : null;
};
var generateResetToken = async (userId, email, role) => {
  const rawToken = randomBytes(32).toString("hex");
  const prefixedToken = `${RESET_TOKEN_PREFIX[role]}_${rawToken}`;
  const tokenData = { userId, email, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  await getRedis().setEx(resetTokenKey(role, rawToken), PASSWORD_RESET_TTL, JSON.stringify(tokenData));
  return prefixedToken;
};
var validateResetToken = async (prefixedToken) => {
  const parsed = parseResetToken(prefixedToken);
  if (!parsed) return null;
  const data = await getRedis().get(resetTokenKey(parsed.role, parsed.token));
  return data && typeof data === "string" ? { data: JSON.parse(data), role: parsed.role } : null;
};
var invalidateResetToken = async (prefixedToken) => {
  const parsed = parseResetToken(prefixedToken);
  if (parsed) await getRedis().del(resetTokenKey(parsed.role, parsed.token));
};

// src/utils/geolocation.utils.ts
var isLocalIP = (ip) => {
  return ip === "::1" || ip === "127.0.0.1" || ip === "localhost" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.") || ip.startsWith("172.2") || ip.startsWith("172.30.") || ip.startsWith("172.31.");
};
var getClientIP2 = (ip) => {
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
};
var getLocationLabel = (ip) => {
  if (isLocalIP(ip)) return "Local Network";
  return null;
};

// src/controllers/auth/base.auth.controller.ts
var extractRequestContext = (req) => {
  const device = detectDevice(req.get("user-agent") ?? "");
  const rawIP = getClientIP(req);
  const ip = getClientIP2(rawIP);
  const location = getLocationLabel(ip);
  const userAgent = req.get("user-agent") ?? "";
  return { device, ip, location, userAgent };
};
var buildJWTPayload = (userId, fullName, avatarLink, role, sessionId) => ({
  userId,
  fullName,
  avatarLink,
  role,
  sessionId
});
var buildUserResponse = (userId, fullName, email, avatarLink) => ({
  id: userId,
  fullName,
  email,
  avatarLink
});
var createAuthController = (config) => {
  const { role, model, supportsRegistration = false, validateRegistration, createDocument } = config;
  const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Email and password required" });
      return;
    }
    const entity = await model.findOne({ email: email.toLowerCase(), isActive: true }).select("+password");
    if (!entity || !await verifyPassword(password, entity.password)) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: "Invalid credentials" });
      return;
    }
    const userId = entity._id.toString();
    const { device, ip, location, userAgent } = extractRequestContext(req);
    const { session, limitExceeded, activeSessions } = await createSession(userId, role, device, ip, userAgent, location);
    if (limitExceeded) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: "Session limit exceeded",
        data: {
          sessionLimitExceeded: true,
          activeSessions
        }
      });
      return;
    }
    const token = generateJWT(buildJWTPayload(userId, entity.fullName, entity.avatarLink ?? null, role, session.sessionId));
    setAuthCookie(res, token, role);
    res.json({
      success: true,
      data: { user: buildUserResponse(userId, entity.fullName, entity.email, entity.avatarLink ?? null) }
    });
  };
  const register = supportsRegistration && validateRegistration && createDocument ? async (req, res) => {
    const body = req.body;
    const validation = validateRegistration(body);
    if (!validation.valid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: validation.error });
      return;
    }
    const email = body.email.toLowerCase();
    const exists = await model.findOne({ email });
    if (exists) {
      res.status(HTTP_STATUS.CONFLICT).json({ success: false, error: "Email already registered" });
      return;
    }
    const hashedPassword = await hashPassword(body.password);
    const entity = await createDocument(body, hashedPassword);
    const userId = entity._id.toString();
    const { device, ip, location, userAgent } = extractRequestContext(req);
    const { session } = await createSession(userId, role, device, ip, userAgent, location);
    const token = generateJWT(buildJWTPayload(userId, entity.fullName, null, role, session.sessionId));
    setAuthCookie(res, token, role);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { user: buildUserResponse(userId, entity.fullName, entity.email, null) }
    });
  } : void 0;
  const logout = async (req, res) => {
    const { user } = req;
    await invalidateSession(user.sessionId, user.userId, user.role);
    clearAuthCookie(res, role);
    res.json({ success: true, message: "Logged out successfully" });
  };
  const getSessions = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Email and password required" });
      return;
    }
    const entity = await model.findOne({ email: email.toLowerCase(), isActive: true }).select("+password");
    if (!entity || !await verifyPassword(password, entity.password)) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: "Invalid credentials" });
      return;
    }
    const userId = entity._id.toString();
    const sessions = await getActiveSessions(userId, role);
    res.json({ success: true, data: { sessions } });
  };
  const terminateSession = async (req, res) => {
    const { email, password } = req.body;
    const { sessionId } = req.params;
    if (!email || !password) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Email and password required" });
      return;
    }
    if (!sessionId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Session ID required" });
      return;
    }
    const entity = await model.findOne({ email: email.toLowerCase(), isActive: true }).select("+password");
    if (!entity || !await verifyPassword(password, entity.password)) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: "Invalid credentials" });
      return;
    }
    const userId = entity._id.toString();
    await invalidateSession(sessionId, userId, role);
    res.json({ success: true, message: "Session terminated" });
  };
  const updatePassword = async (req, res) => {
    const { user } = req;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Current password and new password are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "New password must be at least 8 characters" });
      return;
    }
    const entity = await model.findById(user.userId).select("+password");
    if (!entity || !entity.isActive) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: "User not found" });
      return;
    }
    const isValid = await verifyPassword(currentPassword, entity.password);
    if (!isValid) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: "Current password is incorrect" });
      return;
    }
    const isSamePassword = await verifyPassword(newPassword, entity.password);
    if (isSamePassword) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "New password must be different from current password" });
      return;
    }
    const hashedPassword = await hashPassword(newPassword);
    await model.findByIdAndUpdate(user.userId, { password: hashedPassword });
    res.json({ success: true, message: "Password updated successfully" });
  };
  const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Email is required" });
      return;
    }
    const successResponse = { success: true, message: "If that email exists, a password reset link has been sent" };
    const entity = await model.findOne({ email: email.toLowerCase(), isActive: true });
    if (!entity) {
      res.json(successResponse);
      return;
    }
    const userId = entity._id.toString();
    const token = await generateResetToken(userId, email.toLowerCase(), role);
    const origin = req.get("origin") ?? req.get("referer")?.replace(/\/[^/]*$/, "") ?? "http://localhost:3000";
    const resetLink = `${origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email.toLowerCase(), {
      recipientName: entity.fullName,
      resetLink,
      expiresIn: "1 hour"
    });
    res.json(successResponse);
  };
  const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Token and new password are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "New password must be at least 8 characters" });
      return;
    }
    const tokenResult = await validateResetToken(token);
    if (!tokenResult) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Invalid or expired reset link" });
      return;
    }
    if (tokenResult.role !== role) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Invalid reset link for this account type" });
      return;
    }
    const entity = await model.findById(tokenResult.data.userId).select("+password");
    if (!entity || !entity.isActive) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: "User not found" });
      return;
    }
    const isSamePassword = await verifyPassword(newPassword, entity.password);
    if (isSamePassword) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "New password must be different from current password" });
      return;
    }
    const hashedPassword = await hashPassword(newPassword);
    await model.findByIdAndUpdate(tokenResult.data.userId, { password: hashedPassword });
    await invalidateResetToken(token);
    res.json({ success: true, message: "Password has been reset successfully" });
  };
  return { login, register, logout, getSessions, terminateSession, updatePassword, forgotPassword, resetPassword };
};

// src/controllers/auth/user.auth.controller.ts
var userAuthController = createAuthController({
  role: STAKEHOLDER.USER,
  model: UserModel,
  supportsRegistration: true,
  validateRegistration: (body) => {
    const { fullName, email, password } = body;
    if (!fullName || !email || !password) {
      return { valid: false, error: "Full name, email, and password required" };
    }
    return { valid: true };
  },
  createDocument: async (body, hashedPassword) => {
    const { fullName, email, mobile } = body;
    return UserModel.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobile
    });
  }
});

// src/controllers/auth/admin.auth.controller.ts
var VALID_INVITE_CODES = /* @__PURE__ */ new Set(["ADMIN-INVITE-2024"]);
var adminAuthController = createAuthController({
  role: STAKEHOLDER.ADMIN,
  model: AdminModel,
  supportsRegistration: true,
  validateRegistration: (body) => {
    const { fullName, email, password, inviteCode } = body;
    if (!fullName || !email || !password || !inviteCode) {
      return { valid: false, error: "All fields required including invite code" };
    }
    if (!VALID_INVITE_CODES.has(inviteCode)) {
      return { valid: false, error: "Invalid invite code" };
    }
    return { valid: true };
  },
  createDocument: async (body, hashedPassword) => {
    const { fullName, email } = body;
    return AdminModel.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword
    });
  }
});

// src/controllers/auth/administrator.auth.controller.ts
var administratorAuthController = createAuthController({
  role: STAKEHOLDER.ADMINISTRATOR,
  model: AdministratorModel,
  supportsRegistration: false
});

// src/controllers/mail/mail.controller.ts
var sendTestMailController = async (req, res) => {
  const { recipient, cc, bcc, subject, body } = req.body;
  if (!recipient || !subject || !body) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Recipient, subject, and body are required" });
    return;
  }
  if (!validateEmail(recipient)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Invalid email address" });
    return;
  }
  if (subject.length > 200) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Subject must be 200 characters or less" });
    return;
  }
  if (body.length > 1e4) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: "Body must be 10000 characters or less" });
    return;
  }
  const result = await sendTestEmail(recipient, subject, body, cc, bcc);
  if (result.success) {
    res.json({ success: true, message: "Test email sent successfully", data: { messageId: result.messageId } });
  } else {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: result.error ?? "Failed to send email" });
  }
};
var getMailLogsController = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const logs = await getRecentMailLogs(limit);
  res.json({ success: true, data: { logs, count: logs.length } });
};
var getMailStatsController = async (_req, res) => {
  const stats = await getMailLogStats();
  res.json({ success: true, data: stats });
};

// src/routes/auth/user.auth.routes.ts
var router = Router();
router.post("/login", rateLimitAuth, asyncHandler(userAuthController.login));
router.post("/register", rateLimitAuth, asyncHandler(userAuthController.register));
router.post("/sessions", rateLimitStrict, asyncHandler(userAuthController.getSessions));
router.post("/sessions/terminate/:sessionId", rateLimitStrict, asyncHandler(userAuthController.terminateSession));
router.post("/forgot-password", rateLimitStrict, asyncHandler(userAuthController.forgotPassword));
router.post("/reset-password", rateLimitStrict, asyncHandler(userAuthController.resetPassword));
router.post("/logout", authenticateUser, asyncHandler(userAuthController.logout));
router.patch("/update-password", authenticateUser, asyncHandler(userAuthController.updatePassword));

// src/routes/auth/admin.auth.routes.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.post("/login", rateLimitAuth, asyncHandler(adminAuthController.login));
router2.post("/register", rateLimitAuth, asyncHandler(adminAuthController.register));
router2.post("/sessions", rateLimitStrict, asyncHandler(adminAuthController.getSessions));
router2.post("/sessions/terminate/:sessionId", rateLimitStrict, asyncHandler(adminAuthController.terminateSession));
router2.post("/forgot-password", rateLimitStrict, asyncHandler(adminAuthController.forgotPassword));
router2.post("/reset-password", rateLimitStrict, asyncHandler(adminAuthController.resetPassword));
router2.post("/logout", authenticateAdmin, asyncHandler(adminAuthController.logout));
router2.patch("/update-password", authenticateAdmin, asyncHandler(adminAuthController.updatePassword));

// src/routes/auth/administrator.auth.routes.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.post("/login", rateLimitAuth, asyncHandler(administratorAuthController.login));
router3.post("/sessions", rateLimitStrict, asyncHandler(administratorAuthController.getSessions));
router3.post("/sessions/terminate/:sessionId", rateLimitStrict, asyncHandler(administratorAuthController.terminateSession));
router3.post("/forgot-password", rateLimitStrict, asyncHandler(administratorAuthController.forgotPassword));
router3.post("/reset-password", rateLimitStrict, asyncHandler(administratorAuthController.resetPassword));
router3.post("/logout", authenticateAdministrator, asyncHandler(administratorAuthController.logout));
router3.patch("/update-password", authenticateAdministrator, asyncHandler(administratorAuthController.updatePassword));

// src/routes/auth/index.ts
var authRouter = Router4();
authRouter.use("/user", router);
authRouter.use("/admin", router2);
authRouter.use("/administrator", router3);

// src/routes/health/health.route.ts
import { Router as Router5 } from "express";

// src/routes/health/health.controller.ts
var getHealth = (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: "healthy",
    timestamp: formatDate((/* @__PURE__ */ new Date()).toISOString(), { includeTime: true, includeWeekday: true }),
    uptime: formatDuration(process.uptime(), { short: true }),
    services: {
      mongodb: isMongoDBConnected() ? "connected" : "disconnected",
      redis: isRedisConnected() ? "connected" : "disconnected"
    }
  });
};

// src/routes/health/health.route.ts
var healthRouter = Router5();
healthRouter.get("/", getHealth);

// src/routes/mail/mail.routes.ts
import { Router as Router6 } from "express";
var router4 = Router6();
router4.post("/test", authenticateAdministrator, asyncHandler(sendTestMailController));
router4.get("/logs", authenticateAdministrator, asyncHandler(getMailLogsController));
router4.get("/stats", authenticateAdministrator, asyncHandler(getMailStatsController));

// src/routes/index.ts
var apiRouter = Router7();
apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/mail", router4);

// src/app.ts
var require2 = createRequire(import.meta.url);
var helmet = require2("helmet");
var createExpressApp = () => {
  validateEnv();
  const app2 = express();
  app2.disable("x-powered-by");
  app2.use(
    helmet({
      contentSecurityPolicy: IS_PRODUCTION,
      crossOriginEmbedderPolicy: IS_PRODUCTION
    })
  );
  app2.use(corsMiddleware);
  app2.use(compression());
  app2.use(express.json({ limit: "10mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app2.use(parseCookies);
  app2.use(debugLoggerMiddleware);
  if (IS_DEVELOPMENT) {
    app2.use(requestLogger);
  }
  app2.use("/api", apiRouter);
  app2.use(errorHandler);
  return app2;
};

// api/index.ts
var isInitialized = false;
var initializationPromise = null;
var initializeConnections = async () => {
  if (isInitialized) {
    return;
  }
  if (initializationPromise) {
    return initializationPromise;
  }
  initializationPromise = (async () => {
    try {
      console.log("[Vercel] Initializing database connections...");
      await Promise.all([connectMongoDB(), connectRedis()]);
      isInitialized = true;
      console.log("[Vercel] Database connections established");
    } catch (error) {
      console.error("[Vercel] Failed to initialize connections:", error);
      initializationPromise = null;
      throw error;
    }
  })();
  return initializationPromise;
};
var app = createExpressApp();
var handler = async (req, res) => {
  try {
    await initializeConnections();
    app(req, res);
  } catch (error) {
    console.error("[Vercel] Handler error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Service initialization failed"
    });
  }
};
var api_default = handler;
export {
  api_default as default
};
