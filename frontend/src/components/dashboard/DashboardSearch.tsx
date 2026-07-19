import { Search } from 'lucide-react';
import { useState } from 'react';

interface DashboardSearchProps {
  className?: string;
}

export function DashboardSearch({ className = '' }: DashboardSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <div className={`
        flex items-center gap-3 px-4 py-3 bg-white rounded-xl border transition-all duration-200
        ${isFocused ? 'border-brand-500 shadow-sm ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'}
      `}>
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search tickets, incidents, knowledge base, assets, vendors..."
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 bg-slate-50 rounded border border-slate-200">
          <span>⌘</span><span>K</span>
        </kbd>
      </div>
    </div>
  );
}
