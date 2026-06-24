export const WORKSPACE_LAWYER_SEAT_LIMIT = 8

export function lawyerSeatLimitMessage(limit = WORKSPACE_LAWYER_SEAT_LIMIT) {
  return `This workspace includes ${limit} lawyer portal seats. Remove an existing lawyer before adding another.`
}
