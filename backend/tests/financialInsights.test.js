import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import {
  buildFinancialSummary,
  generateFinancialInsights,
  resolveAnalysisPeriod,
  validateInsights,
} from "../services/financialInsights.js";

const TEST_API_KEY = "test-nvidia-key-not-used-for-network";
const TEST_MODEL_ID = "deepseek-ai/deepseek-v4.1-flash";
const validInsights = {
  summary: "Income exceeded expenses in this period.",
  observations: [],
  suggestions: [],
  positivePoints: [],
};

const providerResponse = (insights = validInsights, finishReason = "stop") => ({
  data: {
    choices: [
      {
        finish_reason: finishReason,
        message: { content: JSON.stringify(insights) },
      },
    ],
  },
});

const withProviderConfig = async (
  callback,
  config = {}
) => {
  const apiKey = Object.prototype.hasOwnProperty.call(config, "apiKey")
    ? config.apiKey
    : TEST_API_KEY;
  const modelId = Object.prototype.hasOwnProperty.call(config, "modelId")
    ? config.modelId
    : TEST_MODEL_ID;
  const originalKey = process.env.NVIDIA_API_KEY;
  const originalModelId = process.env.NVIDIA_MODEL_ID;
  try {
    if (apiKey === undefined) {
      delete process.env.NVIDIA_API_KEY;
    } else {
      process.env.NVIDIA_API_KEY = apiKey;
    }
    if (modelId === undefined) {
      delete process.env.NVIDIA_MODEL_ID;
    } else {
      process.env.NVIDIA_MODEL_ID = modelId;
    }
    await callback();
  } finally {
    if (originalKey === undefined) {
      delete process.env.NVIDIA_API_KEY;
    } else {
      process.env.NVIDIA_API_KEY = originalKey;
    }
    if (originalModelId === undefined) {
      delete process.env.NVIDIA_MODEL_ID;
    } else {
      process.env.NVIDIA_MODEL_ID = originalModelId;
    }
  }
};

test("resolves custom date ranges and the preceding equivalent period", () => {
  const period = resolveAnalysisPeriod(
    {
      frequency: "custom",
      startDate: "2026-03-01",
      endDate: "2026-03-07",
    },
    new Date("2026-03-20T12:00:00.000Z")
  );

  assert.equal(period.start.toISOString(), "2026-03-01T00:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-03-07T23:59:59.999Z");
  assert.equal(period.previousStart.toISOString(), "2026-02-22T00:00:00.000Z");
  assert.equal(period.previousEnd.toISOString(), "2026-02-28T23:59:59.999Z");
});

test("rejects malformed, reversed, and overlong custom periods", () => {
  assert.throws(
    () =>
      resolveAnalysisPeriod({
        frequency: "custom",
        startDate: "2026-02-30",
        endDate: "2026-03-01",
      }),
    { code: "INVALID_PERIOD" }
  );
  assert.throws(
    () =>
      resolveAnalysisPeriod({
        frequency: "custom",
        startDate: "2026-03-02",
        endDate: "2026-03-01",
      }),
    { code: "INVALID_PERIOD" }
  );
  assert.throws(
    () =>
      resolveAnalysisPeriod({
        frequency: "custom",
        startDate: "2025-01-01",
        endDate: "2026-01-02",
      }),
    { code: "INVALID_PERIOD" }
  );
});

test("summarizes only supported transaction types and omits savings rate without income", () => {
  const summary = buildFinancialSummary(
    [
      {
        _id: { transactionType: "expense", category: "Food" },
        amount: 25,
        count: 2,
      },
      {
        _id: { transactionType: "credit", category: "Salary" },
        amount: 100,
        count: 1,
      },
      {
        _id: { transactionType: "transfer", category: "Other" },
        amount: 500,
        count: 1,
      },
    ],
    [
      { _id: { transactionType: "expense", period: "2026-03-01" }, amount: 25 },
      { _id: { transactionType: "credit", period: "2026-03-01" }, amount: 100 },
    ],
    {
      start: new Date("2026-03-01T00:00:00.000Z"),
      end: new Date("2026-03-07T23:59:59.999Z"),
      label: "Custom range",
    }
  );

  assert.equal(summary.income, 100);
  assert.equal(summary.expenses, 25);
  assert.equal(summary.netCashFlow, 75);
  assert.equal(summary.transactionCount, 3);
  assert.deepEqual(summary.highestSpendingCategory, {
    category: "Food",
    amount: 25,
  });
  assert.equal(summary.savingsRate, 0.75);
  assert.deepEqual(summary.spendingTrend, [
    { period: "2026-03-01", income: 100, expenses: 25 },
  ]);

  const noIncome = buildFinancialSummary(
    [{ _id: { transactionType: "expense", category: "Food" }, amount: 25, count: 1 }],
    [],
    {
      start: new Date("2026-03-01T00:00:00.000Z"),
      end: new Date("2026-03-01T23:59:59.999Z"),
      label: "One day",
    }
  );
  assert.equal(noIncome.savingsRate, null);
});

