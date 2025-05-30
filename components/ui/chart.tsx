import * as React from "react"

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {}

export const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(({ className, ...props }, ref) => {
  return <div className={className} ref={ref} {...props} />
})
BarChart.displayName = "BarChart"

export const ChartContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={className} ref={ref} {...props} />
  },
)
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={className} ref={ref} {...props} />
  },
)
ChartTooltip.displayName = "ChartTooltip"

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={className} ref={ref} {...props} />
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"
