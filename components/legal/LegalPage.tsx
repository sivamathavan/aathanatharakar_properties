export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#F8F6F0] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-navy-900 text-white rounded-2xl px-8 py-10 mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gold-500 mb-2">{title}</h1>
          <p className="text-gray-300 text-sm">Last updated: {updated}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4DED2] shadow-sm px-6 md:px-10 py-8 space-y-7 text-navy-800 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-navy-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}
