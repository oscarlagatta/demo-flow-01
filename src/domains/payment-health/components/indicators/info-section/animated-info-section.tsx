"use client"
import { useEffect, useState } from "react"
import { InfoSection } from "./info-section"

interface AnimatedInfoSectionProps {
  isVisible: boolean
}

export function AnimatedInfoSection({ isVisible }: AnimatedInfoSectionProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!shouldRender) {
    return null
  }

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isAnimating ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-[-2px] scale-[0.98]"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    >
      <InfoSection />
    </div>
  )
}
