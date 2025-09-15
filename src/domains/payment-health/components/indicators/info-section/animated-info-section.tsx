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
      // Small delay to ensure DOM is ready before animation
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, 10)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!shouldRender) {
    return null
  }

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-4px]"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      }}
    >
      <InfoSection />
    </div>
  )
}
