export default function Loading() {
  return (
    <div className="bg-warm-cream min-h-screen py-6 md:py-10 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-7xl animate-pulse">
        <div className="mb-4 h-3 w-1/3 bg-navy-100 rounded" />
        <div className="mb-6 md:mb-8 h-72 md:h-[420px] w-full bg-navy-100 rounded-card" />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 space-y-6 md:space-y-8">
            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] space-y-4">
              <div className="h-4 w-24 bg-navy-100 rounded-pill" />
              <div className="h-7 w-3/4 bg-navy-100 rounded" />
              <div className="h-3 w-1/2 bg-navy-100 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-[#E8E0D0]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 bg-navy-100/60 rounded-btn" />
                ))}
              </div>
              <div className="h-3 w-full bg-navy-100 rounded" />
              <div className="h-3 w-5/6 bg-navy-100 rounded" />
              <div className="h-3 w-4/6 bg-navy-100 rounded" />
            </div>
          </div>
          <div className="hidden lg:block lg:w-1/3 h-96 bg-white border border-[#E8E0D0] rounded-card" />
        </div>
      </div>
    </div>
  );
}
