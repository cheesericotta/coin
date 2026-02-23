/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useMemo } from "react";
import {
    ArrowDownRight,
    ArrowUpRight,
    Pencil,
    Filter,
    Search,
    Trash2,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { EditTransactionForm } from "./edit-transaction-form";
import { format } from "date-fns";

interface TransactionListProps {
    initialTransactions: any[];
    categories: any[];
    creditCards: any[];
    incomeSources: any[];
    bankAccounts: any[];
    loans: any[];
}

export function TransactionList({
    initialTransactions,
    categories,
    creditCards,
    incomeSources,
    bankAccounts,
    loans,
}: TransactionListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [incomeSourceFilter, setIncomeSourceFilter] = useState<string>("all");

    const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredTransactions = useMemo(() => {
        return initialTransactions.filter((tx) => {
            const matchesSearch = (tx.description || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === "all" || tx.type?.toLowerCase() === typeFilter.toLowerCase();
            const matchesCategory = categoryFilter === "all" || tx.categoryId === categoryFilter;
            const matchesIncomeSource = incomeSourceFilter === "all" || tx.incomeSourceId === incomeSourceFilter;

            let matchesPayment = true;
            if (paymentFilter !== "all") {
                const [sourceType, id] = paymentFilter.split(":");
                if (sourceType === "bank") {
                    matchesPayment = tx.bankAccountId === id;
                } else if (sourceType === "card") {
                    matchesPayment = tx.creditCardId === id;
                }
            }

            return matchesSearch && matchesType && matchesCategory && matchesPayment && matchesIncomeSource;
        });
    }, [initialTransactions, searchTerm, typeFilter, categoryFilter, paymentFilter, incomeSourceFilter]);

    async function handleDelete() {
        if (!deletingId) return;
        setIsDeleting(true);
        const result = await deleteTransaction(deletingId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Transaction deleted");
            setDeletingId(null);
        }
        setIsDeleting(false);
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search descriptions..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={incomeSourceFilter} onValueChange={setIncomeSourceFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Income Sources" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Income Sources</SelectItem>
                        {incomeSources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>
                                {source.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Payment Methods" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Payment Methods</SelectItem>
                        {bankAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={`bank:${acc.id}`}>
                                {acc.name} (Bank)
                            </SelectItem>
                        ))}
                        {creditCards.map((card) => (
                            <SelectItem key={card.id} value={`card:${card.id}`}>
                                {card.name} (Card)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(new Date(tx.date), "dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {tx.type === "income" ? (
                                                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate">{tx.description || "-"}</span>
                                                    {tx.loanId && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-500/10 text-red-500 border-red-500/20">
                                                            Loan
                                                        </Badge>
                                                    )}
                                                    {tx.installmentId && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                            Inst.
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {tx.category ? (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-2 w-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: tx.category.color || "#6b7280" }}
                                                />
                                                <span className="truncate">{tx.category.name}</span>
                                            </div>
                                        ) : tx.incomeSource ? (
                                            <Badge variant="outline">{tx.incomeSource.name}</Badge>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate">
                                        {tx.creditCard?.name || tx.bankAccount?.name || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${tx.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                                            {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => setEditingTransaction(tx)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeletingId(tx.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No transactions found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                        <DialogDescription>
                            Make changes to your transaction details.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTransaction && (
                        <EditTransactionForm
                            transaction={editingTransaction}
                            categories={categories}
                            creditCards={creditCards}
                            incomeSources={incomeSources}
                            bankAccounts={bankAccounts}
                            loans={loans}
                            onSuccess={() => setEditingTransaction(null)}
                            onCancel={() => setEditingTransaction(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            transaction and reverse its effect on your account balance.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
