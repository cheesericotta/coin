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
        if (!confirm("Are you sure you want to delete this loan?")) return;
        const result = await deleteLoan(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Loan deleted");
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{formatCurrency(totalDebt)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Monthly Payments</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalMonthlyPayment)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loans.map((loan) => {
                    const progress = (Number(loan.remainingAmount) / Number(loan.totalAmount)) * 100;
                    const paidPercentage = 100 - progress;

                    return (
                        <Card key={loan.id} className="relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-base font-medium">{loan.name}</CardTitle>
                                        <CardDescription>{Number(loan.interestRate)}% Interest</CardDescription>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(loan.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-2">{formatCurrency(Number(loan.remainingAmount))}</div>
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Paid: {paidPercentage.toFixed(0)}%</span>
                                        <span>Of {formatCurrency(Number(loan.totalAmount))}</span>
                                    </div>
                                    <Progress value={paidPercentage} className="h-2" />
                                    {Number(loan.monthlyPayment) > 0 && Number(loan.remainingAmount) > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1 text-right">
                                            ~{Math.ceil(Number(loan.remainingAmount) / Number(loan.monthlyPayment))} months left
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatCurrency(Number(loan.monthlyPayment || 0))}/mo</span>
                                    </div>
                                    {loan.dueDate && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Due: {loan.dueDate}th</span>
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
