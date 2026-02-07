import { IncomeSourcesSettings } from "@/components/income-sources-settings";
import { getIncomeSources } from "@/actions/income-sources";

export default async function IncomeSourcesPage() {
    const incomeSources = await getIncomeSources();
    return <IncomeSourcesSettings incomeSources={incomeSources} />;
}
