import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    // Get section name from query parameter
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");

    if (!section) {
      return NextResponse.json(
        {
          success: false,
          error: "Section name is required",
        },
        { status: 400 }
      );
    }

    // Find heading data based on section_name
    const heading = await db
      .collection("heading")
      .findOne({ section_name: section });

    if (!heading) {
      return NextResponse.json(
        {
          success: false,
          error: "Heading not found",
        },
        { status: 404 }
      );
    }

    // Convert MongoDB _id into string id
    const { _id, ...rest } = heading;

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        id: _id.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve heading data",
      },
      { status: 500 }
    );
  }
}