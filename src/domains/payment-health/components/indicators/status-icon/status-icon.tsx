import { CheckCircle2, XCircle } from "lucide-react"

interface StatusIconProps {
  status: "✅" | "❌"
}

export default function StatusIcon({ status }: StatusIconProps) {
  if (status === "✅") {
    return <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
  }
  return <XCircle className="h-5 w-5 text-red-500 mx-auto" />
}
