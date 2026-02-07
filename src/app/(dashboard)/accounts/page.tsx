import { AccountsDashboard } from "@/components/accounts-dashboard";
import { getBankAccounts, getSavingsGrowthStats } from "@/actions/accounts";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Landmark } from "lucide-react";

export default async function AccountsPage() {
    const [accounts, growthStats] = await Promise.all([
        getBankAccounts(),
        getSavingsGrowthStats()
    ]);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Landmark className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Accounts</h1>
                </div>
            </header>
            <AccountsDashboard accounts={accounts} growthStats={growthStats} />
        </>
    );
}
