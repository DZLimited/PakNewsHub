import { useState } from 'react';
import { CategoryTile } from './CategoryIcon';
import { cn } from '../../utils/cn';

/**
 * The story's photo. Images are served by the news sites; we only store the URL.
 * When there is no photo (or it fails to load) it shows a tile in the
 * section's colour with the section icon, or nothing at all if
 * `placeholder={false}` (the article page drops the photo area instead).
 *
 * mode:
 *  - "cover" (default) fills the box and may crop the edges — for small
 *    thumbnails, which use a 16:9 box so news photos barely crop.
 *  - "full"  shows the WHOLE photo (object-contain). If the photo's shape
 *    doesn't match the box, the empty edges are filled with a blurred,
 *    enlarged copy of the same photo instead of bars. The second <img> uses
 *    the same URL, so the browser downloads it only once.
 *
 * onFail: called if the image can't be loaded (the hero switches layout).
 */
export default function ArticleImage({ article, alt = '', mode = 'cover', className, iconSize, placeholder = true, onFail }) {
  const [failed, setFailed] = useState(false);
  const fail = () => {
    setFailed(true);
    onFail?.();
  };

  if (!article.imageUrl || failed) {
    return placeholder ? <CategoryTile categoryId={article.category} iconSize={iconSize} className={className} /> : null;
  }

  const common = { src: article.imageUrl, referrerPolicy: 'no-referrer', decoding: 'async' };

  if (mode === 'full') {
    return (
      <div className={cn('relative overflow-hidden bg-slate-900', className)}>
        <img {...common} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl" />
        <img {...common} alt={alt} onError={fail} className="relative h-full w-full object-contain" />
      </div>
    );
  }

  return <img {...common} alt={alt} loading="lazy" onError={fail} className={cn('bg-soft object-cover', className)} />;
}
