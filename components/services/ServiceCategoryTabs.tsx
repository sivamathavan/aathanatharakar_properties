"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ScrollableTabBar } from "@/components/ui/ScrollableTabBar";

export function ServiceCategoryTabs({
  categories,
  activeCategory,
}: {
  categories: { value: string; label: string }[];
  activeCategory: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("category", val);
    } else {
      params.delete("category");
    }
    router.push(`/services?${params.toString()}`);
  };

  const tabs = [{ value: "", label: "All Services" }, ...categories];

  return (
    <div className="w-full">
      <ScrollableTabBar 
        tabs={tabs} 
        activeTab={activeCategory} 
        onChange={handleChange} 
      />
    </div>
  );
}
