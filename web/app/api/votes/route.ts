import { getVotes } from "@/lib/voteStore";

export async function GET() {
  try {
    const votes = await getVotes();
    return Response.json(votes);
  } catch (err) {
    console.error("Votes GET error:", err);
    return Response.json({}, { status: 500 });
  }
}
