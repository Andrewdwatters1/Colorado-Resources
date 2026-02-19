import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug } from "@/lib/categories";
import { getResourcesByCategory } from "@/lib/loadResources";
import { getVotes } from "@/lib/voteStore";
import ResourceList from "@/components/ResourceList";

interface Props {
  params: Promise<{ category: string }>;
}

// Dynamic rendering — votes are fetched live from KV on each request
export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const resources = getResourcesByCategory(cat.tag);
  const votes = await getVotes();

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
          href="/resources"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
            transition: "color 0.15s",
          }}
        >
          ← All categories
        </Link>
        <div style={{ fontSize: "2.8rem", marginBottom: "0.5rem" }}>{cat.emoji}</div>
        <h1
          style={{
            fontSize: "clamp(1.6rem, 4.5vw, 2.6rem)",
            fontWeight: 800,
            margin: "0 0 0.6rem",
            letterSpacing: "-0.02em",
          }}
        >
          {cat.label}
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: "clamp(0.9rem, 2.2vw, 1.05rem)",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          {cat.description}
        </p>
        <div
          style={{
            marginTop: "1rem",
            display: "inline-block",
            padding: "0.25rem 0.85rem",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.15)",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {resources.length.toLocaleString()} resource{resources.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Rank explanation banner */}
      <div
        style={{
          background: "#f0f7ff",
          borderBottom: "1px solid #d0e4f7",
          padding: "0.65rem 1.5rem",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "var(--sky)",
        }}
      >
        <strong>Community Ranked</strong> — use ↑ / ↓ to vote on resource
        helpfulness. The most-upvoted resources appear first.
      </div>

      {/* Resource list */}
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "2rem 1.25rem 5rem",
        }}
      >
        <ResourceList initialResources={resources} initialVotes={votes} />
      </div>
    </main>
  );
}
