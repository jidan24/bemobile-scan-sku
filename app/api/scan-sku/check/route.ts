import {type NextRequest} from "next/server";
import pool from "@/lib/db";
import {corsHeaders} from "@/lib/cors";

// Handle preflight
export async function OPTIONS() {
	return new Response(null, {status: 204, headers: corsHeaders});
}

// GET /api/scan-sku/check?skuCode=...
export async function GET(request: NextRequest) {
	try {
		const skuCode = request.nextUrl.searchParams.get("skuCode");

		if (!skuCode) {
			return Response.json({success: false, message: "Query param skuCode is required"}, {status: 400, headers: corsHeaders});
		}

		const {rows} = await pool.query(`SELECT id FROM sku_code WHERE "skuCode" = $1 LIMIT 1`, [skuCode]);

		const isDuplicate = rows.length > 0;

		return Response.json({
			success: true,
			isDuplicate: isDuplicate,
			message: isDuplicate ? "SKU Code already exists" : "SKU Code is available"
		}, {headers: corsHeaders});
	} catch (error) {
		console.error("[GET /api/scan-sku/check]", error);
		return Response.json({success: false, message: "Failed to check SKU Code"}, {status: 500, headers: corsHeaders});
	}
}