test("validates the exact insights shape and rejects malformed output", () => {
  const valid = {
    summary: "Expenses were lower than income in this period.",
    observations: ["Food was the highest spending category."],
    suggestions: ["Review recurring food purchases."],
    positivePoints: [],
  };
  assert.deepEqual(validateInsights(valid), valid);
  assert.throws(
    () => validateInsights({ ...valid, extra: "unexpected" }),
    { code: "INVALID_AI_RESPONSE" }
  );
  assert.throws(
    () => validateInsights({ ...valid, suggestions: [42] }),
    { code: "INVALID_AI_RESPONSE" }
  );
});

test("requires both NVIDIA credentials and model configuration", async () => {
  const originalPost = axios.post;
  let attempts = 0;
  axios.post = async () => {
    attempts += 1;
    throw new Error("Provider must not be called");
  };
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    for (const config of [
      { apiKey: undefined },
      { modelId: undefined },
      { modelId: "invalid model ID" },
    ]) {
      await withProviderConfig(
        () =>
          assert.rejects(
            generateFinancialInsights({ income: 100 }),
            { code: "AI_NOT_CONFIGURED", status: 503 }
          ),
        config
      );
    }
    assert.equal(attempts, 0);
  } finally {
    axios.post = originalPost;
    console.warn = originalWarn;
  }
});

test("sends aggregated data to NVIDIA chat completions and validates its JSON response", async () => {
  const originalPost = axios.post;
  let requestUrl;
  let requestBody;
  let requestOptions;
  axios.post = async (url, body, options) => {
    requestUrl = url;
    requestBody = body;
    requestOptions = options;
    return providerResponse({
      ...validInsights,
      summary: "  Income exceeded expenses in this period. ",
    });
  };

  try {
    await withProviderConfig(async () => {
      const financialSummary = {
        income: 100,
        expenses: 25,
        spendingByCategory: [{ category: "Food", amount: 25 }],
      };
      const insights = await generateFinancialInsights(financialSummary);

      assert.equal(insights.summary, validInsights.summary);
      assert.deepEqual(Object.keys(insights), [
        "summary",
        "observations",
        "suggestions",
        "positivePoints",
      ]);
      assert.equal(requestUrl, "https://integrate.api.nvidia.com/v1/chat/completions");
      assert.equal(requestOptions.timeout, 25000);
      assert.equal(
        requestOptions.headers.Authorization,
        `Bearer ${TEST_API_KEY}`
      );
      assert.equal(requestBody.model, TEST_MODEL_ID);
      assert.equal(requestBody.stream, false);
      assert.equal(requestBody.max_tokens, 700);
      assert.match(requestBody.messages[1].content, /"income":100/);
      assert.doesNotMatch(requestBody.messages[1].content, /transaction title/i);
    });
  } finally {
    axios.post = originalPost;
  }
});

