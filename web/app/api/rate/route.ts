/**
 * POST /api/rate
 *
 * Stores a user's helpfulness rating for an individual Colo response,
 * paired with the full conversation snapshot at the time of rating.
 *
 * Data is stored in Upstash Redis:
 *   Hash  "conversation_ratings"  →  field = uuid, value = ConversationRating
 *   ZSet  "conversation_ts"       →  member = uuid, score = timestamp (ms)
 *
 * To retrieve all rated conversations for analysis (newest first):
 *   const ids = await redis.zrange("conversation_ts", 0, -1, { rev: true });
 *   const records = await Promise.all(
 *     ids.map(id => redis.hget("conversation_ratings", id))
 *   );
 */

import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export interface ConversationRating {
  id: string;
  timestamp: number;
  /** 1–10 helpfulness score given by the user */
  rating: number;
  /** Index of the assistant message being rated in the conversation array */
  ratedMessageIndex: number;
  /** The specific assistant response that was rated */
  ratedMessage: string;
  /** Full conversation snapshot up to and including the rated message */
  conversationSnapshot: Array<{ role: "user" | "assistant"; content: string }>;
}

const RATINGS_HASH = "conversation_ratings";
const RATINGS_TS_ZSET = "conversation_ts";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      rating: number;
      ratedMessageIndex: number;
      ratedMessage: string;
      conversationSnapshot: ConversationRating["conversationSnapshot"];
    };

    const { rating, ratedMessageIndex, ratedMessage, conversationSnapshot } = body;

    if (
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 10 ||
      !Array.isArray(conversationSnapshot) ||
      conversationSnapshot.length === 0
    ) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const timestamp = Date.now();

    const record: ConversationRating = {
      id,
      timestamp,
      rating,
      ratedMessageIndex,
      ratedMessage,
      conversationSnapshot,
    };

    if (redis) {
      await Promise.all([
        redis.hset(RATINGS_HASH, { [id]: record }),
        redis.zadd(RATINGS_TS_ZSET, { score: timestamp, member: id }),
      ]);
    }

    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("Rate API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
