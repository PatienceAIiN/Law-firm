import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns/format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, formatStr: string = "PPP") {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, formatStr)
}

export function formatTime(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "h:mm a")
}

export function formatDateTime(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "PPP 'at' h:mm a")
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Remove HTML tags and truncate
  const plainText = content.replace(/<[^>]*>/g, "")
  return truncateText(plainText, maxLength)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10
}
