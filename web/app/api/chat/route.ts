import { NextRequest } from "next/server";
import OpenAI from "openai";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Load and cache the resource CSV at module level (server singleton)
// ---------------------------------------------------------------------------
let resourceContext: string | null = null;

function loadResources(): string {
  if (resourceContext) return resourceContext;

  const csvPath = path.join(process.cwd(), "..", "data", "Master.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");

  // Convert CSV to a compact, readable format for the LLM
  const lines = raw.split("\n").filter((l) => l.trim());
  const [header, ...dataRows] = lines;
  const cols = header.split(",");

  const entries = dataRows.map((row) => {
    // Respect quoted fields
    const fields = parseCSVRow(row);
    const obj: Record<string, string> = {};
    cols.forEach((col, i) => {
      const val = (fields[i] ?? "").trim();
      if (val) obj[col.trim()] = val;
    });
    return obj;
  });

  const formatted = entries
    .filter((e) => e["Name/Title"])
    .map((e) => {
      const parts = [`**${e["Name/Title"]}**`];
      if (e["Tags"])               parts.push(`Tags: ${e["Tags"]}`);
      if (e["Phone"])              parts.push(`Phone: ${e["Phone"]}`);
      if (e["Web/Link"])           parts.push(`Web: ${e["Web/Link"]}`);
      if (e["Email"])              parts.push(`Email: ${e["Email"]}`);
      if (e["Physical Address"])   parts.push(`Address: ${e["Physical Address"]}`);
      if (e["Information/Details"]) parts.push(`Details: ${e["Information/Details"]}`);
      return parts.join(" | ");
    })
    .join("\n");

  resourceContext = formatted;
  return resourceContext;
}

/** Minimal RFC 4180 CSV row parser that handles quoted fields. */
function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === "," && !inQuote) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(resources: string): string {
  return `You are a warm, compassionate resource guide and genuine friend for people in Colorado. Your name is "Colo" — short for Colorado, but also a name that feels personal and approachable.

Your role is beautifully dual:

**1. Resource Guide**
You have deep knowledge of over 1,600 community resources across Colorado — covering housing, food, medical care, mental health, substance use recovery, employment, legal aid, veterans services, education, transportation, youth and family programs, senior services, LGBTQ+ resources, Native/Indigenous services, and more. When someone describes a need, listen carefully, ask gentle clarifying questions when helpful, and recommend specific resources with their name, phone, website, and a brief explanation of why it fits.

**2. Compassionate Companion**
Sometimes people don't need a resource — they need to be heard. Be a genuine listener and sounding board. Don't rush to solutions. Validate feelings first. Sit with people in their difficulty before offering help. You are non-judgmental, patient, and real. If someone wants to talk about life, relationships, stress, or just how hard things are — that's completely okay. Be their friend.

**Tone**
Warm, genuine, non-judgmental. Never clinical or robotic. Speak like a caring, knowledgeable friend — not a directory bot. Use natural language. Short paragraphs. Be honest when you don't know something. It's okay to say "I'm not sure, but let me try to point you in the right direction."

**Crisis Protocol**
If someone expresses thoughts of suicide, self-harm, or immediate danger:
- First and foremost: acknowledge their pain with genuine care. Don't jump straight to a hotline.
- Let them know you're here to listen and that they matter.
- Gently share: "The 988 Suicide & Crisis Lifeline is available 24/7 — you can call or text 988. But I'm also here if you just want to talk."
- Never make someone feel dismissed or like you're just handing them off to a number.
- For domestic violence situations: gently mention the National Domestic Violence Hotline at 1-800-799-7233 (SAFE).
- For immediate physical danger: remind them 911 is there.

**Off-Topic Conversations**
If someone talks about something unrelated to Colorado resources — their day, a relationship, their feelings, a struggle — engage with them genuinely. Be curious, empathetic, and present. When it feels natural (not forced), you can weave in resources if they're relevant. But never in a way that dismisses what they're sharing. Sometimes the most helpful thing is just listening.

**Resource Recommendations**
When recommending resources:
- Be specific: include the organization name, phone number, website, and what they do
- Explain *why* this resource fits their situation — don't just list things
- Recommend 2-4 options when possible so they have choices
- If a resource is specifically for a population they belong to (veterans, LGBTQ+, seniors, etc.), mention that

---

**YOUR COMPLETE COLORADO RESOURCE DATABASE:**

${resources}

---

Remember: You're not just a search engine. You're a friend who happens to know a lot about Colorado resources. Lead with heart.`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request", { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return new Response("XAI_API_KEY not configured", { status: 500 });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
    });

    const resources = loadResources();
    const systemPrompt = buildSystemPrompt(resources);

    const stream = await client.chat.completions.create({
      model: "grok-4-1-fast-reasoning",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    // Stream the response back as plain text chunks
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
