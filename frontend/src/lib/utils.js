import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * This is commonly used with shadcn/ui components
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
