"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "@/components/i18n/I18nProvider";

export interface DayPoint {
  date: string; // yyyy-mm-dd (IST)
  value: number;
}

const label = (d: string) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** One measure per chart (views or enquiries), one bar per day, hover for the exact count. */
export function StatsChart({ data, title, unit }: { data: DayPoint[]; title: string; unit: string }) {
  const t = useT();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <figure className="bg-white rounded-card border border-[#E4DED2] p-4 space-y-2">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-navy-900">{title}</span>
        <span className="text-sm text-navy-700">{t("{n} in 30 days", { n: total })}</span>
      </figcaption>
      <div className="h-48" role="img" aria-label={`${title}: ${t("{n} in 30 days", { n: total })}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="#EFEBDF" />
            <XAxis dataKey="date" tickFormatter={label} tick={{ fontSize: 11, fill: "#1A524C" }} tickLine={false} axisLine={{ stroke: "#E4DED2" }} interval={6} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#1A524C" }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              cursor={{ fill: "#E7F1F0" }}
              formatter={(v: number) => [`${v} ${unit}`, ""]}
              labelFormatter={(d: string) => label(d)}
              separator=""
              contentStyle={{ borderRadius: 8, border: "1px solid #E4DED2", fontSize: 13 }}
            />
            <Bar dataKey="value" fill="#2E7D75" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-navy-700 underline">{t("See as a table")}</summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-navy-600"><th className="py-1">{t("Date")}</th><th className="py-1 text-right">{title}</th></tr>
          </thead>
          <tbody>
            {[...data].reverse().filter((d) => d.value > 0).map((d) => (
              <tr key={d.date} className="border-t border-[#E4DED2]"><td className="py-1">{label(d.date)}</td><td className="py-1 text-right">{d.value}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
