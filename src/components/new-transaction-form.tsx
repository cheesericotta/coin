"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CreditCard, DollarSign, Landmark } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { createTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { getCurrentDateInKL } from "@/lib/utils";

interface NewTransactionFormProps {
    categories: { id: string; name: string; color: string | null }[];
    creditCards: { id: string; name: string }[];
    incomeSources: { id: string; name: string }[];
    bankAccounts: { id: string; name: string; type: string }[];
    loans: { id: string; name: string }[];
}

export function NewTransactionForm({
    categories,
    creditCards,
    incomeSources,
    bankAccounts,
    loans,
}: NewTransactionFormProps) {
    const [type, setType] = useState<"expense" | "income">("expense");
    const [isLoanPayment, setIsLoanPayment] = useState(false);
    const [isCCPayment, setIsCCPayment] = useState(false);
    const [paymentSource, setPaymentSource] = useState("");
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date | undefined>(getCurrentDateInKL());
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("type", type);
        if (date) {
            formData.set("date", date.toISOString());
        }

        // Handle consolidated payment source for expenses
        if (type === "expense") {
            const source = formData.get("paymentSource") as string;
            if (source) {
                const [sourceType, id] = source.split(":");
                if (sourceType === "bank") {
                    formData.set("bankAccountId", id);
                    if (isCCPayment) {
                        formData.set("creditCardId", formData.get("targetCreditCardId") as string);
                    }
                } else if (sourceType === "card") {
                    formData.set("creditCardId", id);
                }
            }
        }

        const result = await createTransaction(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Transaction added successfully");
            router.push("/transactions");
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/transactions">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">New Transaction</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <Card className="max-w-2xl mx-auto w-full">
                    <CardHeader>
                        <CardTitle>Add Transaction</CardTitle>
                        <CardDescription>
                            Record a new income or expense transaction
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Transaction Type */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={type === "expense" ? "default" : "outline"}
                                    className={`flex-1 ${type === "expense" ? "bg-red-500 hover:bg-red-600" : ""}`}
                                    onClick={() => setType("expense")}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4 rotate-[-45deg]" />
                                    Expense
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === "income" ? "default" : "outline"}
                                    className={`flex-1 ${type === "income" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                                    onClick={() => {
                                        setType("income");
                                        setIsCCPayment(false);
                                        setIsLoanPayment(false);
                                    }}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4 rotate-[135deg]" />
                                    Income
                                </Button>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <DatePicker date={date} setDate={setDate} />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="What was this for?"
                                />
                            </div>

                            {/* Income specific fields */}
                            {type === "income" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankAccountId">Destination Account</Label>
                                        <Select name="bankAccountId">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Where is the money going?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id}>
                                                        <div className="flex items-center gap-2">
                                                            <Landmark className="h-4 w-4 text-muted-foreground" />
                                                            {account.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="incomeSourceId">Income Source</Label>
                                        <Select name="incomeSourceId">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Where is the money from?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {incomeSources.map((source) => (
                                                    <SelectItem key={source.id} value={source.id}>
                                                        {source.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {/* Expense specific fields */}
                            {type === "expense" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="categoryId">Category</Label>
                                        <Select name="categoryId">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="h-3 w-3 rounded-full"
                                                                style={{ backgroundColor: cat.color || "#6b7280" }}
                                                            />
                                                            {cat.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentSource">Source of Funds</Label>
                                        <Select name="paymentSource" onValueChange={(val) => {
                                            setPaymentSource(val);
                                            if (!val.startsWith("bank:")) setIsCCPayment(false);
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="How did you pay?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts.length > 0 && (
                                                    <>
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                            Accounts & Wallets
                                                        </div>
                                                        {bankAccounts.map((account) => (
                                                            <SelectItem key={account.id} value={`bank:${account.id}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                                                    {account.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </>
                                                )}
                                                {creditCards.length > 0 && (
                                                    <>
                                                        <Separator className="my-1" />
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                            Credit Cards
                                                        </div>
                                                        {creditCards.map((card) => (
                                                            <SelectItem key={card.id} value={`card:${card.id}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                                    {card.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {paymentSource.startsWith("bank:") && (
                                        <div className="space-y-4 border-t pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Credit Card Payment</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Is this a payment towards a credit card?
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={isCCPayment}
                                                    onCheckedChange={(checked) => {
                                                        setIsCCPayment(checked);
                                                        if (checked) setIsLoanPayment(false);
                                                    }}
                                                />
                                            </div>

                                            {isCCPayment && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="targetCreditCardId">Select Credit Card</Label>
                                                    <Select name="targetCreditCardId" required={isCCPayment}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Which card are you paying?" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {creditCards.map((card) => (
                                                                <SelectItem key={card.id} value={card.id}>
                                                                    {card.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-4 border-t pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Loan Payment</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Is this expense a payment for a loan?
                                                </p>
                                            </div>
                                            <Switch
                                                checked={isLoanPayment}
                                                onCheckedChange={(checked) => {
                                                    setIsLoanPayment(checked);
                                                    if (checked) setIsCCPayment(false);
                                                }}
                                            />
                                        </div>

                                        {isLoanPayment && (
                                            <div className="space-y-2">
                                                <Label htmlFor="loanId">Select Loan</Label>
                                                <Select name="loanId" required={isLoanPayment}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Which loan is this for?" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {loans.map((loan) => (
                                                            <SelectItem key={loan.id} value={loan.id}>
                                                                {loan.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    name="notes"
                                    placeholder="Any additional notes..."
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? "Adding..." : "Add Transaction"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
