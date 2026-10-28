import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { aiInsightsAPI } from "../../utils/ApiRequest";
import "./home.css";

const asLocalDate = (date) => {
  if (!date) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (date) =>
  new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const isInsightsResponse = (value) =>
  value &&
  value.success === true &&
  typeof value.hasTransactions === "boolean" &&
  value.period &&
  typeof value.period.start === "string" &&
  typeof value.period.end === "string" &&
  typeof value.period.label === "string" &&
  typeof value.comparisonAvailable === "boolean" &&
  (value.hasTransactions
    ? value.insights &&
      typeof value.insights.summary === "string" &&
      ["observations", "suggestions", "positivePoints"].every(
        (key) =>
          Array.isArray(value.insights[key]) &&
          value.insights[key].length <= 5 &&
          value.insights[key].every(
            (item) =>
              typeof item === "string" && item.length > 0 && item.length <= 240
          )
      )
    : value.insights === null);

const AIInsights = ({
  frequency,
  startDate,
  endDate,
  dataRevision,
  onAddTransaction,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const requestInFlight = useRef(false);

  useEffect(() => {
    setResult(null);
    setErrorMessage("");
  }, [frequency, startDate, endDate, dataRevision]);

  const handleGenerate = async () => {
    if (requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;
    setLoading(true);
    setResult(null);
    setErrorMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Please sign in again to generate financial insights.");
      setLoading(false);
      requestInFlight.current = false;
      return;
    }

    try {
      const { data } = await axios.post(
        aiInsightsAPI,
        {
          frequency,
          startDate: frequency === "custom" ? asLocalDate(startDate) : null,
          endDate: frequency === "custom" ? asLocalDate(endDate) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!isInsightsResponse(data)) {
        throw new Error("The server returned an invalid insights response.");
      }
      setResult(data);
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === "AI_RATE_LIMIT") {
        setErrorMessage(
          "AI insights are temporarily unavailable because the provider usage limit has been reached. Please try again later."
        );
      } else if (code === "UNAUTHENTICATED") {
        setErrorMessage("Please sign in again to generate financial insights.");
      } else if (code === "AI_NOT_CONFIGURED" || code === "AUTH_NOT_CONFIGURED") {
        setErrorMessage("AI insights are temporarily unavailable. Please try again later.");
      } else if (code === "AI_TIMEOUT") {
        setErrorMessage(
          "The AI provider is taking too long to respond. Please try again shortly."
        );
      } else if (code === "AI_UNAVAILABLE") {
        setErrorMessage(
          "The AI provider is temporarily unavailable right now. Please try again shortly."
        );
      } else if (code === "AI_COOLDOWN") {
        const seconds = Number(error.response?.data?.retryAfterSeconds);
        setErrorMessage(
          Number.isFinite(seconds) && seconds > 0
            ? `Please wait about ${seconds} seconds before requesting fresh AI insights.`
            : "Please wait a little before requesting fresh AI insights."
        );
      } else if (
        !error.response &&
        (error.request || error.message === "Network Error")
      ) {
        setErrorMessage("Unable to reach the AI insights service. Check your connection and try again.");
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "AI insights could not be generated. Please try again."
        );
      }
    } finally {
      setLoading(false);
      requestInFlight.current = false;
    }
  };

  const renderList = (items, emptyMessage) =>
    items.length ? (
      <ul>
        {items.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="ai-insights-empty-list">{emptyMessage}</p>
    );

  return (
    <section className="ai-insights-panel" aria-labelledby="ai-insights-title">
      <div className="ai-insights-heading">
        <div>
          <p className="eyebrow">PERSONALIZED FOR YOUR MONEY HABITS</p>
          <h2 id="ai-insights-title">
            <AutoAwesomeRoundedIcon aria-hidden="true" />
            AI Financial Insights
          </h2>
          <p className="panel-subtitle">
            Understand your spending and grow better money habits.
          </p>
        </div>
        <button
          type="button"
          className="ai-insights-action"
          onClick={handleGenerate}
          disabled={loading || (frequency === "custom" && (!startDate || !endDate))}
        >
          <InsightsRoundedIcon aria-hidden="true" />
          {loading ? "Analyzing…" : result ? "Generate again" : "Generate insights"}
        </button>
      </div>

      <p className="ai-insights-privacy">
        Only aggregated totals, categories, trends, and period dates are sent to the AI
        service—never transaction titles, descriptions, account IDs, or credentials.
      </p>

      {loading && (
        <div className="ai-insights-status" role="status" aria-live="polite">
          <span className="ai-insights-spinner" aria-hidden="true" />
          Analyzing your spending…
        </div>
      )}

      {errorMessage && (
        <div className="ai-insights-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={handleGenerate} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      {!loading && !errorMessage && !result && (
        <p className="ai-insights-prompt">
          Generate an on-demand review of the selected date range. No automatic AI
          requests are made.
        </p>
      )}

      {!loading && result && !result.hasTransactions && (
        <div className="ai-insights-empty" role="status">
          <p>
            There are no income or expense transactions in this period yet. Add
            transaction data to generate personalized insights.
          </p>
          {onAddTransaction && (
            <button type="button" onClick={onAddTransaction}>
              Add a transaction
            </button>
          )}
        </div>
      )}

      {!loading && result?.hasTransactions && (
        <>
          {result.cached && (
            <p className="ai-insights-prompt" role="status">
              Showing cached insights because the financial data for this period
              has not changed.
            </p>
          )}
          <p className="ai-insights-period">
            {result.period.label}: {formatDate(result.period.start)} –{" "}
            {formatDate(result.period.end)}
            {!result.comparisonAvailable &&
              " · Not enough previous-period data for a comparison"}
          </p>
          <div className="ai-insights-summary">
            <span className="ai-insights-section-icon" aria-hidden="true">
              <AutoAwesomeRoundedIcon />
            </span>
            <div>
              <h3>Financial Summary</h3>
              <p>{result.insights.summary}</p>
            </div>
          </div>
          <div className="ai-insights-grid">
            <article className="ai-insights-card ai-observations">
              <h3>Spending Observations</h3>
              {renderList(
                result.insights.observations,
                "There are no specific spending observations for this period."
              )}
            </article>
            <article className="ai-insights-card ai-suggestions">
              <h3>Suggestions</h3>
              {renderList(
                result.insights.suggestions,
                "No suggestions are available for this period."
              )}
            </article>
            <article className="ai-insights-card ai-positive-points">
              <h3>Positive Points</h3>
              {renderList(
                result.insights.positivePoints,
                "There isn’t enough data to identify a positive pattern yet."
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
};

export default AIInsights;
