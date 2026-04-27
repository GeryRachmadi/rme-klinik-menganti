"use client";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-100">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`relative px-6 py-4 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? "text-[#2BB5A0]"
              : "text-gray-400 hover:text-gray-600"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2BB5A0] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
