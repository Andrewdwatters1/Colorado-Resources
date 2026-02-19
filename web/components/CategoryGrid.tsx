"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category } from "@/lib/categories";

interface Props {
  categories: Category[];
  counts: Record<string, number>;
}

function CategoryCard({
  cat,
  count,
}: {
  cat: Category;
  count: number;
}) {
  const [hovered, setHovered] = useState(false);
  const isAll = cat.slug === "all";

  return (
    <Link
      href={`/resources/${cat.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem",
        background: isAll
          ? "linear-gradient(135deg, #1a4a7a, #2d6da8)"
          : "#fff",
        borderRadius: "1rem",
        border: isAll ? "none" : "1px solid var(--border)",
        textDecoration: "none",
        color: isAll ? "#fff" : "var(--text)",
        boxShadow: hovered
          ? isAll
            ? "0 8px 28px rgba(26,74,122,0.35)"
            : "0 6px 20px rgba(26,74,122,0.12)"
          : isAll
          ? "0 4px 20px rgba(26,74,122,0.25)"
          : "0 2px 8px rgba(26,74,122,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>{cat.emoji}</span>
      <span
        style={{
          fontWeight: 700,
          fontSize: "1rem",
          marginBottom: "0.35rem",
          color: isAll ? "#fff" : "var(--text)",
        }}
      >
        {cat.label}
      </span>
      <span
        style={{
          fontSize: "0.8rem",
          color: isAll ? "rgba(255,255,255,0.78)" : "var(--text-muted)",
          lineHeight: 1.45,
          flex: 1,
        }}
      >
        {cat.description}
      </span>
      <span
        style={{
          marginTop: "0.9rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: isAll ? "rgba(255,255,255,0.65)" : "var(--sky-light)",
        }}
      >
        {count.toLocaleString()} resource{count !== 1 ? "s" : ""}
      </span>
    </Link>
  );
}

export default function CategoryGrid({ categories, counts }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {categories.map((cat) => (
        <CategoryCard key={cat.slug} cat={cat} count={counts[cat.slug] ?? 0} />
      ))}
    </div>
  );
}
