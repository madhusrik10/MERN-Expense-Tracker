import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import AIInsights from "./AIInsights";
import { aiInsightsAPI } from "../../utils/ApiRequest";

jest.mock("axios", () => ({
  post: jest.fn(),
}));

describe("AIInsights", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    axios.post.mockReset();
  });

  test("requests authenticated insights and renders each response section", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        hasTransactions: true,
        period: {
          start: "2026-03-01T00:00:00.000Z",
          end: "2026-03-07T23:59:59.999Z",
          label: "Custom range",
        },
        comparisonAvailable: false,
        insights: {
          summary: "Income exceeded expenses in this period.",
          observations: ["Food was the highest spending category."],
          suggestions: ["Review food spending next week."],
          positivePoints: ["Income was recorded during the period."],
        },
      },
    });

    render(
      <AIInsights
        frequency="7"
        startDate={null}
        endDate={null}
        dataRevision={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

    expect(await screen.findByText("Income exceeded expenses in this period.")).toBeInTheDocument();
    expect(screen.getByText("Food was the highest spending category.")).toBeInTheDocument();
    expect(screen.getByText("Review food spending next week.")).toBeInTheDocument();
    expect(screen.getByText("Income was recorded during the period.")).toBeInTheDocument();
    expect(axios.post).toHaveBeenCalledWith(
      aiInsightsAPI,
      { frequency: "7", startDate: null, endDate: null },
      { headers: { Authorization: "Bearer test-token" } }
    );
  });

  test("shows a provider quota message and allows a manual retry", async () => {
    axios.post
      .mockRejectedValueOnce({
        response: {
          data: { code: "AI_RATE_LIMIT" },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          hasTransactions: false,
          period: {
            start: "2026-03-01T00:00:00.000Z",
            end: "2026-03-07T23:59:59.999Z",
            label: "Last 7 days",
          },
          comparisonAvailable: false,
          insights: null,
        },
      });

    render(
      <AIInsights
        frequency="7"
        startDate={null}
        endDate={null}
        dataRevision={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

    expect(
      await screen.findByText(/provider usage limit has been reached/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByText(/no income or expense transactions in this period/i)
    ).toBeInTheDocument();
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));
  });

  test("shows a provider timeout message and allows a manual retry", async () => {
    axios.post
      .mockRejectedValueOnce({
        request: {},
        response: {
          status: 504,
          data: {
            code: "AI_TIMEOUT",
            message: "The AI provider is taking too long to respond. Please try again shortly.",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          hasTransactions: false,
          period: {
            start: "2026-03-01T00:00:00.000Z",
            end: "2026-03-07T23:59:59.999Z",
            label: "Last 7 days",
          },
          comparisonAvailable: false,
          insights: null,
        },
      });

    render(
      <AIInsights
        frequency="7"
        startDate={null}
        endDate={null}
        dataRevision={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

    expect(
      await screen.findByText(
        "The AI provider is taking too long to respond. Please try again shortly."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Analyzing your spending…")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByText(/no income or expense transactions in this period/i)
    ).toBeInTheDocument();
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));
  });

  test("distinguishes a temporary provider 503 from a client network failure", async () => {
    axios.post.mockRejectedValue({
      request: {},
      response: {
        status: 503,
        data: { code: "AI_UNAVAILABLE" },
      },
    });

    render(
      <AIInsights
        frequency="7"
        startDate={null}
        endDate={null}
        dataRevision={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

    expect(
      await screen.findByText(
        "The AI provider is temporarily unavailable right now. Please try again shortly."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/unable to reach the AI insights service/i)
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("Analyzing your spending…")).not.toBeInTheDocument();
  });

  test("uses the connection message for an actual client network failure", async () => {
    axios.post.mockRejectedValue({
      request: {},
      message: "Network Error",
    });

    render(
      <AIInsights
        frequency="7"
        startDate={null}
        endDate={null}
        dataRevision={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

    expect(
      await screen.findByText(
        "Unable to reach the AI insights service. Check your connection and try again."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("Analyzing your spending…")).not.toBeInTheDocument();
  });

  test("does not submit duplicate requests while one is already in flight", async () => {
    let resolveRequest;
    axios.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(
      <AIInsights
        frequency="7"
        startDate={null}
        endDate={null}
        dataRevision={false}
      />
    );
    const generateButton = screen.getByRole("button", {
      name: "Generate insights",
    });
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    expect(axios.post).toHaveBeenCalledTimes(1);
    resolveRequest({
      data: {
        success: true,
        hasTransactions: false,
        period: {
          start: "2026-03-01T00:00:00.000Z",
          end: "2026-03-07T23:59:59.999Z",
          label: "Last 7 days",
        },
        comparisonAvailable: false,
        insights: null,
      },
    });
    await waitFor(() =>
      expect(
        screen.getByText(/no income or expense transactions in this period/i)
      ).toBeInTheDocument()
    );
  });

  test("explains the user cooldown and keeps a manual retry action", async () => {
    axios.post.mockRejectedValue({
      response: {
        data: {
          code: "AI_COOLDOWN",
          retryAfterSeconds: 37,
        },
      },
    });

    render(
      <AIInsights
        frequency="7"
        startDate={null}
        endDate={null}
        dataRevision={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

    expect(
      await screen.findByText(/wait about 37 seconds before requesting fresh AI insights/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
