import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Clear the token cookie
  cookies().set({
    name: "token",
    value: "",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Expire immediately
  })

  return NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
}
