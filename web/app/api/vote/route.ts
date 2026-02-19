import { NextRequest } from "next/server";
import { castVote, VoteDirection } from "@/lib/voteStore";

export async function POST(req: NextRequest) {
  try {
    const { resourceName, direction } = (await req.json()) as {
      resourceName: string;
      direction: VoteDirection;
    };

    if (!resourceName || !["up", "down"].includes(direction)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const votes = castVote(resourceName, direction);
    return Response.json({ ok: true, votes });
  } catch (err) {
    console.error("Vote API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
