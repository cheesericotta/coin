import { CreditCardsSettings } from "@/components/credit-cards-settings";
import { getCreditCards } from "@/actions/credit-cards";
import { getInstallments } from "@/actions/installments";
import { getCategories } from "@/actions/categories";

export default async function CreditCardsPage() {
    const [creditCards, installments, categories] = await Promise.all([
        getCreditCards(),
        getInstallments(),
        getCategories(),
    ]);

    return (
        <CreditCardsSettings
            creditCards={creditCards}
            installments={installments}
            categories={categories}
        />
    );
}
