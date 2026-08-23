import Link from "next/link";
import { Report } from "@prisma/client";
import { formatEventDate } from "@/lib/date";
import ReportTypeBadge from "./ReportTypeBadge";

export default function ReportCard({ report }: { report: Report }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
          {report.title}
        </h3>
        <ReportTypeBadge type={report.type} />
      </div>
      
      <div className="flex gap-4">
        {report.imageUrl && (
          <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md overflow-hidden relative">
            <img src={report.imageUrl} alt={report.title} className="object-cover w-full h-full" />
          </div>
        )}
        <div className="space-y-2 text-sm text-gray-600 flex-1 min-w-0">
          <div className="flex items-center">
            <span className="font-medium w-20 text-gray-500">Category:</span>
            <span className="truncate">{report.category}</span>
          </div>
        <div className="flex items-center">
          <span className="font-medium w-20 text-gray-500">Location:</span>
          <span className="truncate">{report.location}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium w-20 text-gray-500">Date:</span>
          <span>{formatEventDate(report.eventDate)}</span>
        </div>
        </div>
      </div>
    </Link>
  );
}
