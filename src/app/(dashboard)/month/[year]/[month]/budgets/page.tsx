import { BudgetsPage } from "@/components/budgets-page";
import { getBudgets } from "@/actions/budgets";
import { getCategories } from "@/actions/categories";


export default async function BudgetsSettingsPage({
    params,
}: {
    params: Promise<{ year: string; month: string }>;
}) {
    const { year: yearStr, month: monthStr } = await params;
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const [budgets, categories] = await Promise.all([
        getBudgets(year, month),
        getCategories(),
    ]);

    const formattedBudgets = budgets.map((b: any) => ({
        ...b,
        planned: Number(b.planned),
    }));

    return (
        <BudgetsPage
            year={year}
            month={month}
            budgets={formattedBudgets}
            categories={categories}
        />
    );
}
