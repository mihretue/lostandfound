import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/date";
import ReportTypeBadge from "@/components/ReportTypeBadge";
import MatchCard from "@/components/MatchCard";
import { MatchResult } from "@/lib/matching";
import { Report } from "@prisma/client";

async function getReport(id: string) {
  const report = await prisma.report.findUnique({
    where: { id },
  });
  if (!report) notFound();
  return report;
}

async function getMatches(id: string) {
  // We fetch matches from the API route we created, using internal fetch or direct logic.
  // Since we're in a Server Component, it's generally better to use Prisma/Logic directly, 
  // but to reuse the API logic as the prompt described, we can do an absolute fetch or just 
  // replicate the fetch call. Due to deployment complexities with absolute URLs in SSR,
  // we'll invoke the logic directly in the server component.

  // Re-importing matching logic here avoids messy absolute URL resolution in Next.js Server Components.
  // But wait, the prompt specifically said:
  // "Fetch matches from: /api/reports/[id]/matches"
  // Let's do a fetch using relative URL? No, fetch needs absolute URL in server components.
  // I will use headers to construct the URL.
  
  const headersList = await (await import("next/headers")).headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  
  const res = await fetch(`${protocol}://${host}/api/reports/${id}/matches`, {
    cache: "no-store",
  });
  
  if (!res.ok) return [];
  const json = await res.json();
  return json.data as { report: Report; match: MatchResult }[];
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  const matches = await getMatches(id);

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
