"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
    income: {
        label: "Income",
        color: "hsl(142 71% 45%)", // emerald-500
    },
    expenses: {
        label: "Expenses",
        color: "hsl(346 84% 61%)", // rose-500
    },
} satisfies ChartConfig

interface MonthlyBreakdownChartProps {
    data: {
        month: string
        income: number
        expenses: number
    }[]
}

export function MonthlyBreakdownChart({ data }: MonthlyBreakdownChartProps) {
    // Calculate trend (simplified: compare current month with previous)
    const currentMonthData = data[data.length - 1];
    const prevMonthData = data.length > 1 ? data[data.length - 2] : null;

    const trendPercentage = prevMonthData && prevMonthData.expenses > 0
        ? ((currentMonthData.expenses - prevMonthData.expenses) / prevMonthData.expenses) * 100
        : 0;

    const isTrendingUp = trendPercentage > 0;

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold uppercase tracking-tight">Monthly Breakdown</CardTitle>
                <CardDescription className="font-medium text-[10px] uppercase tracking-widest">
                    Income and Expenses trend over the last 6 months
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="expenses"
                            type="natural"
                            fill="var(--color-expenses)"
                            fillOpacity={0.4}
                            stroke="var(--color-expenses)"
                        />
                        <Area
                            dataKey="income"
                            type="natural"
                            fill="var(--color-income)"
                            fillOpacity={0.4}
                            stroke="var(--color-income)"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="border-t bg-slate-50/30 dark:bg-slate-900/30 py-4 mt-auto">
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            {isTrendingUp ? "Expenses up" : "Expenses down"} by {Math.abs(trendPercentage).toFixed(1)}% this month{" "}
                            <TrendingUp className={`h-4 w-4 ${isTrendingUp ? "text-rose-500" : "text-emerald-500 rotate-180"}`} />
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 leading-none text-xs">
                            {data[0]?.month} - {data[data.length - 1]?.month} {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
