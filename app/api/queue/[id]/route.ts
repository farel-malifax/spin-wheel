import db from "@/lib/db";

export async function PATCH(req: Request) {
  // Update hanya flag is_spun di queue
  const { id, is_spun } = await req.json();

  if (typeof id !== "number" || typeof is_spun !== "number") {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
    });
  }

  db.prepare("UPDATE queue SET is_spun = ? WHERE id = ?").run(is_spun, id);

  return Response.json({ success: true });
}
