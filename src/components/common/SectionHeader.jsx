import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeader({ title, to, linkLabel }) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="sec-title">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-xs text-primary hover:underline">
          {linkLabel} <ArrowRight size={11} className="rtl:rotate-180" />
        </Link>
      )}
    </div>
  );
}
