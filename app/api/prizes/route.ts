import db from "@/lib/db";

export async function GET() {
  const prizes = db.prepare("SELECT name, winner, id FROM prizes").all();
  return Response.json(prizes);
}

export async function POST(req: Request) {
  const { prizes } = await req.json();

  if (!Array.isArray(prizes)) {
    return new Response(JSON.stringify({ error: "Invalid data" }), {
      status: 400,
    });
  }

  // Reset queue
  db.prepare("DELETE FROM queue").run();

  const upsertPrize = db.prepare(
    "INSERT INTO prizes (id, name, winner) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, winner=excluded.winner"
  );
  const insertQueue = db.prepare(
    "INSERT INTO queue (prize_id, order_num) VALUES (?, ?)"
  );

  console.log({ prizes });

  prizes.forEach((p, idx) => {
    // Upsert prize
    upsertPrize.run(p.id, p.name, p.winner);
    // Insert ke queue
    insertQueue.run(p.id, idx + 1);
  });

  return Response.json({ success: true });
}
