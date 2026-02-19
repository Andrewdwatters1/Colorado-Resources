"use client";

import { useState, useEffect, useCallback } from "react";
import type { Resource } from "@/lib/loadResources";
import type { VoteMap } from "@/lib/voteStore";

interface Props {
  initialResources: Resource[];
  initialVotes: VoteMap;
}

interface RankedResource extends Resource {
  rank: number;
  up: number;
  down: number;
}

const VOTED_KEY = "colo_voted";

function getLocalVoted(): Record<string, "up" | "down"> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveLocalVote(name: string, dir: "up" | "down") {
  const voted = getLocalVoted();
  voted[name] = dir;
  localStorage.setItem(VOTED_KEY, JSON.stringify(voted));
}

function mergeRanks(resources: Resource[], votes: VoteMap): RankedResource[] {
  return resources
    .map((r) => {
      const v = votes[r.name] ?? { up: 0, down: 0 };
      return {
        ...r,
        up: v.up,
        down: v.down,
        rank: v.up - v.down,
      };
    })
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.name.localeCompare(b.name);
    });
}

export default function ResourceList({ initialResources, initialVotes }: Props) {
  const [votes, setVotes] = useState<VoteMap>(initialVotes);
  const [localVoted, setLocalVoted] = useState<Record<string, "up" | "down">>({});
  const [voting, setVoting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLocalVoted(getLocalVoted());
  }, []);

  const ranked = mergeRanks(initialResources, votes);

  const filtered = search.trim()
    ? ranked.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.info.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : ranked;

  const handleVote = useCallback(
    async (resourceName: string, direction: "up" | "down") => {
      if (voting) return;
      const prev = localVoted[resourceName];
      if (prev === direction) return; // same vote → no-op

      setVoting(resourceName);
      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceName, direction }),
        });
        if (res.ok) {
          const { votes: newVotes } = await res.json();
          setVotes(newVotes);
          const newLocal = { ...localVoted, [resourceName]: direction };
          setLocalVoted(newLocal);
          saveLocalVote(resourceName, direction);
        }
      } catch {
        // fail silently — vote didn't register
      } finally {
        setVoting(null);
      }
    },
    [voting, localVoted]
  );

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: "1.25rem" }}>
        <input
          type="search"
          placeholder="Search within these resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.65rem 1rem",
            borderRadius: "0.75rem",
            border: "1.5px solid var(--border)",
            fontSize: "0.92rem",
            fontFamily: "inherit",
            color: "var(--text)",
            outline: "none",
            background: "#fff",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--sky-light)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Result count */}
      <p
        style={{
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          marginBottom: "1rem",
        }}
      >
        {filtered.length.toLocaleString()} resource{filtered.length !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : " — sorted by community rank"}
      </p>

      {/* Resource cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {filtered.map((r) => {
          const userVote = localVoted[r.name];
          const isVoting = voting === r.name;

          return (
            <div
              key={r.name}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "1rem",
                padding: "1.1rem 1.25rem",
                boxShadow: "0 2px 8px rgba(26,74,122,0.05)",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              {/* Vote column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                  flexShrink: 0,
                  minWidth: 44,
                }}
              >
                <button
                  onClick={() => handleVote(r.name, "up")}
                  disabled={isVoting}
                  title="Upvote — this resource is helpful"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: `1.5px solid ${userVote === "up" ? "#2d6a4f" : "var(--border)"}`,
                    background: userVote === "up" ? "#e8f5ee" : "transparent",
                    color: userVote === "up" ? "#2d6a4f" : "var(--text-muted)",
                    cursor: isVoting ? "default" : "pointer",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s, border-color 0.15s",
                    opacity: isVoting ? 0.5 : 1,
                  }}
                >
                  ↑
                </button>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color:
                      r.rank > 0
                        ? "#2d6a4f"
                        : r.rank < 0
                        ? "#c0392b"
                        : "var(--text-muted)",
                  }}
                >
                  {r.rank > 0 ? `+${r.rank}` : r.rank}
                </span>
                <button
                  onClick={() => handleVote(r.name, "down")}
                  disabled={isVoting}
                  title="Downvote — contact info may be outdated"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: `1.5px solid ${userVote === "down" ? "#c0392b" : "var(--border)"}`,
                    background: userVote === "down" ? "#fdecea" : "transparent",
                    color: userVote === "down" ? "#c0392b" : "var(--text-muted)",
                    cursor: isVoting ? "default" : "pointer",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s, border-color 0.15s",
                    opacity: isVoting ? 0.5 : 1,
                  }}
                >
                  ↓
                </button>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      lineHeight: 1.3,
                    }}
                  >
                    {r.name}
                  </h3>
                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {r.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          padding: "0.1rem 0.5rem",
                          borderRadius: "999px",
                          background: "rgba(26,74,122,0.08)",
                          color: "var(--sky)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact row */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.6rem 1.2rem",
                    marginBottom: r.info ? "0.5rem" : 0,
                    fontSize: "0.84rem",
                  }}
                >
                  {r.phone && (
                    <a
                      href={`tel:${r.phone.replace(/\D/g, "")}`}
                      style={{
                        color: "var(--sky-light)",
                        textDecoration: "none",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      📞 {r.phone}
                    </a>
                  )}
                  {r.web && r.web !== "not found" && (
                    <a
                      href={r.web.startsWith("http") ? r.web : `https://${r.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--sky-light)",
                        textDecoration: "none",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        maxWidth: 260,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🌐 Website
                    </a>
                  )}
                  {r.email && r.email !== "not found" && (
                    <a
                      href={`mailto:${r.email}`}
                      style={{
                        color: "var(--sky-light)",
                        textDecoration: "none",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      ✉️ Email
                    </a>
                  )}
                  {r.address && (
                    <span
                      style={{
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      📍 {r.address}
                    </span>
                  )}
                </div>

                {/* Details */}
                {r.info && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.84rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {r.info}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No resources found</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.88rem" }}>
              Try a different search term or{" "}
              <a href="/resources" style={{ color: "var(--sky-light)" }}>
                browse all categories
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
