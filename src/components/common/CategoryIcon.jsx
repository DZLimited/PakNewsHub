import { Clapperboard, Cpu, FlaskConical, Globe, HeartPulse, Landmark, Newspaper, TrendingUp, Trophy } from 'lucide-react';
import { getCategory } from '../../data/categories';
import { cn } from '../../utils/cn';

// Drawn icons instead of emoji: they look the same on every device (Windows
// can't draw flag emoji, so 🇵🇰 showed as the letters "PK").
const ICONS = {
  pakistan: Landmark,
  world: Globe,
  business: TrendingUp,
  technology: Cpu,
  sports: Trophy,
  health: HeartPulse,
  science: FlaskConical,
  entertainment: Clapperboard,
};

export default function CategoryIcon({ categoryId, size = 20, strokeWidth = 1.75, className }) {
  const Icon = ICONS[categoryId] ?? Newspaper;
  return <Icon aria-hidden size={size} strokeWidth={strokeWidth} className={className} />;
}

/**
 * Stand-in for a missing photo: a tile in the story's section colour with the
 * section icon, so a story without a photo looks deliberate rather than broken.
 * Colours come from the category config; `.cat-tile` (globals.css) darkens
 * them for dark mode.
 */
export function CategoryTile({ categoryId, iconSize = 20, className }) {
  const cat = getCategory(categoryId);
  return (
    <div
      aria-hidden
      className={cn('cat-tile flex items-center justify-center', className)}
      style={cat && { '--cat-bg': cat.color, '--cat-fg': cat.text }}
    >
      <CategoryIcon categoryId={categoryId} size={iconSize} />
    </div>
  );
}
