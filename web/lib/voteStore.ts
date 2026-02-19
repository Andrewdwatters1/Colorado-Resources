/**
 * voteStore.ts — file-based vote persistence.
 *
 * Reads and writes data/votes.json (relative to the repo root).
 * Swap this file's implementation for Vercel KV (or any KV store) when
 * moving to a serverless deployment:
 *
 *   import { kv } from "@vercel/kv";
 *   export async function getVotes() { return await kv.hgetall("votes") ?? {}; }
 *   export async function castVote(name, dir) {
 *     const field = `${name}:${dir}`;
 *     await kv.hincrby("votes", field, 1);
 *     return getVotes();
 *   }
 */

import fs from "fs";
import path from "path";

export type VoteDirection = "up" | "down";

export interface ResourceVotes {
  up: number;
  down: number;
}

export type VoteMap = Record<string, ResourceVotes>;

const VOTES_PATH = path.join(process.cwd(), "..", "data", "votes.json");

function readVotes(): VoteMap {
  try {
    const raw = fs.readFileSync(VOTES_PATH, "utf-8");
    return JSON.parse(raw) as VoteMap;
  } catch {
    return {};
  }
}

function writeVotes(votes: VoteMap): void {
  fs.writeFileSync(VOTES_PATH, JSON.stringify(votes, null, 2), "utf-8");
}

export function getVotes(): VoteMap {
  return readVotes();
}

export function castVote(resourceName: string, direction: VoteDirection): VoteMap {
  const votes = readVotes();
  if (!votes[resourceName]) {
    votes[resourceName] = { up: 0, down: 0 };
  }
  votes[resourceName][direction] += 1;
  writeVotes(votes);
  return votes;
}

export function getRank(votes: VoteMap, resourceName: string): number {
  const v = votes[resourceName];
  if (!v) return 0;
  return v.up - v.down;
}
