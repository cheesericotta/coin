"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Plus, Trash2, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Card,
    CardContent,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createIncomeSource, deleteIncomeSource, updateIncomeSource } from "@/actions/income-sources";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface IncomeSourcesSettingsProps {
    incomeSources: {
        id: string;
        name: string;
        type: string;
    }[];
}

export function IncomeSourcesSettings({ incomeSources }: IncomeSourcesSettingsProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<IncomeSourcesSettingsProps["incomeSources"][0] | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const result = await createIncomeSource(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Income source added");
            setOpen(false);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedSource) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateIncomeSource(selectedSource.id, formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Income source updated");
            setEditOpen(false);
            setSelectedSource(null);
            router.refresh();
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this income source?")) return;
        const result = await deleteIncomeSource(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Income source deleted");
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
                    <DollarSign className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Income Sources</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Income Sources</h2>
                        <p className="text-muted-foreground">
                            Manage your income streams
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Income Source
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Income Source</DialogTitle>
                                <DialogDescription>
                                    Add a new source of income to track
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g., Main Job, Freelance"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select name="type" required defaultValue="salary">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="salary">Salary</SelectItem>
                                            <SelectItem value="freelance">Freelance</SelectItem>
                                            <SelectItem value="investment">Investment</SelectItem>
                                            <SelectItem value="gift">Gift</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        {loading ? "Adding..." : "Add Source"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Income Source</DialogTitle>
                                <DialogDescription>
                                    Update income source details
                                </DialogDescription>
                            </DialogHeader>
                            {selectedSource && (
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                            id="edit-name"
                                            name="name"
                                            defaultValue={selectedSource.name}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-type">Type</Label>
                                        <Select name="type" required defaultValue={selectedSource.type}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="salary">Salary</SelectItem>
                                                <SelectItem value="freelance">Freelance</SelectItem>
                                                <SelectItem value="investment">Investment</SelectItem>
                                                <SelectItem value="gift">Gift</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setEditOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="flex-1" disabled={loading}>
                                            {loading ? "Updating..." : "Update Source"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {incomeSources.map((source) => (
                        <Card key={source.id} className="group relative">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {source.name}
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge variant="secondary" className="capitalize">
                                        {source.type}
                                    </Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => {
                                                setSelectedSource(source);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(source.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {incomeSources.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">No income sources yet</p>
                            <p className="text-muted-foreground">
                                Add your first income source to start tracking
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
