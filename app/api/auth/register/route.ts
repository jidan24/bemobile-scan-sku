import { type NextRequest } from "next/server";
import pool from "@/lib/db";
import { corsHeaders } from "@/lib/cors";
import bcrypt from "bcrypt";

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

		// Hash password
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const { rows } = await pool.query(
			`INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, "createdAt"`,
			[username, hashedPassword]
		);

		return Response.json(
			{ success: true, message: "User registered successfully", data: rows[0] },
			{ status: 201, headers: corsHeaders }
		);
	} catch (error: unknown) {
		if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
			return Response.json(
				{ success: false, message: "Username already exists" },
				{ status: 409, headers: corsHeaders }
			);
		}
		console.error("[POST /api/auth/register]", error);
		return Response.json(
			{ success: false, message: "Failed to register user" },
			{ status: 500, headers: corsHeaders }
		);
	}
}
