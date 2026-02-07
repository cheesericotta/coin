import { CreditCardsSettings } from "@/components/credit-cards-settings";
import { getCreditCards } from "@/actions/credit-cards";

export default async function CreditCardsPage() {
    const creditCards = await getCreditCards();
    return <CreditCardsSettings creditCards={creditCards} />;
}
