import db from "@/lib/db";

export async function GET() {
  // Ambil queue beserta data prize
  const queue = db
    .prepare(
      `
    SELECT q.id, q.order_num, q.is_spun, p.id as prize_id, p.name as prize_name
    FROM queue q
    JOIN prizes p ON q.prize_id = p.id
    ORDER BY q.order_num ASC
  `
    )
    .all();
  return Response.json(queue);
}

export async function POST(req: Request) {
  // Update queue (order_num, is_spun, prize_id jika ada)
  const { queue } = await req.json(); // queue: [{id, order_num, prize_id?, is_spun?}]
  if (!Array.isArray(queue)) {
    return new Response(JSON.stringify({ error: "Invalid data" }), {
      status: 400,
    });
  }
  const update = db.prepare(
    "UPDATE queue SET order_num = ?, is_spun = COALESCE(?, is_spun), prize_id = COALESCE(?, prize_id) WHERE id = ?"
  );
  queue.forEach((item) => {
    if (typeof item.id === "number" && typeof item.order_num === "number") {
      update.run(item.order_num, item.is_spun, item.prize_id, item.id);
    }
  });
  return Response.json({ success: true });
}

export async function PUT(req: Request) {
  // Tambah prize ke queue
  const { prize_id } = await req.json();
  if (typeof prize_id !== "number") {
    return new Response(JSON.stringify({ error: "Invalid prize_id" }), {
      status: 400,
    });
  }
  // Cari order_num terbesar
  const maxOrder = db
    .prepare("SELECT MAX(order_num) as max_order FROM queue")
    .get() as { max_order: number | null };
  const order_num = Number.isFinite(maxOrder?.max_order)
    ? (maxOrder.max_order as number) + 1
    : 1;
  db.prepare("INSERT INTO queue (prize_id, order_num) VALUES (?, ?)").run(
    prize_id,
    order_num
  );
  return Response.json({ success: true });
}

export async function DELETE(req: Request) {
  // Hapus item dari queue
  const { id } = await req.json();
  if (typeof id !== "number") {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
    });
  }
  db.prepare("DELETE FROM queue WHERE id = ?").run(id);
  return Response.json({ success: true });
}

export async function PATCH(req: Request) {
  // Update hanya flag is_spun di queue
  const { id, is_spun } = await req.json();

  console.log({ id, is_spun });

  if (typeof id !== "number" || typeof is_spun !== "number") {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
    });
  }

  db.prepare("UPDATE queue SET is_spun = ? WHERE id = ?").run(is_spun, id);

  return Response.json({ success: true });
}
