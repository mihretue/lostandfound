import { MatchResult } from "@/lib/matching";
import { Report } from "@prisma/client";
import { formatEventDate } from "@/lib/date";

interface MatchCardProps {
  currentReport: Report;
  candidateReport: Report;
  match: MatchResult;
}

export default function MatchCard({ currentReport, candidateReport, match }: MatchCardProps) {
  const isStrong = match.strength === "STRONG";
  const contactText = currentReport.type === "LOST" ? "Contact Finder" : "Contact Owner";

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center space-x-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              isStrong ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {match.score}% {match.strength} MATCH
          </span>
        </div>
        <a 
          href={`mailto:${candidateReport.contactEmail}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          {contactText}
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Report */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Your Report</div>
          
          {currentReport.imageUrl ? (
            <div className="mb-4 h-48 bg-gray-200 rounded overflow-hidden">
              <img src={currentReport.imageUrl} alt={currentReport.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="mb-4 h-48 bg-gray-100 rounded border border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-sm">
              No image provided
            </div>
          )}
          
          <h4 className="font-bold text-lg text-gray-900 mb-2">{currentReport.title}</h4>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold">Category:</span> {currentReport.category}</p>
            <p><span className="font-semibold">Location:</span> {currentReport.location}</p>
            <p><span className="font-semibold">Date:</span> {formatEventDate(currentReport.eventDate)}</p>
            {currentReport.color && <p><span className="font-semibold">Color:</span> {currentReport.color}</p>}
          </div>
          {currentReport.description && (
             <p className="mt-3 text-sm text-gray-600 border-t border-gray-200 pt-3">{currentReport.description}</p>
          )}
        </div>

        {/* Candidate Report */}
        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-inner">
          <div className="text-xs font-bold text-blue-500 mb-4 uppercase tracking-wider">Potential Match</div>
          
          {candidateReport.imageUrl ? (
            <div className="mb-4 h-48 bg-gray-200 rounded overflow-hidden">
              <img src={candidateReport.imageUrl} alt={candidateReport.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="mb-4 h-48 bg-gray-100 rounded border border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-sm">
              No image provided
            </div>
          )}
          
          <h4 className="font-bold text-lg text-gray-900 mb-2">{candidateReport.title}</h4>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold">Category:</span> {candidateReport.category}</p>
            <p><span className="font-semibold">Location:</span> {candidateReport.location}</p>
            <p><span className="font-semibold">Date:</span> {formatEventDate(candidateReport.eventDate)}</p>
            {candidateReport.color && <p><span className="font-semibold">Color:</span> {candidateReport.color}</p>}
          </div>
          {candidateReport.description && (
             <p className="mt-3 text-sm text-gray-600 border-t border-gray-100 pt-3">{candidateReport.description}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Matching Reasons</h4>
        <ul className="list-none space-y-2 text-sm text-gray-700">
          {match.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
