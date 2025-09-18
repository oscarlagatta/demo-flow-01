"use client"

const formatCellValue = (value: any, columnName: string) => {
  if (value === null || value === undefined || value === "" || value === "null") {
    return "-"
  }

  // Format Dates
  if (columnName.includes("DATE") || columnName.includes("TS")) {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear().toString().slice(-2) // Get last 2 digits of year
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const day = date.getDate().toString().padStart(2, "0")
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        const seconds = date.getSeconds().toString().padStart(2, "0")

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
    } catch (e) {
      // if date parsing fails return original value
      return value
    }
  }

  // Format amounts
  if (columnName.includes("AMT") || columnName === "amount") {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(numValue)
    }
  }

  return String(value)
}

export { formatCellValue }
