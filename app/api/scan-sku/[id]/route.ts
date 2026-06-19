import {type NextRequest} from "next/server";
import pool from "@/lib/db";
import {corsHeaders} from "@/lib/cors";

// Handle preflight
export async function OPTIONS() {
	return new Response(null, {status: 204, headers: corsHeaders});
}

// PUT /api/scan-sku/[id] — update entry by ID
export async function PUT(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
	try {
		const {id} = await params;
		const body = await request.json();
		const {skuCode, color, operatorName, quantity} = body;

		if (!skuCode || !color || !operatorName || quantity === undefined) {
			return Response.json(
				{
					success: false,
					message: "Fields skuCode, color, operatorName, and quantity are required",
				},
				{status: 400, headers: corsHeaders}
			);
		}

		if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
			return Response.json({success: false, message: "quantity must be an integer"}, {status: 400, headers: corsHeaders});
		}

		const {rows} = await pool.query(
			`UPDATE sku-code
       SET "skuCode" = $1, color = $2, "operatorName" = $3, quantity = $4, "updatedAt" = NOW()
       WHERE id = $5
       RETURNING *`,
			[skuCode, color, operatorName, quantity, id]
		);

		if (rows.length === 0) {
			return Response.json({success: false, message: "Entry not found"}, {status: 404, headers: corsHeaders});
		}

		return Response.json({success: true, data: rows[0]}, {headers: corsHeaders});
	} catch (error) {
		console.error("[PUT /api/scan-sku/[id]]", error);
		return Response.json({success: false, message: "Failed to update entry"}, {status: 500, headers: corsHeaders});
	}
}

// DELETE /api/scan-sku/[id] — delete entry by ID
export async function DELETE(_request: NextRequest, {params}: {params: Promise<{id: string}>}) {
	try {
		const {id} = await params;

		const {rows} = await pool.query(`DELETE FROM sku-code WHERE id = $1 RETURNING *`, [id]);

		if (rows.length === 0) {
			return Response.json({success: false, message: "Entry not found"}, {status: 404, headers: corsHeaders});
		}

		return Response.json({success: true, message: "Entry deleted successfully", data: rows[0]}, {headers: corsHeaders});
	} catch (error) {
		console.error("[DELETE /api/scan-sku/[id]]", error);
		return Response.json({success: false, message: "Failed to delete entry"}, {status: 500, headers: corsHeaders});
	}
}
