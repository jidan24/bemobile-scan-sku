import { type NextRequest } from "next/server";
import pool from "@/lib/db";
import { corsHeaders } from "@/lib/cors";
import bcrypt from "bcrypt";
import { signJWT } from "@/lib/auth";

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { username, password } = body;

		if (!username || !password) {
			return Response.json(
				{ success: false, message: "Username and password are required" },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Get user from db
		const { rows } = await pool.query(
			`SELECT * FROM users WHERE username = $1 LIMIT 1`,
			[username]
		);

		const user = rows[0];

		if (!user) {
			return Response.json(
				{ success: false, message: "Invalid username or password" },
				{ status: 401, headers: corsHeaders }
			);
		}

		// Compare password
		const match = await bcrypt.compare(password, user.password);

		if (!match) {
			return Response.json(
				{ success: false, message: "Invalid username or password" },
				{ status: 401, headers: corsHeaders }
			);
		}

		// Generate JWT token
		const token = await signJWT({ userId: user.id, username: user.username });

		return Response.json(
			{
				success: true,
				message: "Login successful",
				data: {
					user: { id: user.id, username: user.username },
					token: token
				}
			},
			{ status: 200, headers: corsHeaders }
		);
	} catch (error) {
		console.error("[POST /api/auth/login]", error);
		return Response.json(
			{ success: false, message: "Failed to login" },
			{ status: 500, headers: corsHeaders }
		);
	}
}
