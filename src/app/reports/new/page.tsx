import ReportForm from "@/components/ReportForm";

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const resolvedParams = await searchParams;
  const initialType = resolvedParams.type === "FOUND" ? "FOUND" : "LOST";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create a Report</h1>
        <p className="text-gray-600 mt-1">Provide as much detail as possible to help find a match.</p>
      </div>
      <ReportForm key={initialType} initialType={initialType} />
    </div>
  );
}
