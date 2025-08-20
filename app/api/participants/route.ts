import db from "@/lib/db";

export async function GET() {
  const participants = db
    .prepare(
      "SELECT id, name, companyName, token, is_deleted FROM participants"
    )
    .all();
  return Response.json(participants);
}

export async function POST(req: Request) {
  const { participants } = await req.json();
  console.log({ participants });
  if (!Array.isArray(participants) || participants.length === 0) {
    return new Response(JSON.stringify({ error: "No participants to save" }), {
      status: 400,
    });
  }

  // Filter hanya peserta dengan token unik di array
  const seenTokens = new Set<string>();
  const uniqueParticipants = participants.filter((p) => {
    const token =
      typeof p === "object" && typeof p.token === "string"
        ? p.token.trim()
        : "";
    if (!token || seenTokens.has(token)) return false;
    seenTokens.add(token);
    return true;
  });

  // Insert hanya jika token valid dan tidak kosong
  const insert = db.prepare(
    "INSERT OR IGNORE INTO participants (name, companyName, token) VALUES (?, ?, ?)"
  );
  uniqueParticipants.forEach((p) => {
    const name =
      typeof p === "object" && typeof p.name === "string" ? p.name.trim() : "";
    const companyName =
      typeof p === "object" && typeof p.companyName === "string"
        ? p.companyName.trim()
        : "";
    const token =
      typeof p === "object" && typeof p.token === "string"
        ? p.token.trim()
        : "";
    if (name && token) {
      insert.run(name, companyName, token);
    }
  });

  return Response.json({ success: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: "ID is Required" }), {
      status: 400,
    });
  }

  db.prepare("DELETE FROM participants WHERE token = ?").run(id.trim());

  return Response.json({ success: true });
}

export async function PATCH(req: Request) {
  const { id, is_deleted } = await req.json();

  if (!id || typeof is_deleted !== "boolean") {
    return new Response(
      JSON.stringify({ error: "ID and is_deleted are required" }),
      { status: 400 }
    );
  }

  // cek dulu apakah ada data dengan id tsb
  const existing = db
    .prepare("SELECT * FROM participants WHERE id = ?")
    .get(id);

  if (!existing) {
    return new Response(JSON.stringify({ error: "Participant not found" }), {
      status: 404,
    });
  }

  db.prepare("UPDATE participants SET is_deleted = ? WHERE id = ?").run(
    is_deleted ? 1 : 0,
    id
  );

  return Response.json({ success: true });
}
