interface SectionTitleProps {
  children: React.ReactNode;
  suffix?: React.ReactNode;
}

export function SectionTitle({ children, suffix }: SectionTitleProps) {
  return (
    <p className="flex items-center gap-2">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#2BB5A0" }}>
        {children}
      </span>
      {suffix && (
        <span className="text-xs font-normal tracking-widest uppercase text-gray-400">{suffix}</span>
      )}
    </p>
  );
}
