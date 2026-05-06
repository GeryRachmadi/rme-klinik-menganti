"use client";

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          // Tambahkan flex, items-center, dan gap-2 di baris ini
          className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? "text-[#2BB5A0]"
              : "text-gray-400 hover:text-gray-600"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {/* Label dibungkus span agar tidak terpotong (whitespace-nowrap) */}
          <span className="whitespace-nowrap">{tab.label}</span>
          
          {/* Ini kode untuk merender badge "KOSONG" */}
          {tab.badge && (
            <span>{tab.badge}</span>
          )}

          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2BB5A0] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}