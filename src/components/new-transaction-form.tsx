"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, DollarSign, Landmark } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { createTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { getCurrentDateInKL } from "@/lib/utils";

interface NewTransactionFormProps {
    categories: { id: string; name: string; color: string | null }[];
    creditCards: { id: string; name: string; balance: number; balanceExcludingInstallments?: number }[];
    incomeSources: { id: string; name: string }[];
    bankAccounts: { id: string; name: string; type: string }[];
    loans: { id: string; name: string; monthlyPayment?: number | null; remainingAmount?: number }[];
    installments: { id: string; name: string; monthlyPayment: number; creditCardId: string }[];
}

type TransactionType = "expense" | "payment" | "income";

function formatDateToYyyyMmDd(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatAmountValue(value: number) {
    return Math.max(value, 0).toFixed(2);
}

export function NewTransactionForm({
    categories,
    creditCards,
    incomeSources,
    bankAccounts,
    loans,
    installments,
}: NewTransactionFormProps) {
    const [type, setType] = useState<TransactionType>("expense");
    const [sourceOfFunds, setSourceOfFunds] = useState("");
    const [incomeDestination, setIncomeDestination] = useState("");
    const [paymentTarget, setPaymentTarget] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date | undefined>(getCurrentDateInKL());
    const router = useRouter();

    function handlePaymentTargetChange(target: string) {
        setPaymentTarget(target);
        const [targetType, targetId] = target.split(":");

        if (targetType === "loan") {
            const loan = loans.find((l) => l.id === targetId);
            const suggestedAmount = loan?.monthlyPayment ?? loan?.remainingAmount ?? 0;
            setAmount(formatAmountValue(suggestedAmount));
            return;
        }

        if (targetType === "installment") {
            const installment = installments.find((i) => i.id === targetId);
            setAmount(formatAmountValue(installment?.monthlyPayment ?? 0));
            return;
        }

        if (targetType === "card") {
            const card = creditCards.find((c) => c.id === targetId);
            const cardAmount = card?.balanceExcludingInstallments ?? card?.balance ?? 0;
            setAmount(formatAmountValue(cardAmount));
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("type", type);
        if (date) {
            formData.set("date", formatDateToYyyyMmDd(date));
        }

        if (type === "expense") {
            const source = formData.get("sourceOfFunds") as string;
            if (source) {
                const [sourceType, id] = source.split(":");
                if (sourceType === "bank") {
                    formData.set("bankAccountId", id);
                } else if (sourceType === "card") {
                    formData.set("creditCardId", id);
                }
            }
        }

        if (type === "payment") {
            formData.delete("categoryId");
            formData.delete("incomeSourceId");

            const source = formData.get("sourceOfFunds") as string;
            if (source) {
                const [sourceType, id] = source.split(":");
                if (sourceType === "bank") {
                    formData.set("bankAccountId", id);
                }
            }

            const target = formData.get("paymentTarget") as string;
            if (target) {
                const [targetType, id] = target.split(":");
                if (targetType === "loan") {
                    formData.set("loanId", id);
                } else if (targetType === "installment") {
                    formData.set("installmentId", id);
                    const installment = installments.find((inst) => inst.id === id);
                    if (installment) {
                        formData.set("creditCardId", installment.creditCardId);
                    }
                } else if (targetType === "card") {
                    formData.set("creditCardId", id);
                }
            }
        }

        if (type === "income") {
            formData.delete("categoryId");
            formData.delete("loanId");
            formData.delete("installmentId");

            const destination = formData.get("incomeDestination") as string;
            if (destination) {
                const [destinationType, id] = destination.split(":");
                if (destinationType === "bank") {
                    formData.set("bankAccountId", id);
                    formData.delete("creditCardId");
                } else if (destinationType === "card") {
                    formData.set("creditCardId", id);
                    formData.delete("bankAccountId");
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
                            Record an income, expense, or payment
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2 md:grid-cols-3">
                                <Button
                                    type="button"
                                    variant={type === "expense" ? "default" : "outline"}
                                    className={type === "expense" ? "bg-red-500 hover:bg-red-600" : ""}
                                    onClick={() => setType("expense")}
                                >
                                    Expense
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === "payment" ? "default" : "outline"}
                                    className={type === "payment" ? "bg-amber-500 hover:bg-amber-600" : ""}
                                    onClick={() => setType("payment")}
                                >
                                    Payment
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === "income" ? "default" : "outline"}
                                    className={type === "income" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                                    onClick={() => setType("income")}
                                >
                                    Income
                                </Button>
                            </div>

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
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Date</Label>
                                <DatePicker date={date} setDate={setDate} />
                                <p className="text-xs text-muted-foreground">
                                    Transactions dated on day 25 or later are counted toward next month&apos;s budget.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="What was this for?"
                                />
                            </div>

                            {type === "expense" && (
                                <div className="grid gap-4 md:grid-cols-2">
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
                                        <Label htmlFor="sourceOfFunds">Source of Funds</Label>
                                        <Select name="sourceOfFunds" value={sourceOfFunds} onValueChange={setSourceOfFunds} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="How did you pay?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts.map((account) => (
                                                    <SelectItem key={account.id} value={`bank:${account.id}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Landmark className="h-4 w-4 text-muted-foreground" />
                                                            {account.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                {creditCards.map((card) => (
                                                    <SelectItem key={card.id} value={`card:${card.id}`}>
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                            {card.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {type === "payment" && (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="paymentTarget">Payment Target</Label>
                                            <Select name="paymentTarget" value={paymentTarget} onValueChange={handlePaymentTargetChange} required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="What are you paying?" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {loans.length > 0 && (
                                                        <>
                                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                                Loans
                                                            </div>
                                                            {loans.map((loan) => (
                                                                <SelectItem key={loan.id} value={`loan:${loan.id}`}>
                                                                    {loan.name}
                                                                </SelectItem>
                                                            ))}
                                                        </>
                                                    )}
                                                    {installments.length > 0 && (
                                                        <>
                                                            <Separator className="my-1" />
                                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                                Installments
                                                            </div>
                                                            {installments.map((installment) => (
                                                                <SelectItem key={installment.id} value={`installment:${installment.id}`}>
                                                                    {installment.name}
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
                                                                    {card.name}
                                                                </SelectItem>
                                                            ))}
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sourceOfFunds">Pay From</Label>
                                            <Select name="sourceOfFunds" value={sourceOfFunds} onValueChange={setSourceOfFunds} required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Which account pays this?" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {bankAccounts.map((account) => (
                                                        <SelectItem key={account.id} value={`bank:${account.id}`}>
                                                            <div className="flex items-center gap-2">
                                                                <Landmark className="h-4 w-4 text-muted-foreground" />
                                                                {account.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Amount is auto-filled for selected targets, but you can adjust it before submitting.
                                    </p>
                                </>
                            )}

                            {type === "income" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="incomeDestination">Destination</Label>
                                        <Select name="incomeDestination" value={incomeDestination} onValueChange={setIncomeDestination}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Where does this go?" />
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
                                                            Credit Cards (Cashback/Statement Credit)
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

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    name="notes"
                                    placeholder="Any additional notes..."
                                />
                            </div>

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
