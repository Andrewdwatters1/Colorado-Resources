"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import RatingPrompt, { isResourcefulResponse } from "./RatingPrompt";

// ---------------------------------------------------------------------------
// Shared conversation context so messages persist across /resources/* pages
// ---------------------------------------------------------------------------
interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hey there — I'm Colo, your Colorado resource guide. I'm here to help you find support, navigate resources, or just talk through what's on your mind.\n\nWhat's going on today?",
};

interface ChatContextValue {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  resetChat: () => void;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);

  const resetChat = useCallback(() => {
    setMessages([WELCOME]);
  }, []);

  return (
    <ChatCtx.Provider value={{ messages, setMessages, resetChat }}>
      {children}
    </ChatCtx.Provider>
  );
}

function useChatContext() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer
// ---------------------------------------------------------------------------
function renderContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
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
    return (
      <p key={i} style={{ margin: "0 0 0.3rem" }}>
        {parts}
      </p>
    );
  });
}

// ---------------------------------------------------------------------------
// The widget itself
// ---------------------------------------------------------------------------
export default function FloatingChatWidget() {
  const { messages, setMessages, resetChat } = useChatContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [ratingTargetIdx, setRatingTargetIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, streamingContent, open, scrollToBottom]);

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

      if (textareaRef.current) textareaRef.current.style.height = "auto";

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

        setMessages((prev) => [...prev, { role: "assistant", content: full }]);
        setStreamingContent("");
        if (isResourcefulResponse(full)) {
          setRatingTargetIdx(nextMessages.length);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting right now. Try again in a moment — or call **211** or text/call **988** for immediate help.",
          },
        ]);
        setStreamingContent("");
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, setMessages, scrollToBottom]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
  };

  const unreadCount = open ? 0 : messages.length - 1;
  // Avatar width + gap → indent rating under the message bubble
  const RATING_INDENT = "calc(26px + 0.4rem)";

  return (
    <>
      {/* Expanded chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1.25rem",
            width: "min(370px, calc(100vw - 2.5rem))",
            height: "min(520px, calc(100vh - 8rem))",
            background: "#fff",
            borderRadius: "1.25rem",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 40px rgba(26,74,122,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000,
            animation: "fadeInUp 0.2s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--sky)",
              borderRadius: "1.25rem 1.25rem 0 0",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                flexShrink: 0,
              }}
            >
              🏔️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#fff",
                  fontSize: "0.88rem",
                  lineHeight: 1.2,
                }}
              >
                Colo
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.72)" }}>
                Colorado Resource Guide
              </div>
            </div>
            {/* Start over */}
            <button
              onClick={resetChat}
              title="Start over"
              style={{
                padding: "0.28rem 0.65rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.22)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.12)")
              }
            >
              ↺ Start over
            </button>
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                lineHeight: 1,
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.28)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.15)")
              }
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            className="chat-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0.9rem 0.9rem 0.4rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {messages.map((msg, i) => (
              <div key={i} className="fade-in">
                {/* Message row */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: "0.4rem",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "var(--sky)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      🏔️
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "0.55rem 0.8rem",
                      borderRadius:
                        msg.role === "user"
                          ? "1rem 1rem 0.2rem 1rem"
                          : "1rem 1rem 1rem 0.2rem",
                      background:
                        msg.role === "user" ? "var(--sky)" : "#f0f4f9",
                      color: msg.role === "user" ? "#fff" : "var(--text)",
                      fontSize: "0.83rem",
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {renderContent(msg.content)}
                  </div>
                </div>

                {/* Rating prompt — shown once, below the latest qualifying response */}
                {msg.role === "assistant" && i === ratingTargetIdx && !loading && (
                  <div style={{ paddingLeft: RATING_INDENT }}>
                    <RatingPrompt
                      messageIndex={i}
                      messageContent={msg.content}
                      conversationSnapshot={messages.slice(0, i + 1)}
                      compact
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming */}
            {streamingContent && (
              <div
                className="fade-in"
                style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem" }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--sky)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    flexShrink: 0,
                  }}
                >
                  🏔️
                </div>
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "0.55rem 0.8rem",
                    borderRadius: "1rem 1rem 1rem 0.2rem",
                    background: "#f0f4f9",
                    color: "var(--text)",
                    fontSize: "0.83rem",
                    lineHeight: 1.5,
                  }}
                >
                  {renderContent(streamingContent)}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {loading && !streamingContent && (
              <div
                style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem" }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--sky)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    flexShrink: 0,
                  }}
                >
                  🏔️
                </div>
                <div
                  style={{
                    padding: "0.55rem 0.8rem",
                    borderRadius: "1rem 1rem 1rem 0.2rem",
                    background: "#f0f4f9",
                    display: "flex",
                    gap: "0.28rem",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="typing-dot"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--text-muted)",
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "0.6rem 0.8rem 0.75rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "0.5rem",
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Colo anything…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                resize: "none",
                border: "1.5px solid var(--border)",
                borderRadius: "0.65rem",
                padding: "0.5rem 0.75rem",
                fontSize: "0.83rem",
                fontFamily: "inherit",
                lineHeight: 1.5,
                outline: "none",
                background: loading ? "#f5f7fa" : "#fff",
                color: "var(--text)",
                transition: "border-color 0.15s",
                overflowY: "hidden",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--sky-light)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
              style={{
                width: 34,
                height: 34,
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
                fontSize: "0.9rem",
                transition: "background 0.15s",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open Colo chat"}
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.25rem",
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #1a4a7a, #2d6da8)",
          color: "#fff",
          fontSize: open ? "1.4rem" : "1.6rem",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(26,74,122,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 24px rgba(26,74,122,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 20px rgba(26,74,122,0.4)";
        }}
      >
        {open ? "×" : "🏔️"}
        {!open && unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#e8a96a",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
