import { NewTransactionForm } from "@/components/new-transaction-form";
import { getCategories } from "@/actions/categories";
import { getCreditCards } from "@/actions/credit-cards";
import { getIncomeSources } from "@/actions/income-sources";
import { getBankAccounts } from "@/actions/accounts";
import { getLoans } from "@/actions/loans";
import { getInstallments } from "@/actions/installments";

export default async function NewTransactionPage() {
    const [categories, creditCards, incomeSources, bankAccounts, loans, installments] = await Promise.all([
        getCategories(),
        getCreditCards(),
        getIncomeSources(),
        getBankAccounts(),
        getLoans(),
        getInstallments(),
    ]);

    return (
        <NewTransactionForm
            categories={categories}
            creditCards={creditCards}
            incomeSources={incomeSources}
            bankAccounts={bankAccounts}
            loans={loans}
            installments={installments}
        />
    );
}
