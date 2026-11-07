import { useState } from 'react';
import { categoryEmoji } from '../../utils/format';
import { cn } from '../../utils/cn';

/**
 * The story's photo, or the category emoji when there is none (demo articles,
 * DW stories) or the image fails to load (removed, hotlink-blocked…).
 * Images are served by the news sites themselves; we only store the URL.
 */
export default function ArticleImage({ article, alt = '', className, emojiClassName }) {
  const [failed, setFailed] = useState(false);

  if (!article.imageUrl || failed) {
    return (
      <div aria-hidden className={cn('flex items-center justify-center bg-soft', className, emojiClassName)}>
        {categoryEmoji(article.category)}
      </div>
    );
  }
  return (
    <img
      src={article.imageUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('bg-soft object-cover', className)}
    />
  );
}
