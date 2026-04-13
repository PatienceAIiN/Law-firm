declare module 'date-fns/format' {
  export function format(
    date: Date | number,
    formatStr: string,
    options?: Record<string, unknown>
  ): string
}
