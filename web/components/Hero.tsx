"use client";

import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  const scrollToChat = () => {
    document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0f2c4a 0%, #1a4a7a 45%, #2d6a4f 100%)",
        color: "#fff",
        padding: "5rem 1.5rem 4rem",
        textAlign: "center",
      }}
    >
      {/* Decorative mountain silhouette */}
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 120,
          opacity: 0.18,
        }}
        aria-hidden="true"
      >
        <path
          d="M0,200 L0,140 L120,60 L200,110 L340,30 L460,100 L580,20 L700,90 L820,10 L940,80 L1060,30 L1180,100 L1300,50 L1440,120 L1440,200 Z"
          fill="#fff"
        />
      </svg>

      {/* Stars / dots */}
      {[
        { top: "12%", left: "8%", size: 3 },
        { top: "20%", left: "18%", size: 2 },
        { top: "8%",  left: "35%", size: 2 },
        { top: "15%", left: "55%", size: 3 },
        { top: "10%", left: "72%", size: 2 },
        { top: "22%", left: "88%", size: 3 },
        { top: "5%",  left: "92%", size: 2 },
      ].map((star, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
          }}
        />
      ))}

      {/* Content */}
      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
        {/* Badge */}
        <div
          style={{
            display: "inline-block",
            marginBottom: "1.25rem",
            padding: "0.3rem 1rem",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Colorado Community Resources
        </div>

        <h1
          style={{
            fontSize: "clamp(2rem, 6vw, 3.4rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: "0 0 1.2rem",
            letterSpacing: "-0.02em",
          }}
        >
          Find help.{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #e8a96a, #f4c07a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Get support.
          </span>
          <br />
          You&#39;re not alone.
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.65,
            margin: "0 0 2rem",
            maxWidth: 580,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          A free guide to over 1,600 resources across Colorado — housing, food,
          healthcare, legal aid, employment, and more. Talk to Colo, our AI
          guide, or browse resources below.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push("/resources")}
            style={{
              padding: "0.8rem 2rem",
              borderRadius: "999px",
              border: "1.5px solid rgba(255,255,255,0.55)",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, border-color 0.15s",
              backdropFilter: "blur(4px)",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.22)";
              (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.75)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
              (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.55)";
            }}
          >
            Browse Resources
          </button>
          <button
            onClick={scrollToChat}
            style={{
              padding: "0.8rem 2rem",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(90deg, #c47c3e, #e8a96a)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(196,124,62,0.4)",
              fontFamily: "inherit",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 6px 20px rgba(196,124,62,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = "translateY(0)";
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 4px 16px rgba(196,124,62,0.4)";
            }}
          >
            Chat with Colo ↓
          </button>
          <a
            href="tel:211"
            style={{
              padding: "0.8rem 2rem",
              borderRadius: "999px",
              border: "1.5px solid rgba(255,255,255,0.4)",
              background: "transparent",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-block",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLAnchorElement).style.background =
                "rgba(255,255,255,0.1)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLAnchorElement).style.background = "transparent")
            }
          >
            Call 211
          </a>
        </div>

        {/* Quick stats */}
        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            justifyContent: "center",
            gap: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { number: "1,600+", label: "Resources" },
            { number: "20+",    label: "Categories" },
            { number: "Free",   label: "Always" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  color: "#f4c07a",
                  lineHeight: 1,
                }}
              >
                {stat.number}
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.6)",
                  marginTop: "0.2rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
