import { LoansDashboard } from "@/components/loans-dashboard";
import { getLoans } from "@/actions/loans";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CreditCard } from "lucide-react";

export default async function LoansPage() {
    const loans = await getLoans();

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <CreditCard className="h-4 w-4" />
                    <h1 className="text-lg font-semibold">Loans</h1>
                </div>
            </header>
            <LoansDashboard loans={loans} />
        </>
    );
}
