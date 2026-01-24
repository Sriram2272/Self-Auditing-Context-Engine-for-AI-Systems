import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  confidence: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceMeter({ confidence, showLabel = true, size = "md" }: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100);
  
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return "bg-chart-2";
    if (confidence >= 0.5) return "bg-chart-4";
    return "bg-destructive";
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return "High confidence";
    if (confidence >= 0.5) return "Moderate confidence";
    return "Low confidence";
  };

  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{getConfidenceLabel()}</span>
          <span className="font-mono font-medium">{percentage}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", getConfidenceColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
