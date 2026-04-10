import { NextRequest, NextResponse } from "next/server";
import { updateItem, deleteItem } from "@/lib/data/homework";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const updates = await req.json();

  const result = await updateItem(id, updates);
  if (result.error) {
    const status = result.error.type === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }
  return NextResponse.json({ data: result.data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteItem(id);
  if (result.error) {
    const status = result.error.type === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }
  return NextResponse.json({ data: result.data });
}
