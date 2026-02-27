"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PeriodOption {
    value: string;
    label: string;
}

interface TransactionsMonthFilterProps {
    selectedPeriod: string;
    options: PeriodOption[];
}

export function TransactionsMonthFilter({
    selectedPeriod,
    options,
}: TransactionsMonthFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function onPeriodChange(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("period", value);
        router.push(`/transactions?${params.toString()}`);
    }

    return (
        <div className="w-full sm:w-[240px]">
            <Select value={selectedPeriod} onValueChange={onPeriodChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

