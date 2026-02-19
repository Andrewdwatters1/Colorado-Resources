"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import RatingPrompt from "./RatingPrompt";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hey there — I'm Colo, your Colorado resource guide. I'm here to help you find support, navigate resources, or just talk through what's on your mind.\n\nWhat's going on today?",
};

const SUGGESTED_PROMPTS = [
  "I need help finding housing",
  "Where can I get food assistance?",
  "I'm a veteran looking for support",
  "I need mental health resources",
  "I'm looking for employment help",
];

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
      setStreamingContent("");

      // Reset textarea height
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      // Attempt the API call; on failure wait 1 s then retry once.
      const fetchWithRetry = async (): Promise<Response> => {
        const body = JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });
        const opts: RequestInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        };
        const first = await fetch("/api/chat", opts);
        if (first.ok) return first;
        // Wait 1 s then try exactly once more
        await new Promise((r) => setTimeout(r, 1000));
        return fetch("/api/chat", opts);
      };

      try {
        const res = await fetchWithRetry();

        if (!res.ok) throw new Error(`API error ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setStreamingContent(full);
          scrollToBottom();
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: full },
        ]);
        setStreamingContent("");
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting right now. Please try again in a moment — or if you need immediate help, you can always call **211** (Colorado's community resource line) or text/call **988** for crisis support.",
          },
        ]);
        setStreamingContent("");
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, scrollToBottom]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-grow
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const renderContent = (content: string) => {
    // Convert markdown-lite to JSX
    const lines = content.split("\n");
    return lines.map((line, i) => {
      // Bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        // URLs
        const urlParts = part.split(/(https?:\/\/[^\s,)]+)/g).map((p, k) => {
          if (p.startsWith("http")) {
            return (
              <a key={k} href={p} target="_blank" rel="noopener noreferrer">
                {p}
              </a>
            );
          }
          return p;
        });
        return <span key={j}>{urlParts}</span>;
      });

      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <li key={i} style={{ marginLeft: "1rem", listStyleType: "disc" }}>
            {parts}
          </li>
        );
      }
      if (line === "") return <br key={i} />;
      return <p key={i} style={{ margin: "0 0 0.35rem" }}>{parts}</p>;
    });
  };

  const showSuggested = messages.length === 1 && !loading;

  return (
    <section
      id="chat"
      style={{
        background: "var(--snow)",
        borderTop: "1px solid var(--border)",
        minHeight: "calc(100vh - 480px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2.5rem 1rem 2rem",
      }}
    >
      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--sky)",
            margin: 0,
          }}
        >
          Talk to Colo
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            marginTop: "0.4rem",
            fontSize: "0.95rem",
          }}
        >
          Ask about resources, or just start a conversation.
        </p>
      </div>

      {/* Chat window */}
      <div
        style={{
          width: "100%",
          maxWidth: "780px",
          background: "#fff",
          borderRadius: "1.25rem",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px rgba(26,74,122,0.08)",
          display: "flex",
          flexDirection: "column",
          minHeight: "520px",
          maxHeight: "72vh",
          overflow: "hidden",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "var(--sky)",
            borderRadius: "1.25rem 1.25rem 0 0",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            🏔️
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#fff",
                fontSize: "0.95rem",
                lineHeight: 1.2,
              }}
            >
              Colo
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              Colorado Resource Guide
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                display: "inline-block",
              }}
            />
            Online
          </div>
        </div>

        {/* Messages */}
        <div
          className="chat-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.25rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {messages.map((msg, i) => (
            <div key={i} className="fade-in">
              <div
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: "0.5rem",
                }}
              >
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "var(--sky)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                  >
                    🏔️
                  </div>
                )}
                <div
                  className={msg.role === "assistant" ? "bot-message" : ""}
                  style={{
                    maxWidth: "75%",
                    padding: "0.7rem 1rem",
                    borderRadius:
                      msg.role === "user"
                        ? "1.1rem 1.1rem 0.25rem 1.1rem"
                        : "1.1rem 1.1rem 1.1rem 0.25rem",
                    background:
                      msg.role === "user" ? "var(--sky)" : "#f0f4f9",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                    fontSize: "0.9rem",
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                  }}
                >
                  {renderContent(msg.content)}
                </div>
              </div>
              {/* Rating prompt — only for AI responses that follow a user message */}
              {msg.role === "assistant" && i > 0 && !loading && (
                <div style={{ paddingLeft: "calc(30px + 0.5rem)" }}>
                  <RatingPrompt
                    messageIndex={i}
                    messageContent={msg.content}
                    conversationSnapshot={messages.slice(0, i + 1)}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Streaming response */}
          {streamingContent && (
            <div
              className="fade-in"
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--sky)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                🏔️
              </div>
              <div
                className="bot-message"
                style={{
                  maxWidth: "75%",
                  padding: "0.7rem 1rem",
                  borderRadius: "1.1rem 1.1rem 1.1rem 0.25rem",
                  background: "#f0f4f9",
                  color: "var(--text)",
                  fontSize: "0.9rem",
                  lineHeight: 1.55,
                }}
              >
                {renderContent(streamingContent)}
              </div>
            </div>
          )}

          {/* Typing indicator (before streaming starts) */}
          {loading && !streamingContent && (
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--sky)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                🏔️
              </div>
              <div
                style={{
                  padding: "0.7rem 1.1rem",
                  borderRadius: "1.1rem 1.1rem 1.1rem 0.25rem",
                  background: "#f0f4f9",
                  display: "flex",
                  gap: "0.3rem",
                  alignItems: "center",
                }}
              >
                <span
                  className="typing-dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    display: "inline-block",
                  }}
                />
                <span
                  className="typing-dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    display: "inline-block",
                  }}
                />
                <span
                  className="typing-dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    display: "inline-block",
                  }}
                />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {showSuggested && (
          <div
            style={{
              padding: "0.75rem 1.25rem 0.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.4rem",
            }}
          >
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "999px",
                  border: "1px solid var(--sky-light)",
                  background: "transparent",
                  color: "var(--sky)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLButtonElement).style.background =
                    "rgba(26,74,122,0.06)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLButtonElement).style.background =
                    "transparent")
                }
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div
          style={{
            padding: "0.75rem 1.25rem 1rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "0.6rem",
            alignItems: "flex-end",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Shift+Enter for new line)"
            rows={1}
            disabled={loading}
            style={{
              flex: 1,
              resize: "none",
              border: "1.5px solid var(--border)",
              borderRadius: "0.75rem",
              padding: "0.6rem 0.9rem",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              lineHeight: 1.5,
              outline: "none",
              background: loading ? "#f5f7fa" : "#fff",
              color: "var(--text)",
              transition: "border-color 0.15s",
              overflowY: "hidden",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--sky-light)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--border)")
            }
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background:
                loading || !input.trim() ? "var(--border)" : "var(--sky)",
              color: "#fff",
              cursor: loading || !input.trim() ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
              fontSize: "1rem",
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Crisis footer note */}
      <p
        style={{
          marginTop: "1rem",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        If you or someone you know is in crisis, call or text{" "}
        <a
          href="tel:988"
          style={{ color: "var(--sky-light)", fontWeight: 600 }}
        >
          988
        </a>{" "}
        (Suicide &amp; Crisis Lifeline) or call{" "}
        <a
          href="tel:911"
          style={{ color: "var(--sky-light)", fontWeight: 600 }}
        >
          911
        </a>{" "}
        for emergencies. Domestic violence support:{" "}
        <a
          href="tel:18007997233"
          style={{ color: "var(--sky-light)", fontWeight: 600 }}
        >
          1-800-799-7233
        </a>
        .
      </p>
    </section>
  );
}
