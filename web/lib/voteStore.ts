/**
 * voteStore.ts — Vercel KV (Upstash Redis) backed vote persistence.
 *
 * Setup:
 *  1. Enable a KV store in your Vercel project dashboard (Storage → KV)
 *  2. Run `vercel env pull .env.local` to get credentials locally
 *  3. The required env vars (set automatically by Vercel):
 *       KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN
 *
 * Data layout in Redis:
 *  Hash  "resource_votes"  →  field = resourceName, value = { up: N, down: M }
 */

import { kv } from "@vercel/kv";

export type VoteDirection = "up" | "down";

export interface ResourceVotes {
  up: number;
  down: number;
}

export type VoteMap = Record<string, ResourceVotes>;

const HASH_KEY = "resource_votes";

export async function getVotes(): Promise<VoteMap> {
  const raw = await kv.hgetall<Record<string, ResourceVotes>>(HASH_KEY);
  return raw ?? {};
}

export async function castVote(
  resourceName: string,
  direction: VoteDirection
): Promise<VoteMap> {
  const current =
    (await kv.hget<ResourceVotes>(HASH_KEY, resourceName)) ?? { up: 0, down: 0 };

  const updated: ResourceVotes = {
    up: current.up + (direction === "up" ? 1 : 0),
    down: current.down + (direction === "down" ? 1 : 0),
  };

  await kv.hset(HASH_KEY, { [resourceName]: updated });
  return getVotes();
}

export function getRank(votes: VoteMap, resourceName: string): number {
  const v = votes[resourceName];
  if (!v) return 0;
  return v.up - v.down;
}
