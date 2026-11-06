import { getCategory } from '../../data/categories';
import { useLanguage } from '../../context/language';
import { cn } from '../../utils/cn';

export default function CategoryTag({ categoryId, className }) {
  const { isUrdu, categoryLabel } = useLanguage();
  const cat = getCategory(categoryId);
  if (!cat) return null;
  return (
    <span
      className={cn('badge', isUrdu && 'normal-case tracking-normal leading-[1.9]', className)}
      style={{ background: cat.color, color: cat.text }}
    >
      {categoryLabel(cat)}
    </span>
  );
}
