/**
 * Converts raw seconds (number or string) into human-readable duration format
 *
 * Examples:
 * - 0.5 → "0.50s"
 * - 1.234 → "1.23s"
 * - 12.5 → "12.5s"
 * - 60 → "1m 00s"
 * - 65.786666 → "1m 05.79s"
 * - 3600 → "1h 00m 00s"
 */
export function formatDuration(input: number | string): string {
  // Convert input to number, handle invalid inputs
  const totalSeconds = typeof input === "string" ? Number.parseFloat(input) : input

  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "0.00s"
  }

  // Handle sub-second durations
  if (totalSeconds < 1) {
    return `${totalSeconds.toFixed(2)}s`
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  // Format based on the largest unit present
  if (hours > 0) {
    // Format: "1h 00m 00s" or "1h 00m 05.79s"
    const formattedMinutes = minutes.toString().padStart(2, "0")
    const formattedSeconds =
      seconds < 10 ? `0${seconds.toFixed(seconds % 1 === 0 ? 0 : 2)}` : seconds.toFixed(seconds % 1 === 0 ? 0 : 2)

    return `${hours}h ${formattedMinutes}m ${formattedSeconds}s`
  } else if (minutes > 0) {
    // Format: "1m 00s" or "1m 05.79s"
    const formattedSeconds =
      seconds < 10 ? `0${seconds.toFixed(seconds % 1 === 0 ? 0 : 2)}` : seconds.toFixed(seconds % 1 === 0 ? 0 : 2)

    return `${minutes}m ${formattedSeconds}s`
  } else {
    // Format: "12.5s" or "5s"
    return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 2)}s`
  }
}
