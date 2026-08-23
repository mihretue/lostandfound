export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import ReportCard from "@/components/ReportCard";
import { prisma } from "@/lib/prisma";

async function ReportFeed({ typeFilter }: { typeFilter?: string }) {
  const reports = await prisma.report.findMany({
    where: typeFilter ? { type: typeFilter as "LOST" | "FOUND" } : {},
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
        <p className="text-gray-500">No reports found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const resolvedParams = await searchParams;
  const typeFilter = resolvedParams.type === "LOST" || resolvedParams.type === "FOUND" ? resolvedParams.type : undefined;

  return (
    <div className="space-y-8">
      <section className="bg-blue-600 text-white rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-4">University Lost & Found</h1>
        <p className="text-blue-100 max-w-2xl mb-6">
          Did you lose something on campus? Or did you find an item that doesn&apos;t belong to you? 
          Report it here, and our system will automatically suggest potential matches.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/reports/new?type=LOST" className="bg-white text-blue-700 hover:bg-gray-50 font-medium py-2 px-6 rounded-md shadow transition">
            Report Lost Item
          </Link>
          <Link href="/reports/new?type=FOUND" className="bg-blue-700 text-white hover:bg-blue-800 border border-blue-500 font-medium py-2 px-6 rounded-md shadow transition">
            Report Found Item
          </Link>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Reports</h2>
          <div className="flex space-x-2 text-sm">
            <Link href="/" className={`px-3 py-1 rounded-full ${!typeFilter ? "bg-gray-200 font-medium" : "text-gray-500 hover:bg-gray-100"}`}>All</Link>
            <Link href="/?type=LOST" className={`px-3 py-1 rounded-full ${typeFilter === "LOST" ? "bg-red-100 text-red-800 font-medium" : "text-gray-500 hover:bg-gray-100"}`}>Lost</Link>
            <Link href="/?type=FOUND" className={`px-3 py-1 rounded-full ${typeFilter === "FOUND" ? "bg-green-100 text-green-800 font-medium" : "text-gray-500 hover:bg-gray-100"}`}>Found</Link>
          </div>
        </div>

        <Suspense 
          key={typeFilter || "ALL"} 
          fallback={
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <ReportFeed typeFilter={typeFilter} />
        </Suspense>
      </section>
    </div>
  );
}
