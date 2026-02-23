 
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Plus, CreditCard, Calendar, TrendingDown, Trash2, Pencil } from "lucide-react";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
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
import { createLoan, deleteLoan, updateLoan } from "@/actions/loans";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface LoansDashboardProps {
    loans: {
        id: string;
        name: string;
        totalAmount: number;
        remainingAmount: number;
        interestRate: number;
        monthlyPayment: number | null;
        dueDate: number | null;
    }[];
}

export function LoansDashboard({ loans }: LoansDashboardProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<LoansDashboardProps["loans"][0] | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createLoan(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Loan added");
            setOpen(false);
        }
        setLoading(false);
    }

    async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedLoan) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateLoan(selectedLoan.id, formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Loan updated");
            setEditOpen(false);
            setSelectedLoan(null);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        setIdToDelete(id);
        setDeleteConfirmOpen(true);
    }

    async function confirmDelete() {
        if (!idToDelete) return;
        const result = await deleteLoan(idToDelete);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Loan deleted");
            setDeleteConfirmOpen(false);
            setIdToDelete(null);
        }
    }

    const totalDebt = loans.reduce((sum, loan) => sum + Number(loan.remainingAmount), 0);
    const totalMonthlyPayment = loans.reduce((sum, loan) => sum + (Number(loan.monthlyPayment) || 0), 0);

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Loans & Liablities</h2>
                    <p className="text-muted-foreground">
                        Manage your debts and payment schedules
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Loan
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Loan</DialogTitle>
                            <DialogDescription>
                                Track a new loan or debt
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Loan Name</Label>
                                <Input id="name" name="name" placeholder="e.g., Car Loan, Mortgage" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalAmount">Original Amount</Label>
                                <Input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0" placeholder="0.00" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="remainingAmount">Remaining Balance</Label>
                                <Input id="remainingAmount" name="remainingAmount" type="number" step="0.01" min="0" placeholder="Leave empty if same as Original" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interestRate">Interest Rate (Annual %)</Label>
                                <Input id="interestRate" name="interestRate" type="number" step="0.01" min="0" placeholder="e.g. 3.5" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                                <Input id="monthlyPayment" name="monthlyPayment" type="number" step="0.01" min="0" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
                                <Input id="dueDate" name="dueDate" type="number" min="1" max="31" placeholder="e.g. 15" />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" variant="destructive" className="flex-1" disabled={loading}>
                                    {loading ? "Adding..." : "Add Loan"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Loan</DialogTitle>
                            <DialogDescription>
                                Update loan details
                            </DialogDescription>
                        </DialogHeader>
                        {selectedLoan && (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Loan Name</Label>
                                    <Input id="edit-name" name="name" defaultValue={selectedLoan.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-totalAmount">Original Amount</Label>
                                    <Input id="edit-totalAmount" name="totalAmount" type="number" step="0.01" min="0" defaultValue={selectedLoan.totalAmount} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-remainingAmount">Remaining Balance</Label>
                                    <Input id="edit-remainingAmount" name="remainingAmount" type="number" step="0.01" min="0" defaultValue={selectedLoan.remainingAmount} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-interestRate">Interest Rate (Annual %)</Label>
                                    <Input id="edit-interestRate" name="interestRate" type="number" step="0.01" min="0" defaultValue={selectedLoan.interestRate} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-monthlyPayment">Monthly Payment</Label>
                                    <Input id="edit-monthlyPayment" name="monthlyPayment" type="number" step="0.01" min="0" defaultValue={selectedLoan.monthlyPayment ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-dueDate">Due Date (Day of Month)</Label>
                                    <Input id="edit-dueDate" name="dueDate" type="number" min="1" max="31" defaultValue={selectedLoan.dueDate ?? ""} />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        {loading ? "Updating..." : "Update Loan"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border-rose-500/20 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent -mr-12 -mt-12 rounded-full transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Debt</CardTitle>
                        <div className="bg-rose-500/20 p-2 rounded-lg z-10">
                            <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                            {formatCurrency(totalDebt)}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Calculated current balances</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-500/10 to-transparent -mr-12 -mt-12 rounded-full transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Monthly Payments</CardTitle>
                        <div className="bg-slate-500/20 p-2 rounded-lg z-10">
                            <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-extrabold tracking-tight">
                            {formatCurrency(totalMonthlyPayment)}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Combined monthly obligation</p>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this loan record and all associated history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIdToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loans.map((loan) => {
                    const progress = (Number(loan.remainingAmount) / Number(loan.totalAmount)) * 100;
                    const paidPercentage = 100 - progress;

                    return (
                        <Card key={loan.id} className="relative overflow-hidden group transition-all hover:shadow-md hover:border-rose-500/30">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-rose-600" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-base font-bold uppercase tracking-tight">{loan.name}</CardTitle>
                                        <CardDescription className="text-xs font-semibold text-rose-600 dark:text-rose-400">{Number(loan.interestRate)}% ANNUAL INTEREST</CardDescription>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => {
                                                setSelectedLoan(loan);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(loan.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-extrabold mb-1 tracking-tighter">{formatCurrency(Number(loan.remainingAmount))}</div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <span>Paid: {paidPercentage.toFixed(0)}%</span>
                                        <span>Total: {formatCurrency(Number(loan.totalAmount))}</span>
                                    </div>
                                    <Progress value={paidPercentage} className="h-2 bg-rose-100 dark:bg-rose-950/20 [&>div]:bg-rose-500" />
                                    {Number(loan.monthlyPayment) > 0 && Number(loan.remainingAmount) > 0 && (
                                        <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 text-right bg-rose-500/5 py-1 px-2 rounded w-fit ml-auto">
                                            EST. {Math.ceil(Number(loan.remainingAmount) / Number(loan.monthlyPayment))} MONTHS REMAINING
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded">
                                            <CreditCard className="h-3 w-3" />
                                        </div>
                                        <span className="uppercase tracking-tight">{formatCurrency(Number(loan.monthlyPayment || 0))}/MO</span>
                                    </div>
                                    {loan.dueDate && (
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded">
                                                <Calendar className="h-3 w-3" />
                                            </div>
                                            <span className="uppercase tracking-tight">DUE: {loan.dueDate}TH</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
