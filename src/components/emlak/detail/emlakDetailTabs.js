"use client";

import { LayoutDashboard, ListChecks, Waves, MapPinned } from "lucide-react";

const tabs = [
  {
    id: "overview",
    label: "Genel Bakış",
    icon: LayoutDashboard,
  },
  {
    id: "features",
    label: "Özellikler",
    icon: ListChecks,
  },
  {
    id: "pools",
    label: "Havuz Bilgileri",
    icon: Waves,
  },
  {
    id: "location",
    label: "Konum",
    icon: MapPinned,
  },
];

export default function EmlakDetailTabs({ activeTab, onTabChange, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        role="tablist"
        aria-label="Emlak detay bölümleri"
        className="flex overflow-x-auto border-b border-slate-200 px-3 sm:px-6"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`emlak-tab-${tab.id}`}
              aria-selected={active}
              aria-controls="emlak-detail-panel"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex shrink-0 items-center gap-2 border-b-2 px-4 py-5 text-sm font-semibold transition ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id="emlak-detail-panel"
        role="tabpanel"
        aria-labelledby={`emlak-tab-${activeTab}`}
        className="p-5 sm:p-6"
      >
        {children}
      </div>
    </section>
  );
}
