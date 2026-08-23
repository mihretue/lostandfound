import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/date";
import ReportTypeBadge from "@/components/ReportTypeBadge";
import MatchCard from "@/components/MatchCard";
import { calculateMatch } from "@/lib/matching";
import { Report } from "@prisma/client";

async function getReport(id: string) {
  const report = await prisma.report.findUnique({
    where: { id },
  });
  if (!report) notFound();
  return report;
}

async function getMatches(targetReport: Report) {
  const oppositeType = targetReport.type === "LOST" ? "FOUND" : "LOST";
  const candidates = await prisma.report.findMany({
    where: { type: oppositeType },
  });

  const matches = candidates
    .map((candidate) => {
      const lost = targetReport.type === "LOST" ? targetReport : candidate;
      const found = targetReport.type === "FOUND" ? targetReport : candidate;
      
      // Cast to match the expected signature in matching.ts
      const matchResult = calculateMatch(lost as any, found as any);
      
      if (!matchResult) return null;
      return { report: candidate, match: matchResult };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 10);

  return matches;
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  const matches = await getMatches(report);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Report Details */}
      <section className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
          <div className="flex gap-6">
            {report.imageUrl && (
              <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h1>
              <ReportTypeBadge type={report.type} />
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Reported on: {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(report.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div>
            <span className="block font-semibold text-gray-500 uppercase tracking-wider text-xs mb-1">Category</span>
            <span className="text-gray-900">{report.category}</span>
          </div>
          <div>
            <span className="block font-semibold text-gray-500 uppercase tracking-wider text-xs mb-1">Event Date</span>
            <span className="text-gray-900">{formatEventDate(report.eventDate)}</span>
          </div>
          <div>
            <span className="block font-semibold text-gray-500 uppercase tracking-wider text-xs mb-1">Location</span>
            <span className="text-gray-900">{report.location}</span>
          </div>
          {report.color && (
            <div>
              <span className="block font-semibold text-gray-500 uppercase tracking-wider text-xs mb-1">Color</span>
              <span className="text-gray-900">{report.color}</span>
            </div>
          )}
        </div>

        {report.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <span className="block font-semibold text-gray-500 uppercase tracking-wider text-xs mb-2">Description</span>
            <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
          </div>
        )}
      </section>

      {/* Matches */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Potential Matches</h2>
        {matches.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg border border-gray-200 border-dashed">
            <p className="text-gray-500">No potential matches found yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => (
              <MatchCard key={m.report.id} currentReport={report} candidateReport={m.report} match={m.match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
