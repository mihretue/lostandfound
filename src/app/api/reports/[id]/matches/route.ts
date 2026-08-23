import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMatch, Report } from "@/lib/matching";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!targetReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const oppositeType = targetReport.type === "LOST" ? "FOUND" : "LOST";

    const candidates = await prisma.report.findMany({
      where: { type: oppositeType },
    });

    const matches = candidates
      .map((candidate) => {
        // matching.ts expects (lost, found)
        const lost = targetReport.type === "LOST" ? targetReport : candidate;
        const found = targetReport.type === "FOUND" ? targetReport : candidate;
        
        const matchResult = calculateMatch(lost as Report, found as Report);
        
        if (!matchResult) return null;
        
        return {
          report: candidate,
          match: matchResult,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 10);

    return NextResponse.json({ data: matches });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate matches" },
      { status: 500 }
    );
  }
}
