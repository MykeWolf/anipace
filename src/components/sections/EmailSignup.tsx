"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <p className="text-[0.875rem] text-accent">
        You&apos;re in. We&apos;ll be in touch.
      </p>
    );
  }

  const busy = status === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="email-signup"
        className="text-[0.8125rem] text-foreground-muted font-medium"
      >
        Get updates when new features drop
      </label>
      <div className="flex gap-2">
        <input
          id="email-signup"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={busy}
          className="
            flex-1 rounded-lg bg-foreground/5 border border-border
            px-3 py-2 text-[0.875rem] text-foreground
            placeholder:text-foreground-muted/40
            focus:outline-none focus:border-accent/50
            disabled:opacity-50
          "
        />
        <button
          type="submit"
          disabled={busy}
          className="
            rounded-lg bg-accent text-[#0f0f0f] font-semibold
            text-[0.875rem] px-4 py-2
            hover:opacity-90 disabled:opacity-50 transition-opacity
          "
        >
          {busy ? "..." : "Join"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-[0.75rem] text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
