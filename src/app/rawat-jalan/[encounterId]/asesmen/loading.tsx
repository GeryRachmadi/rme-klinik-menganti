import { ChevronRight } from "lucide-react";

export default function AsesmenLoading() {
  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Breadcrumb skeleton */}
      <nav className="col-span-12 flex items-center gap-1.5 px-2">
        {[72, 96, 120, 160, 72].map((w, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} strokeWidth={2.5} className="text-gray-200 flex-shrink-0" />}
            <div
              className="h-4 bg-gray-200 rounded-full animate-pulse"
              style={{ width: w }}
            />
          </span>
        ))}
      </nav>

      {/* PatientAssessmentHeader skeleton */}
      <div className="col-span-12 bg-white rounded-3xl px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">

          {/* Left: avatar + identity lines */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />

            <div className="flex flex-col gap-2">
              {/* Name */}
              <div className="h-5 w-52 bg-gray-200 rounded-full animate-pulse" />

              {/* RM + NIK badges */}
              <div className="flex flex-wrap gap-2">
                <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-5 w-40 bg-gray-200 rounded-full animate-pulse" />
              </div>

              {/* Gender + Age badges */}
              <div className="flex flex-wrap gap-2">
                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: "50ms" }} />
                <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: "100ms" }} />
              </div>

              {/* Encounter context lines */}
              <div className="mt-1 space-y-1.5">
                <div className="h-4 w-60 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: "100ms" }} />
                <div className="h-4 w-44 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="h-4 w-72 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
              </div>
            </div>
          </div>

          {/* Right: action button */}
          <div className="h-9 w-40 bg-gray-200 rounded-full animate-pulse shrink-0" />
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="col-span-12 max-w-6xl mx-auto w-full px-4 py-2">
        <div className="h-px bg-gray-200 mb-6" />

        <div className="bg-slate-50 p-8 rounded-lg space-y-4">
          {[0, 100, 200, 300].map((delay) => (
            <div
              key={delay}
              className="h-12 bg-gray-200 rounded-lg animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <div className="h-11 w-36 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

    </div>
  );
}
