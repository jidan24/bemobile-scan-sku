import {type NextRequest} from "next/server";
import pool from "@/lib/db";
import {corsHeaders} from "@/lib/cors";

// Handle preflight
export async function OPTIONS() {
	return new Response(null, {status: 204, headers: corsHeaders});
}

// GET /api/scan-sku — fetch all with search, pagination
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;

		const search = searchParams.get("search") ?? "";
		const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10));
		const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
		const offset = (page - 1) * limit;

		const whereClause = search ? `WHERE "skuCode" ILIKE $1` : "";
		const countValues = search ? [`%${search}%`] : [];

		const {rows: countRows} = await pool.query(`SELECT COUNT(*) as total FROM sku_code ${whereClause}`, countValues);
		const total = parseInt(countRows[0].total, 10);
		const totalPages = Math.ceil(total / limit);

		const dataValues = search ? [`%${search}%`, limit, offset] : [limit, offset];
		const limitPlaceholder = search ? "$2" : "$1";
		const offsetPlaceholder = search ? "$3" : "$2";

		const {rows} = await pool.query(
			`SELECT * FROM sku_code ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
			dataValues
		);

		return Response.json(
			{
				success: true,
				totalData: total,
				data: rows,
				pagination: {total, totalPages, currentPage: page, limit},
			},
			{headers: corsHeaders}
		);
	} catch (error) {
		console.error("[GET /api/scan-sku]", error);
		return Response.json({success: false, message: "Failed to fetch data"}, {status: 500, headers: corsHeaders});
	}
}

// POST /api/scan-sku — create new entry
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {skuCode, color, quantity} = body;
		const operatorName = request.headers.get("x-username") || "Unknown";

		if (!skuCode || !color || quantity === undefined) {
			return Response.json({success: false, message: "Fields skuCode, color, and quantity are required"}, {status: 400, headers: corsHeaders});
		}

		if (typeof color !== "string" || color.length > 5) {
			return Response.json({success: false, message: "color must be a string with a maximum of 5 characters"}, {status: 400, headers: corsHeaders});
		}

		if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
			return Response.json({success: false, message: "quantity must be an integer"}, {status: 400, headers: corsHeaders});
		}

		const {rows} = await pool.query(
			`INSERT INTO sku_code ("skuCode", color, "operatorName", quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
			[skuCode, color, operatorName, quantity]
		);

		return Response.json({success: true, data: rows[0]}, {status: 201, headers: corsHeaders});
	} catch (error: unknown) {
		if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
			return Response.json({success: false, message: "skuCode already exists"}, {status: 409, headers: corsHeaders});
		}
		console.error("[POST /api/scan-sku]", error);
		return Response.json({success: false, message: "Failed to save data"}, {status: 500, headers: corsHeaders});
	}
}

// PUT /api/scan-sku?id=uuid — update entry by id
export async function PUT(request: NextRequest) {
	try {
		const id = request.nextUrl.searchParams.get("id");

		if (!id) {
			return Response.json({success: false, message: "Query param id is required"}, {status: 400, headers: corsHeaders});
		}

		const body = await request.json();
		const {skuCode, color, quantity} = body;
		const operatorName = request.headers.get("x-username") || "Unknown";

		if (!skuCode || !color || quantity === undefined) {
			return Response.json({success: false, message: "Fields skuCode, color, and quantity are required"}, {status: 400, headers: corsHeaders});
		}

		if (typeof color !== "string" || color.length > 5) {
			return Response.json({success: false, message: "color must be a string with a maximum of 5 characters"}, {status: 400, headers: corsHeaders});
		}

		if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
			return Response.json({success: false, message: "quantity must be an integer"}, {status: 400, headers: corsHeaders});
		}

		const {rows} = await pool.query(
			`UPDATE sku_code
       SET "skuCode" = $1, color = $2, "operatorName" = $3, quantity = $4, "updatedAt" = NOW()
       WHERE id = $5
       RETURNING *`,
			[skuCode, color, operatorName, quantity, id]
		);

		if (rows.length === 0) {
			return Response.json({success: false, message: "Entry not found"}, {status: 404, headers: corsHeaders});
		}

		return Response.json({success: true, data: rows[0]}, {headers: corsHeaders});
	} catch (error: unknown) {
		if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
			return Response.json({success: false, message: "skuCode already exists"}, {status: 409, headers: corsHeaders});
		}
		console.error("[PUT /api/scan-sku]", error);
		return Response.json({success: false, message: "Failed to update entry"}, {status: 500, headers: corsHeaders});
	}
}

// DELETE /api/scan-sku?id=uuid — delete entry by id
export async function DELETE(request: NextRequest) {
	try {
		const id = request.nextUrl.searchParams.get("id");

		if (!id) {
			return Response.json({success: false, message: "Query param id is required"}, {status: 400, headers: corsHeaders});
		}

		const {rows} = await pool.query(`DELETE FROM sku_code WHERE id = $1 RETURNING *`, [id]);

		if (rows.length === 0) {
			return Response.json({success: false, message: "Entry not found"}, {status: 404, headers: corsHeaders});
		}

		return Response.json({success: true, message: "Entry deleted successfully", data: rows[0]}, {headers: corsHeaders});
	} catch (error) {
		console.error("[DELETE /api/scan-sku]", error);
		return Response.json({success: false, message: "Failed to delete entry"}, {status: 500, headers: corsHeaders});
	}
}
