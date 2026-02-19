"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  /** Index of the assistant message being rated in the full messages array */
  messageIndex: number;
  /** The assistant message content being rated */
  messageContent: string;
  /** Full conversation up to and including this message */
  conversationSnapshot: Message[];
  /** Compact mode for the floating widget (smaller layout) */
  compact?: boolean;
}

export default function RatingPrompt({
  messageIndex,
  messageContent,
  conversationSnapshot,
  compact = false,
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (rating: number) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          ratedMessageIndex: messageIndex,
          ratedMessage: messageContent,
          conversationSnapshot,
        }),
      });
    } catch {
      // fail silently — rating is best-effort
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          fontSize: compact ? "0.7rem" : "0.75rem",
          color: "var(--text-muted)",
          marginTop: "0.3rem",
          paddingLeft: compact ? "0" : "0.25rem",
          opacity: 0.7,
        }}
      >
        ✓ Thanks for the feedback
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.2rem",
        marginTop: "0.35rem",
        paddingLeft: compact ? "0" : "0.25rem",
        opacity: submitting ? 0.5 : 1,
      }}
    >
      <span
        style={{
          fontSize: compact ? "0.68rem" : "0.72rem",
          color: "var(--text-muted)",
          marginRight: "0.15rem",
          whiteSpace: "nowrap",
        }}
      >
        Helpful?
      </span>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
        const isHovered = hoveredRating !== null && n <= hoveredRating;
        const size = compact ? 20 : 23;
        return (
          <button
            key={n}
            onClick={() => handleRate(n)}
            onMouseEnter={() => setHoveredRating(n)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={submitting}
            title={`Rate ${n}/10`}
            style={{
              width: size,
              height: size,
              borderRadius: 4,
              border: `1px solid ${isHovered ? "var(--sky-light)" : "var(--border)"}`,
              background: isHovered ? "rgba(26,74,122,0.08)" : "transparent",
              color: isHovered ? "var(--sky)" : "var(--text-muted)",
              fontSize: compact ? "0.62rem" : "0.65rem",
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.1s, border-color 0.1s, color 0.1s",
              fontFamily: "inherit",
              flexShrink: 0,
              padding: 0,
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
