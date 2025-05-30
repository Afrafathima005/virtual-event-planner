import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Connect to database
    console.log("Attempting to connect to database...")
    let db
    try {
      const connection = await connectToDatabase()
      db = connection.db
      console.log("Database connection successful")
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          message: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    // Find user
    console.log("Searching for user with email:", email)
    let user
    try {
      user = await db.collection("users").findOne({ email })
      if (!user) {
        console.log("User not found")
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
      }
      console.log("User found")
    } catch (findError) {
      console.error("Error finding user:", findError)
      return NextResponse.json(
        {
          message: "Error finding user",
          details: findError instanceof Error ? findError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // Verify password
    console.log("Verifying password...")
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        console.log("Invalid password")
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
      }
      console.log("Password verified")
    } catch (bcryptError) {
      console.error("Password verification error:", bcryptError)
      return NextResponse.json(
        {
          message: "Password verification failed",
          details: bcryptError instanceof Error ? bcryptError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // Create user object (without password)
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }

    // Generate JWT token
    try {
      const token = jwt.sign(
        { id: userResponse.id, email: userResponse.email, role: userResponse.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" },
      )

      // Set cookie
      cookies().set({
        name: "token",
        value: token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })

      return NextResponse.json({ user: userResponse }, { status: 200 })
    } catch (tokenError) {
      console.error("Token generation error:", tokenError)
      return NextResponse.json(
        {
          message: "Token generation failed",
          details: tokenError instanceof Error ? tokenError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Login error details:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
