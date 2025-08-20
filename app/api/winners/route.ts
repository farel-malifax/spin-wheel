import db from "@/lib/db";

export async function GET() {
  // Ambil semua data pemenang, join prize dan participant
  const winners = db
    .prepare(
      `
    SELECT w.id, p.name as prize_name, pa.name as participant_name, w.won_at
    FROM winners w
    JOIN prizes p ON w.prize_id = p.id
    JOIN participants pa ON w.participant_id = pa.id
    ORDER BY w.won_at DESC
  `
    )
    .all();
  return Response.json(winners);
}

export async function POST(req: Request) {
  // Insert pemenang baru
  const { prize_id, participant_id, won_at } = await req.json();
  if (
    typeof prize_id !== "number" ||
    typeof participant_id !== "number" ||
    !won_at
  ) {
    return new Response(JSON.stringify({ error: "Invalid data" }), {
      status: 400,
    });
  }
  db.prepare(
    "INSERT INTO winners (prize_id, participant_id, won_at) VALUES (?, ?, ?)"
  ).run(prize_id, participant_id, won_at);
  return Response.json({ success: true });
}
