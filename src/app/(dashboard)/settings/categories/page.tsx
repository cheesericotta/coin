import { getCategories } from "@/actions/categories";
import { CategoriesSettings } from "@/components/categories-settings";

export default async function CategoriesPage() {
    const categories = await getCategories();

    return <CategoriesSettings categories={categories} />;
}
