
"use client";

import { useCallback, useMemo, useState } from "react";
import PayPalCheckout from "./paypal-checkout";

type Currency = "INR" | "USD";

type Transaction = {
  id: string;
  name: string;
  email: string;
  amount: number;
  currency?: Currency;
  date: string;
  status: "Completed" | "Pending" | "Failed";
  type: "Received" | "Sent";
  initials: string;
};

type RiskAssessment = {
  id: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  recommendation: string;
};

const initialTransactions: Transaction[] = [
  { id: "SP-1024", name: "Aarav Sharma", email: "aarav@example.com", amount: 2499, date: "Today, 10:24 AM", status: "Completed", type: "Received", initials: "AS" },
  { id: "SP-1023", name: "Design Studio", email: "billing@design.studio", amount: 5200, date: "Today, 9:12 AM", status: "Pending", type: "Sent", initials: "DS" },
  { id: "SP-1022", name: "Priya Patel", email: "priya@example.com", amount: 1250, date: "Yesterday, 4:45 PM", status: "Completed", type: "Received", initials: "PP" },
  { id: "SP-1021", name: "Cloud Services", email: "pay@cloud.example", amount: 899, date: "Yesterday, 2:18 PM", status: "Failed", type: "Sent", initials: "CS" },
  { id: "SP-1020", name: "Rohan Verma", email: "rohan@example.com", amount: 3750, date: "Oct 27, 11:30 AM", status: "Completed", type: "Received", initials: "RV" },
];

const navItems = [
  { label: "Overview", icon: "▦" },
  { label: "Transactions", icon: "⇄" },
  { label: "AI Assistant", icon: "✳" },
  { label: "Analytics", icon: "▥" },
];

const suggestions = [
  "Summarize my transactions",
  "How can I spot risky payments?",
  "Explain pending payments",
];

