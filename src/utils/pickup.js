// Upcoming dates follow the market's operating weekdays; no travel estimates.
export function pickupDates(market, today = new Date()) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const days = weekdays.filter((day) => market?.day?.toLowerCase().includes(day.toLowerCase()))
  const dates = []
  for (let offset = 1; offset <= 28 && dates.length < 4; offset++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
    if (days.includes(weekdays[date.getDay()])) dates.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
  }
  return dates
}
