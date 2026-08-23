"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NavLinksContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const isNewPage = pathname === "/reports/new";

  const isLostActive = isNewPage && type === "LOST";
  const isFoundActive = isNewPage && type === "FOUND";

  return (
    <div className="flex space-x-4">
      <Link 
        href="/reports/new?type=LOST" 
        className={`text-sm font-medium ${isLostActive ? "text-blue-700 underline underline-offset-4" : "text-gray-600 hover:text-gray-900"}`}
      >
        Report Lost
      </Link>
      <Link 
        href="/reports/new?type=FOUND" 
        className={`text-sm font-medium ${isFoundActive ? "text-blue-700 underline underline-offset-4" : "text-gray-600 hover:text-gray-900"}`}
      >
        Report Found
      </Link>
    </div>
  );
}

export default function NavLinks() {
  return (
    <Suspense fallback={
      <div className="flex space-x-4">
        <span className="text-sm font-medium text-gray-600">Report Lost</span>
        <span className="text-sm font-medium text-gray-600">Report Found</span>
      </div>
    }>
      <NavLinksContent />
    </Suspense>
  );
}
