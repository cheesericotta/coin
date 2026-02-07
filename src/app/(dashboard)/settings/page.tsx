import Link from "next/link";
import {
    CreditCard,
    DollarSign,
    Folder,
    Plus,
    Settings,
    Trash2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { getCategories } from "@/actions/categories";
import { getCreditCards } from "@/actions/credit-cards";
import { getIncomeSources } from "@/actions/income-sources";

import { DataManagement } from "@/components/data-management";
import { Database } from "lucide-react";

export default async function SettingsPage() {
    const [categories, creditCards, incomeSources] = await Promise.all([
        getCategories(),
        getCreditCards(),
        getIncomeSources(),
    ]);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Settings className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Settings</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-8 p-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your categories, credit cards, and income sources
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Categories */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Folder className="h-5 w-5" />
                                        Categories
                                    </CardTitle>
                                    <CardDescription>
                                        Organize your spending by category
                                    </CardDescription>
                                </div>
                                <Button size="sm" asChild>
                                    <Link href="/settings/categories">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Manage
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {categories.map((cat: any) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-4 w-4 rounded-full"
                                                style={{ backgroundColor: cat.color || "#6b7280" }}
                                            />
                                            <span className="font-medium">{cat.name}</span>
                                            {cat.isDefault && (
                                                <Badge variant="secondary">Default</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">
                                        No categories yet
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Credit Cards */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Credit Cards
                                    </CardTitle>
                                    <CardDescription>
                                        Track spending by payment method
                                    </CardDescription>
                                </div>
                                <Button size="sm" asChild>
                                    <Link href="/settings/credit-cards">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {creditCards.map((card: any) => (
                                    <div
                                        key={card.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                        style={{ borderColor: card.color || undefined }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard
                                                className="h-5 w-5"
                                                style={{ color: card.color || undefined }}
                                            />
                                            <div>
                                                <span className="font-medium">{card.name}</span>
                                                {card.lastFour && (
                                                    <span className="text-muted-foreground text-sm ml-2">
                                                        •••• {card.lastFour}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {creditCards.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">
                                        No credit cards yet
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Income Sources */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Income Sources
                                    </CardTitle>
                                    <CardDescription>
                                        Track where your money comes from
                                    </CardDescription>
                                </div>
                                <Button size="sm" asChild>
                                    <Link href="/settings/income-sources">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {incomeSources.map((source: any) => (
                                    <div
                                        key={source.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-5 w-5 text-emerald-500" />
                                            <div>
                                                <span className="font-medium">{source.name}</span>
                                                <Badge variant="outline" className="ml-2">
                                                    {source.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {incomeSources.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">
                                        No income sources yet
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Database className="h-6 w-6" />
                            Data Management
                        </h2>
                        <p className="text-muted-foreground">
                            Control your data by exporting your records or starting fresh.
                        </p>
                    </div>
                    <DataManagement />
                </div>
            </div>
        </>
    );
}
