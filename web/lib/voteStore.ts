/**
 * voteStore.ts — Upstash Redis backed vote persistence.
 *
 * Setup:
 *  1. Vercel dashboard → Storage → Create New → Upstash → Redis
 *  2. Connect the database to your project
 *  3. Run `vercel env pull .env.local` — Vercel writes the env vars automatically:
 *       UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 * Data layout in Redis:
 *  Hash  "resource_votes"  →  field = resourceName, value = { up: N, down: M }
 */

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type VoteDirection = "up" | "down";

export interface ResourceVotes {
  up: number;
  down: number;
}

export type VoteMap = Record<string, ResourceVotes>;

const HASH_KEY = "resource_votes";

export async function getVotes(): Promise<VoteMap> {
  const raw = await redis.hgetall<Record<string, ResourceVotes>>(HASH_KEY);
  return raw ?? {};
}

export async function castVote(
  resourceName: string,
  direction: VoteDirection
): Promise<VoteMap> {
  const current =
    (await redis.hget<ResourceVotes>(HASH_KEY, resourceName)) ?? { up: 0, down: 0 };

  const updated: ResourceVotes = {
    up: current.up + (direction === "up" ? 1 : 0),
    down: current.down + (direction === "down" ? 1 : 0),
  };

  await redis.hset(HASH_KEY, { [resourceName]: updated });
  return getVotes();
}

export function getRank(votes: VoteMap, resourceName: string): number {
  const v = votes[resourceName];
  if (!v) return 0;
  return v.up - v.down;
}
