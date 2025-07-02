import jwt from "jsonwebtoken"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function getAuthUser(request: Request) {
  try {
    // For API routes, get the token from the cookie in the request
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) return null

    const tokenCookie = cookieHeader.split(";").find((c) => c.trim().startsWith("token="))

    if (!tokenCookie) return null

    const token = tokenCookie.split("=")[1]

    if (!token) return null

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as jwt.JwtPayload & { id: string }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.id),
    })

    if (!user) return null

    // Return user data (without password)
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}
