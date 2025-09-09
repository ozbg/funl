import { type ClassValue, clsx } from "clsx"

// Note: cn function kept for potential component library compatibility with clsx
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}