function formatAmount(amount: number, currency: Currency = "INR") {
  return new Intl.NumberFormat(
    currency === "INR" ? "en-IN" : "en-US",
    {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }
  ).format(amount);
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [assistantInput, setAssistantInput] = useState("");

  const [assistantMessages, setAssistantMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    {
      role: "assistant",
      text: "Hi! I'm your SmartPay assistant. I can help you understand your demo payment activity and explain common payment issues.",
    },
  ]);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("10.00");
  const [paymentName, setPaymentName] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [notice, setNotice] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [riskLoading, setRiskLoading] = useState(false);

  // PayPal checkout state
  const [paypalAmount, setPaypalAmount] = useState<number | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesFilter =
        filter === "All" || transaction.status === filter;

      const query = search.toLowerCase();

      const matchesSearch =
        transaction.name.toLowerCase().includes(query) ||
        transaction.id.toLowerCase().includes(query) ||
        transaction.email.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, search]);

  const completedCount = transactions.filter(
    (t) => t.status === "Completed"
  ).length;

  const totalReceived = transactions
    .filter(
      (t) =>
        t.type === "Received" &&
        t.status === "Completed" &&
        (t.currency ?? "INR") === "INR"
    )
    .reduce((sum, t) => sum + t.amount, 0);

  async function sendAssistantMessage(message = assistantInput) {
    const question = message.trim();

    if (!question || assistantLoading) return;

    setAssistantInput("");
    setActiveNav("AI Assistant");

    setAssistantMessages((messages) => [
      ...messages,
      { role: "user", text: question },
    ]);

    setAssistantLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          transactions: transactions.map((t) => ({
            id: t.id,
            name: t.name,
            amount: t.amount,
            currency: t.currency ?? "INR",
            date: t.date,
            status: t.status,
            type: t.type,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get AI response.");
      }

      setAssistantMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          text: data.reply || "I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setAssistantMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          text: errorMessage,
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  }

  async function analyzeFraudRisk() {
    if (riskLoading || transactions.length === 0) return;

    setRiskLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/fraud-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: transactions.map((t) => ({
            id: t.id,
            name: t.name,
            amount: t.amount,
            currency: t.currency ?? "INR",
            date: t.date,
            status: t.status,
            type: t.type,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Risk analysis failed.");
      }

      setRiskAssessments(data.assessments);
      setNotice("AI transaction risk analysis completed.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to analyze transaction risks."
      );
    } finally {
      setRiskLoading(false);
    }
  }

  // Validate the payment form and prepare PayPal checkout.
  function createDemoPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(paymentAmount);

    if (
      !paymentName.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(Math.round(amount * 100))
    ) {
      setNotice("Enter a recipient and a valid positive USD amount.");
      return;
    }

    setNotice("");
    setPaypalAmount(Number(amount.toFixed(2)));
  }

  // Called only after PayPal confirms a completed capture.
  const handlePayPalSuccess = useCallback(
    (details: {
      orderId: string;
      captureId: string | null;
    }) => {
      if (paypalAmount === null) return;

      const newTransaction: Transaction = {
        id: details.captureId || details.orderId,
        name: paymentName.trim(),
        email: "paypal-sandbox@example.com",
        amount: paypalAmount,
        currency: "USD",
        date: new Date().toLocaleString(),
        status: "Completed",
        type: "Sent",
        initials: paymentName.trim().slice(0, 2).toUpperCase(),
      };

      setTransactions((current) => [newTransaction, ...current]);
      setPaypalAmount(null);
      setShowPaymentForm(false);
      setPaymentName("");
      setPaymentAmount("10.00");
      setNotice("PayPal Sandbox payment completed successfully.");
      setActiveNav("Transactions");
      setFilter("All");
    },
    [paymentName, paypalAmount]
  );

  function closePaymentModal() {
    setShowPaymentForm(false);
    setPaypalAmount(null);
    setNotice("");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[245px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-7 md:flex">
          <button
            onClick={() => setActiveNav("Overview")}
            className="mb-10 flex items-center gap-3 text-left"
            aria-label="SmartPay home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-200">
              S
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                SmartPay<span className="text-indigo-600"> AI</span>
              </span>
              <span className="text-xs text-slate-500">
                Intelligent payments
              </span>
            </span>
          </button>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  activeNav === item.label
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
                {item.label === "AI Assistant" && (
                  <span className="ml-auto rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                    AI
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-9 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              ✳
            </div>
            <p className="text-sm font-semibold">Your AI co-pilot</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Understand payment activity with helpful explanations.
            </p>
            <button
              onClick={() => setActiveNav("AI Assistant")}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Open assistant →
            </button>
          </div>

          <div className="mt-auto pt-8">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                AJ
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  Demo Workspace
                </p>
                <p className="text-xs text-slate-500">Sandbox project</p>
              </div>
              <span className="ml-auto text-slate-400">···</span>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white md:hidden">
                S
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {activeNav === "Overview" ? "Good morning 👋" : activeNav}
                </p>
                <p className="text-xs text-slate-500">
                  Your payment workspace at a glance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 sm:flex">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Sandbox demo
              </span>

              <button
                onClick={() => {
                  setNotice("");
                  setPaypalAmount(null);
                  setShowPaymentForm(true);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <span className="mr-1">＋</span> New payment
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            {notice && (
              <div
                role="status"
                className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
              >
                <span>{notice}</span>
                <button
                  onClick={() => setNotice("")}
                  className="font-bold"
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            )}

            {activeNav === "Overview" && (
              <>
                <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      Overview
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                      Track demo payment activity and explore your AI tools.
                    </p>
                  </div>
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                    Sample workspace · INR / USD
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Demo received"
                    value={formatAmount(totalReceived, "INR")}
                    change="Sample INR ledger total"
                    icon="↙"
                    color="indigo"
                  />
                  <StatCard
                    title="Transactions"
                    value={String(transactions.length)}
                    change="All demo records"
                    icon="⇄"
                    color="blue"
                  />
                  <StatCard
                    title="Completed"
                    value={String(completedCount)}
                    change="Marked completed in demo"
                    icon="✓"
                    color="emerald"
                  />
                  <StatCard
                    title="Pending review"
                    value={String(
                      transactions.filter((t) => t.status === "Pending").length
                    )}
                    change="Check before fulfillment"
                    icon="◷"
                    color="amber"
                  />
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold">Payment activity</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Illustrative weekly activity · not live account data
                        </p>
                      </div>
                      <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                        Last 7 days⌄
                      </span>
                    </div>

                    <div className="mt-8 flex h-48 items-end justify-between gap-2 sm:gap-4">
                      {[
                        { day: "Mon", received: 42, sent: 24 },
                        { day: "Tue", received: 66, sent: 34 },
                        { day: "Wed", received: 52, sent: 27 },
                        { day: "Thu", received: 82, sent: 42 },
                        { day: "Fri", received: 61, sent: 30 },
                        { day: "Sat", received: 92, sent: 48 },
                        { day: "Sun", received: 72, sent: 35 },
                      ].map((bar) => (
                        <div
                          key={bar.day}
                          className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                        >
                          <div className="flex h-full w-full items-end justify-center gap-1">
                            <div
                              title={`${bar.received}% illustrative received activity`}
                              className="w-3 rounded-t-md bg-indigo-500 sm:w-5"
                              style={{ height: `${bar.received}%` }}
                            />
                            <div
                              title={`${bar.sent}% illustrative sent activity`}
                              className="w-3 rounded-t-md bg-indigo-100 sm:w-5"
                              style={{ height: `${bar.sent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {bar.day}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                        Received activity
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm bg-indigo-100" />
                        Sent activity
                      </span>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium">
                        SMART INSIGHTS
                      </span>
                      <span className="text-xl">✳</span>
                    </div>

                    <h2 className="mt-6 text-xl font-bold">
                      Payments, made clearer.
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-indigo-100">
                      Ask questions about demo transactions, understand
                      pending payments, and learn safer payment practices.
                    </p>

                    <div className="mt-5 space-y-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => sendAssistantMessage(suggestion)}
                          className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-left text-xs transition hover:bg-white/20"
                        >
                          {suggestion}
                          <span>↗</span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveNav("AI Assistant")}
                      className="mt-5 w-full rounded-xl bg-white py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >
                      Explore AI assistant →
                    </button>
                  </div>
                </div>

                <TransactionTable
                  transactions={transactions.slice(0, 4)}
                  onViewAll={() => setActiveNav("Transactions")}
                />
              </>
            )}

            {activeNav === "Transactions" && (
              <>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Transactions
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Search and filter your sample payment ledger.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name, email or transaction ID..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:max-w-sm"
                    />

                    <div className="flex flex-wrap gap-2">
                      {["All", "Completed", "Pending", "Failed"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              filter === status
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {status}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        AI Fraud Risk Analysis
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Analyze demo transactions for potential risk signals.
                      </p>
                    </div>

                    <button
                      onClick={analyzeFraudRisk}
                      disabled={riskLoading || transactions.length === 0}
                      className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {riskLoading ? "Analyzing..." : "✳ Analyze Risk"}
                    </button>
                  </div>

                  <TransactionTable transactions={filteredTransactions} />

                  {riskAssessments.length > 0 && (
                    <div className="mt-6">
                      <h2 className="mb-2 text-lg font-bold text-slate-900">
                        AI Risk Assessment Results
                      </h2>
                      <p className="mb-4 text-xs text-slate-500">
                        AI-generated demo estimates, not confirmed fraud
                        detection.
                      </p>

                      <div className="space-y-3">
                        {filteredTransactions.map((transaction) => {
                          const assessment = riskAssessments.find(
                            (item) => item.id === transaction.id
                          );

                          if (!assessment) return null;

                          const riskColor =
                            assessment.riskLevel === "High"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : assessment.riskLevel === "Medium"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700";

                          return (
                            <div
                              key={assessment.id}
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold text-slate-900">
                                    {transaction.name}
                                  </h3>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {transaction.id} ·{" "}
                                    {formatAmount(
                                      transaction.amount,
                                      transaction.currency ?? "INR"
                                    )}
                                  </p>
                                </div>

                                <div
                                  className={`rounded-lg border px-3 py-2 text-sm font-bold ${riskColor}`}
                                >
                                  {assessment.riskLevel} Risk ·{" "}
                                  {assessment.riskScore}/100
                                </div>
                              </div>

                              <div className="mt-4">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Risk signals
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                                  {assessment.reasons.map((reason, index) => (
                                    <li key={index}>{reason}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                                <p className="text-xs font-bold text-slate-500">
                                  Recommendation
                                </p>
                                <p className="mt-1 text-sm text-slate-700">
                                  {assessment.recommendation}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredTransactions.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No matching demo transactions.
                    </p>
                  )}
                </div>
              </>
            )}

            {activeNav === "AI Assistant" && (
              <>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  AI Payment Assistant
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Ask about demo payment activity and safe payment practices.
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
                  <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-700">
                        ✳
                      </div>
                      <div>
                        <p className="font-bold">SmartPay Copilot</p>
                        <p className="mt-1 text-xs text-slate-500">
                          AI-powered demo assistant
                        </p>
                      </div>
                      <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                        AI
                      </span>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5">
                      {assistantMessages.map((message, index) => (
                        <div
                          key={`${index}-${message.role}`}
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                              message.role === "user"
                                ? "rounded-br-md bg-indigo-600 text-white"
                                : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}

                      {assistantLoading && (
                        <div className="text-sm text-slate-400">
                          SmartPay AI is thinking...
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 bg-white p-4">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => sendAssistantMessage(suggestion)}
                            disabled={assistantLoading}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          sendAssistantMessage();
                        }}
                        className="flex gap-2"
                      >
                        <input
                          value={assistantInput}
                          onChange={(event) =>
                            setAssistantInput(event.target.value)
                          }
                          placeholder="Ask about your demo payments..."
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          type="submit"
                          disabled={assistantLoading}
                          className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Send ↑
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="font-bold">What it can do</h3>
                      <ul className="mt-4 space-y-3 text-sm text-slate-600">
                        <li>✓ Summarize sample transactions</li>
                        <li>✓ Explain pending and failed statuses</li>
                        <li>✓ Share general payment safety tips</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-sm font-bold text-amber-900">
                        Development note
                      </p>
                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        This is a hackathon prototype. AI responses and risk
                        estimates are for demonstration, not financial or
                        fraud-detection decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeNav === "Analytics" && (
              <>
                <h1 className="text-2xl font-bold sm:text-3xl">Analytics</h1>
                <p className="mt-2 text-sm text-slate-500">
                  A quick view of the current sample ledger.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard
                    title="Total records"
                    value={String(transactions.length)}
                    change="Sample data only"
                    icon="▦"
                    color="indigo"
                  />
                  <StatCard
                    title="Completed rate"
                    value={`${
                      transactions.length
                        ? Math.round(
                            (completedCount / transactions.length) * 100
                          )
                        : 0
                    }%`}
                    change="Based on demo statuses"
                    icon="↗"
                    color="emerald"
                  />
                  <StatCard
                    title="Received amount"
                    value={formatAmount(totalReceived, "INR")}
                    change="Completed incoming INR demos"
                    icon="₹"
                    color="blue"
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h2 className="font-bold">Status breakdown</h2>

                  <div className="mt-5 space-y-5">
                    {(["Completed", "Pending", "Failed"] as const).map(
                      (status) => {
                        const count = transactions.filter(
                          (t) => t.status === status
                        ).length;

                        const percentage = transactions.length
                          ? (count / transactions.length) * 100
                          : 0;

                        const barColor =
                          status === "Completed"
                            ? "bg-emerald-500"
                            : status === "Pending"
                              ? "bg-amber-400"
                              : "bg-rose-500";

                        return (
                          <div key={status}>
                            <div className="mb-2 flex justify-between text-sm">
                              <span className="text-slate-600">{status}</span>
                              <span className="font-semibold">
                                {count}{" "}
                                <span className="font-normal text-slate-400">
                                  ({Math.round(percentage)}%)
                                </span>
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </>
            )}

            <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
              <span>© 2026 SmartPay AI · Hackathon prototype</span>
              <span>Sandbox demo · No real money is moved</span>
            </footer>
          </div>
        </section>
      </div>

      {/* PayPal payment modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {paypalAmount === null
                    ? "Create PayPal payment"
                    : "Complete PayPal payment"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  PayPal Sandbox · Test transaction only
                </p>
              </div>

              <button
                onClick={closePaymentModal}
                className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-100"
                aria-label="Close payment form"
              >
                ×
              </button>
            </div>

            {paypalAmount === null ? (
              <form onSubmit={createDemoPayment} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="recipient"
                    className="mb-2 block text-sm font-medium"
                  >
                    Recipient name
                  </label>
                  <input
                    id="recipient"
                    value={paymentName}
                    onChange={(event) => setPaymentName(event.target.value)}
                    placeholder="e.g. Example Store"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-medium"
                  >
                    Amount (USD)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    max="10000"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) =>
                      setPaymentAmount(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  This creates a PayPal Sandbox order. Use a Sandbox test
                  buyer account to approve it. No real money is transferred.
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Continue to PayPal →
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Recipient</p>
                  <p className="font-semibold">{paymentName}</p>
                  <p className="mt-3 text-xs text-slate-500">Payment amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatAmount(paypalAmount, "USD")}
                  </p>
                </div>

                <p className="text-sm text-slate-600">
                  Choose PayPal below to continue with the Sandbox checkout.
                </p>

                <PayPalCheckout
                  amount={paypalAmount}
                  onSuccess={handlePayPalSuccess}
                />

                <button
                  type="button"
                  onClick={() => setPaypalAmount(null)}
                  className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  change,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: "indigo" | "blue" | "emerald" | "amber";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/60">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{title}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg font-semibold ${colors[color]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] leading-4 text-slate-400">{change}</p>
    </div>
  );
}

function TransactionTable({
  transactions,
  onViewAll,
}: {
  transactions: Transaction[];
  onViewAll?: () => void;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="font-bold">Recent transactions</h2>
          <p className="mt-1 text-xs text-slate-500">
            Example payment activity
          </p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all →
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] text-left text-sm">
          <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-3 font-semibold">Recipient</th>
              <th className="px-4 py-3 font-semibold">Transaction ID</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition hover:bg-slate-50/80"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">
                      {transaction.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {transaction.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 font-mono text-xs text-slate-500">
                  {transaction.id}
                </td>

                <td className="px-4 py-4 text-xs text-slate-500">
                  {transaction.date}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      transaction.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : transaction.status === "Pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        transaction.status === "Completed"
                          ? "bg-emerald-500"
                          : transaction.status === "Pending"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                    />
                    {transaction.status}
                  </span>
                </td>

                <td
                  className={`px-6 py-4 text-right font-semibold ${
                    transaction.type === "Received"
                      ? "text-emerald-700"
                      : "text-slate-800"
                  }`}
                >
                  {transaction.type === "Received" ? "+" : "−"}
                  {formatAmount(
                    transaction.amount,
                    transaction.currency ?? "INR"
                  )}
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
