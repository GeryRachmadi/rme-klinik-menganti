export default function RiwayatMedisLoading() {
  return (
    <div className="grid grid-cols-12 gap-6 animate-pulse">

      {/* Breadcrumb skeleton */}
      <div className="col-span-12 flex items-center gap-2 px-2">
        <div className="h-3.5 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-2.5 bg-gray-200 rounded" />
        <div className="h-3.5 w-36 bg-gray-200 rounded" />
      </div>

      {/* Page header card skeleton */}
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-7 w-56 bg-gray-100 rounded-xl" />
            <div className="h-5 w-14 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 w-64 bg-gray-100 rounded-xl" />
        </div>
        <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0" />
      </div>

      {/* Tab card skeleton */}
      <div className="col-span-12 bg-white rounded-3xl overflow-hidden">

        {/* Tab bar skeleton */}
        <div className="px-8 pt-6 border-b border-gray-100 pb-0">
          <div className="flex gap-2 pb-4">
            {[96, 128, 72, 100, 128].map((w, i) => (
              <div key={i} className={`h-5 bg-gray-100 rounded`} style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Tab content skeleton — Ringkasan layout */}
        <div className="px-8 py-8 space-y-10">

          {/* Section 1 */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-4 w-4 bg-gray-100 rounded" />
              <div className="h-5 w-40 bg-gray-100 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-4 w-4 bg-gray-100 rounded" />
              <div className="h-5 w-32 bg-gray-100 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-4 w-28 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-4 w-4 bg-gray-100 rounded" />
              <div className="h-5 w-44 bg-gray-100 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
