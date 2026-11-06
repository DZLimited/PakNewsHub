import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Join conditional class names and let later Tailwind classes win conflicts. */
export const cn = (...inputs) => twMerge(clsx(inputs));
