import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type RequestHandler } from "express";
import {
  EndPilotAccessResponse,
  GetPilotAccessStatusResponse,
  StartPilotAccessBody,
  StartPilotAccessResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const COOKIE_NAME = "grace_pilot_access";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function requiredSecret(name: "PILOT_ACCESS_PASSWORD" | "SESSION_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function passwordsMatch(candidate: string): boolean {
  return timingSafeEqual(
    digest(candidate),
    digest(requiredSecret("PILOT_ACCESS_PASSWORD")),
  );
}

function signature(expiresAt: string): string {
  return createHmac("sha256", requiredSecret("SESSION_SECRET"))
    .update(expiresAt)
    .digest("base64url");
}

function createToken(): string {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expiresAt}.${signature(expiresAt)}`;
}

function readCookie(req: Parameters<RequestHandler>[0]): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const item of raw.split(";")) {
    const [name, ...value] = item.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

function hasPilotAccess(req: Parameters<RequestHandler>[0]): boolean {
  const token = readCookie(req);
  if (!token) return false;
  const [expiresAt, providedSignature] = token.split(".");
  if (!expiresAt || !providedSignature || Number(expiresAt) <= Date.now() / 1000) {
    return false;
  }
  const expected = signature(expiresAt);
  return timingSafeEqual(digest(providedSignature), digest(expected));
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_SECONDS * 1000,
    path: "/",
  };
}

router.get("/pilot/status", (req, res): void => {
  res.json(
    GetPilotAccessStatusResponse.parse({
      authenticated: hasPilotAccess(req),
    }),
  );
});

router.post("/pilot/login", (req, res): void => {
  const parsed = StartPilotAccessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password is required." });
    return;
  }

  const key = req.ip ?? "unknown";
  const now = Date.now();
  const current = attempts.get(key);
  const entry =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + ATTEMPT_WINDOW_MS };

  if (entry.count >= MAX_ATTEMPTS) {
    res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    res.status(429).json({ error: "Too many attempts. Please try again later." });
    return;
  }

  if (!passwordsMatch(parsed.data.password)) {
    attempts.set(key, { ...entry, count: entry.count + 1 });
    req.log.warn("Rejected pilot access attempt");
    res.status(401).json({ error: "That pilot password is not correct." });
    return;
  }

  attempts.delete(key);
  res.cookie(COOKIE_NAME, createToken(), cookieOptions());
  res.json(StartPilotAccessResponse.parse({ authenticated: true }));
});

router.post("/pilot/logout", (_req, res): void => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json(EndPilotAccessResponse.parse({ authenticated: false }));
});

export const requirePilotAccess: RequestHandler = (req, res, next): void => {
  if (hasPilotAccess(req)) {
    next();
    return;
  }
  res.status(401).json({ error: "Pilot access required." });
};

export default router;