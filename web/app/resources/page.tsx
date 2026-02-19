import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getResourcesByCategory } from "@/lib/loadResources";
import CategoryGrid from "@/components/CategoryGrid";

function getCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    counts[cat.slug] = getResourcesByCategory(cat.tag).length;
  }
  return counts;
}

export default function ResourcesPage() {
  const counts = getCounts();

  return (
    <main style={{ minHeight: "100vh", background: "var(--snow)" }}>
      {/* Page header */}
      <div
        style={{
          background: "linear-gradient(160deg, #0f2c4a 0%, #1a4a7a 60%, #2d5a7a 100%)",
          color: "#fff",
          padding: "3rem 1.5rem 2.5rem",
          textAlign: "center",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
          }}
        >
          ← Back to home
        </Link>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 5vw, 2.8rem)",
            fontWeight: 800,
            margin: "0 0 0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          Browse Resources
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Select a category to explore resources — sorted by community rank.
          Use the chat widget to get personalized guidance.
        </p>
      </div>

      {/* Category grid */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "2.5rem 1.25rem 4rem",
        }}
      >
        <CategoryGrid categories={CATEGORIES} counts={counts} />
      </div>
    </main>
  );
}
