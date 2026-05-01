import { requireUser } from "@/lib/auth/server";
import { listIngredients } from "@/lib/compras/ingredient-actions";
import { IngredientsClient } from "./ingredientes-client";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const user = await requireUser();
  const groupId = user.roles.find((r) => r.groupId)?.groupId ?? null;

  const ingredients = await listIngredients();

  return (
    <IngredientsClient
      ingredients={ingredients}
      groupId={groupId ?? ""}
    />
  );
}
