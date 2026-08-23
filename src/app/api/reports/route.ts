import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/schemas/report.schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = reportSchema.parse(body);

    const parsedDate = new Date(`${validatedData.eventDate}T00:00:00Z`);

    const report = await prisma.report.create({
      data: {
        ...validatedData,
        eventDate: parsedDate,
      },
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Validation or server error" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  
  const rawLimit = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20;

  const whereClause = type === "LOST" || type === "FOUND" ? { type: type as "LOST" | "FOUND" } : {};

  try {
    const reports = await prisma.report.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ data: reports });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch reports" }, { status: 500 });
  }
}
