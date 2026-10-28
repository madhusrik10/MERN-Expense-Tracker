import mongoose from "mongoose";
import Transaction from "../models/TransactionModel.js";
import {
  buildFinancialSummary,
  generateFinancialInsights,
  InsightsError,
  resolveAnalysisPeriod,
} from "../services/financialInsights.js";
import {
  getOrGenerateCachedInsights,
  InsightsCooldownError,
} from "../services/insightsCache.js";

const getAggregateRows = async (userId, start, end, monthlyTrend) => {
  const match = {
    user: new mongoose.Types.ObjectId(userId),
    date: { $gte: start, $lte: end },
    transactionType: { $in: ["credit", "expense"] },
  };
  const trendFormat = monthlyTrend ? "%Y-%m" : "%Y-%m-%d";

  const [categoryRows, trendRows] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { transactionType: "$transactionType", category: "$category" },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            transactionType: "$transactionType",
            period: {
              $dateToString: {
                format: trendFormat,
                date: "$date",
                timezone: "UTC",
              },
            },
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.period": 1 } },
    ]),
  ]);

  return { categoryRows, trendRows };
};

export const createAiInsightsController = async (req, res) => {
  try {
    const period = resolveAnalysisPeriod(req.body);
    const durationDays =
      (period.end.getTime() - period.start.getTime() + 1) /
      (24 * 60 * 60 * 1000);
    const monthlyTrend = durationDays > 62;

    const [currentRows, previousRows] = await Promise.all([
      getAggregateRows(
        req.authenticatedUserId,
        period.start,
        period.end,
        monthlyTrend
      ),
      getAggregateRows(
        req.authenticatedUserId,
        period.previousStart,
        period.previousEnd,
        monthlyTrend
      ),
    ]);

    const financialSummary = buildFinancialSummary(
      currentRows.categoryRows,
      currentRows.trendRows,
      period
    );
    const previousPeriod = buildFinancialSummary(
      previousRows.categoryRows,
      previousRows.trendRows,
      {
        ...period,
        start: period.previousStart,
        end: period.previousEnd,
        label: "Previous equivalent period",
      }
    );

    if (financialSummary.transactionCount === 0) {
      return res.status(200).json({
        success: true,
        hasTransactions: false,
        period: financialSummary.period,
        comparisonAvailable: false,
        insights: null,
        cached: false,
      });
    }

    const comparisonAvailable = previousPeriod.transactionCount > 0;
    const previousPeriodSummary = comparisonAvailable
      ? {
          income: previousPeriod.income,
          expenses: previousPeriod.expenses,
          netCashFlow: previousPeriod.netCashFlow,
          transactionCount: previousPeriod.transactionCount,
        }
      : null;
    const insightRequest = await getOrGenerateCachedInsights({
      userId: req.authenticatedUserId,
      period: financialSummary.period,
      financialSummary: {
        ...financialSummary,
        previousPeriod: previousPeriodSummary,
        comparisonAvailable,
      },
      generate: () =>
        generateFinancialInsights({
          ...financialSummary,
          previousPeriod: previousPeriodSummary,
          comparisonAvailable,
        }),
    });

    return res.status(200).json({
      success: true,
      hasTransactions: true,
      period: financialSummary.period,
      comparisonAvailable,
      insights: insightRequest.insights,
      cached: insightRequest.cached,
    });
  } catch (error) {
    if (error instanceof InsightsCooldownError) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
    if (error instanceof InsightsError) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    console.error("AI insights request failed.", {
      code: error.code || "DATABASE_ERROR",
    });
    return res.status(500).json({
      success: false,
      code: "AI_INSIGHTS_FAILED",
      message: "Unable to generate AI insights right now.",
    });
  }
};
