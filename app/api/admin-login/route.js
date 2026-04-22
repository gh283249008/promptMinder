import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  const { password } = await request.json();

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "未配置管理员密码" }, { status: 500 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("pm_admin", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: "/",
  });

  return NextResponse.json({ success: true });
}
