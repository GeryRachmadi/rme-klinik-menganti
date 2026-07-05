import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface EmptyTabStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionButton?: ReactNode;
}

export default function EmptyTabState({ icon: Icon, title, description, actionButton }: EmptyTabStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 border border-slate-200 rounded-3xl mt-4">
      <div className="bg-white w-16 h-16 flex items-center justify-center rounded-full shadow-sm border border-slate-100 mb-5">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
        {title}
      </h3>
      <p className={`text-slate-500 max-w-md text-sm leading-relaxed${actionButton ? ' mb-6' : ''}`} style={{ fontFamily: "var(--font-jakarta)" }}>
        {description}
      </p>
      {actionButton}
    </div>
  );
}
