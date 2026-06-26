import { ShoppingBag } from "lucide-react";
import { useCart, cartCount } from "../store";

export function CartTrigger() {
  const items = useCart((s) => s.items);
  const open = useCart((s) => s.open);
  const count = cartCount(items);
  return (
    <button
      onClick={open}
      aria-label={`Abrir carrito (${count})`}
      className="relative inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Carrito</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
          {count}
        </span>
      )}
    </button>
  );
}