test("sends aggregated data to OpenRouter and includes required headers and response_format", async () => {
  const originalPost = axios.post;
  let requestUrl;
  let requestBody;
  let requestOptions;
  axios.post = async (url, body, options) => {
    requestUrl = url;
    requestBody = body;
    requestOptions = options;
    return providerResponse({
      ...validInsights,
      summary: "Income exceeded expenses in this period.",
    });
  };

  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalOpenRouterModel = process.env.OPENROUTER_MODEL_ID;
  process.env.OPENROUTER_API_KEY = "test-openrouter-key";
  process.env.OPENROUTER_MODEL_ID = "openai/gpt-4o";

  try {
    const financialSummary = {
      income: 100,
      expenses: 25,
      spendingByCategory: [{ category: "Food", amount: 25 }],
    };
    const insights = await generateFinancialInsights(financialSummary);

    assert.equal(insights.summary, validInsights.summary);
    assert.equal(requestUrl, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(requestOptions.headers.Authorization, "Bearer test-openrouter-key");
    assert.equal(requestOptions.headers["HTTP-Referer"], "http://localhost:3000");
    assert.equal(requestOptions.headers["X-Title"], "Expense Tracker");
    assert.equal(requestBody.model, "openai/gpt-4o");
    assert.deepEqual(requestBody.response_format, { type: "json_object" });
    assert.equal(requestBody.max_tokens, 700);
  } finally {
    axios.post = originalPost;
    if (originalOpenRouterKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    }
    if (originalOpenRouterModel === undefined) {
      delete process.env.OPENROUTER_MODEL_ID;
    } else {
      process.env.OPENROUTER_MODEL_ID = originalOpenRouterModel;
    }
  }
});

test("rejects invalid or incomplete NVIDIA response content", async () => {
  const originalPost = axios.post;
  axios.post = async () => ({
    data: {
      choices: [
        {
          finish_reason: "length",
          message: { content: JSON.stringify(validInsights) },
        },
      ],
    },
  });

  try {
    await withProviderConfig(() =>
      assert.rejects(generateFinancialInsights({ income: 100 }), {
        code: "INVALID_AI_RESPONSE",
        status: 502,
      })
    );
    axios.post = async () => ({
      data: {
        choices: [{ finish_reason: "stop", message: { content: "not JSON" } }],
      },
    });
    await withProviderConfig(() =>
      assert.rejects(generateFinancialInsights({ income: 100 }), {
        code: "INVALID_AI_RESPONSE",
        status: 502,
      })
    );
  } finally {
    axios.post = originalPost;
  }
});

test("maps provider rate limits without retrying", async () => {
  const originalPost = axios.post;
  const originalWarn = console.warn;
  let attempts = 0;
  console.warn = () => {};
  axios.post = async () => {
    attempts += 1;
    const error = new Error("Provider limit reached");
    error.response = { status: 429 };
    error.code = "ERR_TEST";
    throw error;
  };

  try {
    await withProviderConfig(() =>
      assert.rejects(generateFinancialInsights({ income: 100 }), {
        code: "AI_RATE_LIMIT",
        status: 429,
      })
    );
    assert.equal(attempts, 1);
  } finally {
    axios.post = originalPost;
    console.warn = originalWarn;
  }
});

test("logs a safe provider error code without logging provider messages", async () => {
  const originalPost = axios.post;
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  axios.post = async () => {
    const error = new Error("Provider rejected request");
    error.response = {
      status: 503,
      data: {
        error: {
          code: "MODEL_NOT_AVAILABLE",
          message: "Sensitive provider detail must not be logged.",
        },
      },
    };
    throw error;
  };

  try {
    await withProviderConfig(() =>
      assert.rejects(generateFinancialInsights({ income: 100 }), {
        code: "AI_UNAVAILABLE",
        status: 503,
      })
    );
    assert.equal(warnings.length, 3);
    warnings.forEach((warning, index) =>
      assert.deepEqual(warning[1], {
        status: 503,
        providerCode: "MODEL_NOT_AVAILABLE",
        attempt: index + 1,
      })
    );
    assert.doesNotMatch(JSON.stringify(warnings), /Sensitive provider detail/);
  } finally {
    axios.post = originalPost;
    console.warn = originalWarn;
  }
});

test("maps authentication and malformed-request errors without retrying", async () => {
  const originalPost = axios.post;
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    for (const testCase of [
      { status: 401, code: "AI_NOT_CONFIGURED" },
      { status: 403, code: "AI_NOT_CONFIGURED" },
      { status: 400, code: "AI_UNAVAILABLE" },
    ]) {
      let attempts = 0;
      axios.post = async () => {
        attempts += 1;
        const error = new Error("Provider rejected request");
        error.response = {
          status: testCase.status,
          data: { error: { message: "Request rejected." } },
        };
        throw error;
      };

      await withProviderConfig(() =>
        assert.rejects(generateFinancialInsights({ income: 100 }), {
          code: testCase.code,
        })
      );
      assert.equal(attempts, 1);
    }
  } finally {
    axios.post = originalPost;
    console.warn = originalWarn;
  }
});

test("maps a provider timeout without retrying it", async () => {
  const originalPost = axios.post;
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    for (const code of ["ECONNABORTED", "ETIMEDOUT"]) {
      let attempts = 0;
      axios.post = async () => {
        attempts += 1;
        const error = new Error("timeout of 25000ms exceeded");
        error.code = code;
        throw error;
      };

      await withProviderConfig(() =>
        assert.rejects(generateFinancialInsights({ income: 100 }), {
          code: "AI_TIMEOUT",
          status: 504,
          message:
            "The AI provider is taking too long to respond. Please try again shortly.",
        })
      );
      assert.equal(attempts, 1);
    }
  } finally {
    axios.post = originalPost;
    console.warn = originalWarn;
  }
});

test("retries transient errors at most twice without logging provider or financial data", async () => {
  const originalPost = axios.post;
  const originalWarn = console.warn;
  const loggedErrors = [];
  let attempts = 0;
  console.warn = (...args) => loggedErrors.push(args);
  axios.post = async () => {
    attempts += 1;
    const error = new Error("Request failed");
    error.code = "ERR_BAD_RESPONSE";
    error.response = {
      status: 503,
      data: {
        error: {
          code: 503,
          status: "UNAVAILABLE",
          message:
            "Service unavailable for test-nvidia-key-not-used-for-network: ConfidentialCategory total 12345.",
        },
      },
    };
    throw error;
  };

  try {
    await withProviderConfig(() =>
      assert.rejects(
        generateFinancialInsights({
          income: 12345,
          spendingByCategory: [
            { category: "ConfidentialCategory", amount: 12345 },
          ],
        }),
        { code: "AI_UNAVAILABLE", status: 503 }
      )
    );
    assert.equal(attempts, 3);
    assert.equal(loggedErrors.length, 3);
    for (const [, details] of loggedErrors) {
      assert.equal(details.status, 503);
      assert.equal(typeof details.attempt, "number");
    }
    assert.doesNotMatch(
      JSON.stringify(loggedErrors),
      /test-nvidia-key|ConfidentialCategory|12345/
    );
  } finally {
    axios.post = originalPost;
    console.warn = originalWarn;
  }
});
