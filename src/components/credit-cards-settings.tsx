"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createCreditCard, deleteCreditCard } from "@/actions/credit-cards";
import { toast } from "sonner";

const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
    "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
    "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

interface CreditCardsSettingsProps {
    creditCards: {
        id: string;
        name: string;
        lastFour: string | null;
        color: string | null;
    }[];
}

export function CreditCardsSettings({ creditCards }: CreditCardsSettingsProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState(colors[4]);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("color", selectedColor);

        const result = await createCreditCard(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Credit card added");
            setOpen(false);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        const result = await deleteCreditCard(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Credit card deleted");
            router.refresh();
        }
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <CreditCard className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Credit Cards</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Credit Cards</h2>
                        <p className="text-muted-foreground">
                            Manage your payment methods
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Credit Card
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Credit Card</DialogTitle>
                                <DialogDescription>
                                    Add a new credit card to track your spending
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Card Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g., Visa Platinum"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastFour">Last 4 Digits (optional)</Label>
                                    <Input
                                        id="lastFour"
                                        name="lastFour"
                                        placeholder="1234"
                                        maxLength={4}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`h-8 w-8 rounded-full transition-transform ${selectedColor === color
                                                    ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                                                    : ""
                                                    }`}
                                                style={{ backgroundColor: color, ["--tw-ring-color" as string]: color } as React.CSSProperties}
                                                onClick={() => setSelectedColor(color)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        {loading ? "Adding..." : "Add Card"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {creditCards.map((card) => (
                        <Card
                            key={card.id}
                            className="relative overflow-hidden"
                            style={{ borderColor: card.color || undefined }}
                        >
                            <div
                                className="absolute inset-0 opacity-5"
                                style={{ backgroundColor: card.color || undefined }}
                            />
                            <CardHeader className="relative">
                                <div className="flex items-center justify-between">
                                    <CreditCard
                                        className="h-8 w-8"
                                        style={{ color: card.color || undefined }}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(card.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                <CardTitle className="text-lg">{card.name}</CardTitle>
                                {card.lastFour && (
                                    <CardDescription>•••• •••• •••• {card.lastFour}</CardDescription>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {creditCards.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">No credit cards yet</p>
                            <p className="text-muted-foreground">
                                Add your first credit card to track spending
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
