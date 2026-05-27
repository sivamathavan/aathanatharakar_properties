"use client";

interface TabItem {
  value: string;
  label: string;
}

interface ScrollableTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
}

export function ScrollableTabBar({ tabs, activeTab, onChange }: ScrollableTabBarProps) {
  return (
    <div className="w-full border-b border-[#E8E0D0] overflow-x-auto scrollbar-hide py-1">
      <div className="flex gap-2 whitespace-nowrap min-w-max px-1">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={`px-4 py-2 text-sm font-sans font-medium rounded-pill border transition-all duration-200 ${
                isActive
                  ? "bg-gold-500 text-navy-900 border-gold-500 shadow-sm"
                  : "bg-white text-navy-700 border-[#E8E0D0] hover:bg-navy-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <style jsx global>{`
        /* Hide scrollbars for chrome/safari/firefox */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
