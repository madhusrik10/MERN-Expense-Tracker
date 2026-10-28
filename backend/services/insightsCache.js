import { createHash } from "crypto";

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const USER_COOLDOWN_MS = 60 * 1000;

const insightsCache = new Map();
const userCooldowns = new Map();
const inFlightRequests = new Map();

export class InsightsCooldownError extends Error {
  constructor(retryAfterSeconds) {
    super("Please wait before requesting AI insights again.");
    this.code = "AI_COOLDOWN";
    this.status = 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const makeCacheIdentity = (userId, period, financialSummary) => {
  const periodKey = JSON.stringify({
    start: period.start,
    end: period.end,
  });
  const dataHash = createHash("sha256")
    .update(
      JSON.stringify({
        period: periodKey,
        financialSummary,
      })
    )
    .digest("hex");
  const cacheKey = createHash("sha256")
    .update(JSON.stringify({ userId, period: periodKey, dataHash }))
    .digest("hex");

  return { cacheKey, periodKey, dataHash };
};

const getCachedValue = (identity, now) => {
  const entry = insightsCache.get(identity.cacheKey);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= now) {
    insightsCache.delete(identity.cacheKey);
    return null;
  }

  insightsCache.delete(identity.cacheKey);
  insightsCache.set(identity.cacheKey, entry);
  return entry.insights;
};

const storeCachedValue = (userId, identity, insights, now) => {
  for (const [key, entry] of insightsCache) {
    if (
      entry.userId === userId &&
      entry.periodKey === identity.periodKey &&
      entry.dataHash !== identity.dataHash
    ) {
      insightsCache.delete(key);
    }
  }

  insightsCache.delete(identity.cacheKey);
  insightsCache.set(identity.cacheKey, {
    userId,
    periodKey: identity.periodKey,
    dataHash: identity.dataHash,
    insights,
    expiresAt: now + CACHE_TTL_MS,
  });

  while (insightsCache.size > MAX_CACHE_ENTRIES) {
    insightsCache.delete(insightsCache.keys().next().value);
  }
};

export const getOrGenerateCachedInsights = async ({
  userId,
  period,
  financialSummary,
  generate,
  now = Date.now(),
}) => {
  for (const [cachedUserId, cooldownUntil] of userCooldowns) {
    if (cooldownUntil <= now) {
      userCooldowns.delete(cachedUserId);
    }
  }

  const identity = makeCacheIdentity(userId, period, financialSummary);
  const cachedInsights = getCachedValue(identity, now);
  if (cachedInsights) {
    return { insights: cachedInsights, cached: true };
  }

  const requestKey = `${userId}:${identity.cacheKey}`;
  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const cooldownUntil = userCooldowns.get(userId) || 0;
  if (cooldownUntil > now) {
    throw new InsightsCooldownError(
      Math.ceil((cooldownUntil - now) / 1000)
    );
  }

  userCooldowns.delete(userId);
  userCooldowns.set(userId, now + USER_COOLDOWN_MS);
  while (userCooldowns.size > MAX_CACHE_ENTRIES) {
    userCooldowns.delete(userCooldowns.keys().next().value);
  }
  const request = Promise.resolve()
    .then(generate)
    .then((insights) => {
      storeCachedValue(userId, identity, insights, now);
      return { insights, cached: false };
    })
    .finally(() => {
      inFlightRequests.delete(requestKey);
    });

  inFlightRequests.set(requestKey, request);
  return request;
};
