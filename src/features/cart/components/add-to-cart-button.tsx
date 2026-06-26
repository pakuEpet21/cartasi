import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../store";

export function AddToCartButton({
  id, name, priceCents, imageUrl,
}: {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string | null;
}) {
  const add = useCart((s) => s.add);
  return (
    <button
      type="button"
      onClick={() => {
        add({ id, name, priceCents, imageUrl });
        toast.success(`${name} añadido`);
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
      aria-label={`Añadir ${name} al carrito`}
    >
      <ShoppingBag className="h-3.5 w-3.5" />
      Añadir
    </button>
  );
}