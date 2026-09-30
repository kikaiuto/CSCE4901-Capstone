const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

interface DateParts {
  year: number
  month: number
  day: number
}

export function parseDate(value: string): DateParts {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

export function shortDate(value: string): string {
  const { month, day } = parseDate(value)
  return `${MONTHS[month - 1]} ${day}`
}

export function longDate(value: string): string {
  const { year, month, day } = parseDate(value)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${weekday}, ${MONTHS[month - 1]} ${day}`
}

export function monthLabel(value: string): string {
  const { month } = parseDate(value)
  return MONTHS[month - 1]
}
