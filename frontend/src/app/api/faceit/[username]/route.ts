import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: { username: string } }
) {
  try {
    const res = await fetch(
      `https://www.faceit.com/api/users/v1/nicknames/${params.username}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Faceit fetch failed" },
        { status: res.status }
      );
    }

    const json = await res.json();

    const cs2 = json?.payload?.games?.cs2;

    return NextResponse.json({
      elo: cs2?.faceit_elo ?? null,
      level: cs2?.skill_level ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
