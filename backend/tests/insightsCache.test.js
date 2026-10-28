import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import {
  getOrGenerateCachedInsights,
  InsightsCooldownError,
} from "../services/insightsCache.js";

const makeRequest = ({ userId, financialSummary, generate, now }) =>
  getOrGenerateCachedInsights({
    userId,
    period: {
      start: "2026-03-01T00:00:00.000Z",
      end: "2026-03-07T23:59:59.999Z",
    },
    financialSummary,
    generate,
    now,
  });

test("reuses successful cached insights only for the same authenticated user", async () => {
  const userA = randomUUID();
  const userB = randomUUID();
  const financialSummary = { income: 100, expenses: 25 };
  let userAGenerations = 0;
  let userBGenerations = 0;

  const firstUserA = await makeRequest({
    userId: userA,
    financialSummary,
    now: 1_000,
    generate: async () => {
      userAGenerations += 1;
      return { summary: "User A's private insight." };
    },
  });
  const secondUserA = await makeRequest({
    userId: userA,
    financialSummary,
    now: 2_000,
    generate: async () => {
      userAGenerations += 1;
      return { summary: "Must not be generated again." };
    },
  });
  const firstUserB = await makeRequest({
    userId: userB,
    financialSummary,
    now: 2_000,
    generate: async () => {
      userBGenerations += 1;
      return { summary: "User B's private insight." };
    },
  });

  assert.equal(firstUserA.cached, false);
  assert.equal(secondUserA.cached, true);
  assert.equal(secondUserA.insights.summary, "User A's private insight.");
  assert.equal(firstUserB.cached, false);
  assert.equal(firstUserB.insights.summary, "User B's private insight.");
  assert.equal(userAGenerations, 1);
  assert.equal(userBGenerations, 1);
});

test("invalidates a cached period when its aggregated financial data changes", async () => {
  const userId = randomUUID();
  const unchanged = { income: 100, expenses: 25, transactionCount: 2 };
  const changed = { income: 100, expenses: 40, transactionCount: 2 };
  let generations = 0;

  const generate = async () => {
    generations += 1;
    return { summary: `Generation ${generations}` };
  };

  await makeRequest({ userId, financialSummary: unchanged, now: 10_000, generate });
  const refreshed = await makeRequest({
    userId,
    financialSummary: changed,
    now: 70_001,
    generate,
  });
  const oldDataAfterInvalidation = await makeRequest({
    userId,
    financialSummary: unchanged,
    now: 130_002,
    generate,
  });

  assert.equal(refreshed.cached, false);
  assert.equal(oldDataAfterInvalidation.cached, false);
  assert.equal(generations, 3);
});

test("enforces a per-user cooldown for fresh requests but permits cache hits", async () => {
  const userId = randomUUID();
  let generations = 0;

  await makeRequest({
    userId,
    financialSummary: { income: 100 },
    now: 5_000,
    generate: async () => {
      generations += 1;
      return { summary: "Cached result." };
    },
  });

  const cacheHit = await makeRequest({
    userId,
    financialSummary: { income: 100 },
    now: 5_001,
    generate: async () => {
      generations += 1;
      return { summary: "Unexpected provider call." };
    },
  });
  assert.equal(cacheHit.cached, true);

  await assert.rejects(
    makeRequest({
      userId,
      financialSummary: { income: 101 },
      now: 5_002,
      generate: async () => {
        generations += 1;
        return { summary: "Should be blocked." };
      },
    }),
    (error) => {
      assert.ok(error instanceof InsightsCooldownError);
      assert.equal(error.code, "AI_COOLDOWN");
      assert.equal(error.retryAfterSeconds, 60);
      return true;
    }
  );
  assert.equal(generations, 1);
});

test("does not cache failed provider results and keeps the cooldown active", async () => {
  const userId = randomUUID();
  let generations = 0;
  const failingRequest = () =>
    makeRequest({
      userId,
      financialSummary: { income: 100 },
      now: 9_000,
      generate: async () => {
        generations += 1;
        throw new Error("AI provider unavailable");
      },
    });

  await assert.rejects(failingRequest(), /AI provider unavailable/);
  await assert.rejects(failingRequest(), InsightsCooldownError);
  assert.equal(generations, 1);
});

test("coalesces concurrent identical requests into one provider call", async () => {
  const userId = randomUUID();
  let generations = 0;
  let finishGeneration;
  const generate = () => {
    generations += 1;
    return new Promise((resolve) => {
      finishGeneration = resolve;
    });
  };
  const first = makeRequest({
    userId,
    financialSummary: { income: 100 },
    now: 20_000,
    generate,
  });
  const second = makeRequest({
    userId,
    financialSummary: { income: 100 },
    now: 20_000,
    generate,
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(generations, 1);
  finishGeneration({ summary: "One provider response." });
  const results = await Promise.all([first, second]);
  assert.equal(results[0].insights.summary, "One provider response.");
  assert.equal(results[1].insights.summary, "One provider response.");
});
