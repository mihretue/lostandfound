import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field");

  if (field !== "category" && field !== "location" && field !== "color") {
    return NextResponse.json(
      { error: "Invalid field parameter. Must be category, location, or color." },
      { status: 400 }
    );
  }

  try {
    let suggestions: string[] = [];

    if (field === "category") {
      const results = await prisma.report.groupBy({
        by: ["category"],
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
        take: 10,
      });
      suggestions = results.map((r) => r.category).filter(Boolean);
    } else if (field === "location") {
      const results = await prisma.report.groupBy({
        by: ["location"],
        _count: { location: true },
        orderBy: { _count: { location: "desc" } },
        take: 10,
      });
      suggestions = results.map((r) => r.location).filter(Boolean);
    } else if (field === "color") {
      const results = await prisma.report.groupBy({
        by: ["color"],
        where: { color: { not: null } },
        _count: { color: true },
        orderBy: { _count: { color: "desc" } },
        take: 10,
      });
      suggestions = results.map((r) => r.color).filter((c): c is string => c !== null && c !== "");
    }

    return NextResponse.json({ data: suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
