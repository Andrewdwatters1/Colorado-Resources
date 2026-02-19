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

/**
 * Returns true when an assistant response looks like it has delivered
 * concrete resources, a solution, or actionable help — i.e. a good
 * moment to ask for feedback.
 */
export function isResourcefulResponse(content: string): boolean {
  if (content.length < 150) return false;
  const lower = content.toLowerCase();

  // Two or more bullet-point lines → resource list was given
  const bulletCount = (content.match(/^[-•*]\s/gm) ?? []).length;
  if (bulletCount >= 2) return true;

  // Contains a formatted phone number
  if (/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(content)) return true;

  // Contains a URL
  if (/https?:\/\//.test(content)) return true;

  // Delivery / resolution phrasing
  const deliveryPhrases = [
    "here are",
    "here is ",
    "i recommend",
    "you can reach",
    "you can contact",
    "you can call",
    "can help you with",
    "resources available",
    "these organizations",
    "the following",
    "i hope this helps",
    "let me know if you need",
  ];
  return deliveryPhrases.some((p) => lower.includes(p));
}

export default function RatingPrompt({
  messageIndex,
  messageContent,
  conversationSnapshot,
  compact = false,
}: Props) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (rating: number) => {
    if (submitting) return;
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
    }
    // Always reflect the user's intent even if the API call failed
    setSelectedRating(rating);
    setSubmitting(false);
  };

  const size = compact ? 20 : 23;

  return (
    <div
      style={{
        marginTop: compact ? "0.5rem" : "0.65rem",
        paddingLeft: compact ? "0" : "0.25rem",
        opacity: submitting ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <div
        style={{
          fontSize: compact ? "0.67rem" : "0.72rem",
          color: "var(--text-muted)",
          marginBottom: "0.3rem",
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        Help us improve responses, how helpful was this?
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.2rem",
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const isSelected = selectedRating !== null && n <= selectedRating;
          const isExact = n === selectedRating;
          return (
            <button
              key={n}
              onClick={() => handleRate(n)}
              disabled={submitting}
              title={`Rate ${n}/10`}
              style={{
                width: size,
                height: size,
                borderRadius: 4,
                border: `1px solid ${isSelected ? "var(--sky)" : "var(--border)"}`,
                background: isSelected ? "var(--sky)" : "transparent",
                color: isSelected ? "#fff" : "var(--text-muted)",
                fontSize: compact ? "0.62rem" : "0.65rem",
                fontWeight: isExact ? 800 : 600,
                cursor: submitting ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.1s, border-color 0.1s, color 0.1s",
                fontFamily: "inherit",
                flexShrink: 0,
                padding: 0,
                outline: isExact ? "2px solid var(--sky-light)" : "none",
                outlineOffset: 1,
              }}
            >
              {n}
            </button>
          );
        })}
        {selectedRating !== null && (
          <span
            style={{
              fontSize: compact ? "0.65rem" : "0.7rem",
              color: "var(--sky)",
              fontWeight: 600,
              marginLeft: "0.35rem",
              whiteSpace: "nowrap",
            }}
          >
            ✓ {selectedRating}/10
          </span>
        )}
      </div>
    </div>
  );
}
