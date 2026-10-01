import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();

  const token = cookieStore.get("session")?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Belum login",
      },
      { status: 401 }
    );
  }

  const session = await verifySession(token);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Session tidak valid",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    session: {
      userId: session.userId,
      role: session.role,
    },
  });
}