import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartTotalCents, cartCount } from "../store";
import { formatPrice } from "@/shared/lib/format";
import { useFlag } from "@/features/flags";

export function CartDrawer({
  currency, phone, restaurantName,
}: { currency: string; phone: string | null; restaurantName: string }) {
  const { items, isOpen, close, setQty, remove, clear } = useCart();
  const whatsappEnabled = useFlag("whatsappOrder");
  const total = cartTotalCents(items);
  const count = cartCount(items);

  const waUrl = (() => {
    if (!phone) return null;
    const lines = items.map((i) => `• ${i.qty}× ${i.name} — ${formatPrice(i.priceCents * i.qty, currency)}`);
    const text = `Hola ${restaurantName}, me gustaría pedir:%0A${lines.join("%0A")}%0A%0ATotal: ${formatPrice(total, currency)}`;
    const num = phone.replace(/[^\d]/g, "");
    return `https://wa.me/${num}?text=${text}`;
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="font-display text-lg">Tu pedido</h2>
                <span className="text-xs text-muted-foreground">({count})</span>
              </div>
              <button onClick={close} aria-label="Cerrar carrito" className="rounded-md p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <p className="mt-12 text-center text-sm text-muted-foreground">
                  Tu carrito está vacío.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((it) => (
                    <li key={it.id} className="flex gap-3 rounded-lg border border-border p-3">
                      {it.imageUrl && (
                        <img src={it.imageUrl} alt="" className="h-14 w-14 rounded-md object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{it.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(it.priceCents, currency)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => setQty(it.id, it.qty - 1)} className="rounded-md border border-border p-1 hover:bg-muted">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{it.qty}</span>
                          <button onClick={() => setQty(it.id, it.qty + 1)} className="rounded-md border border-border p-1 hover:bg-muted">
                            <Plus className="h-3 w-3" />
                          </button>
                          <button onClick={() => remove(it.id)} className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Eliminar">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(it.priceCents * it.qty, currency)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-xl">{formatPrice(total, currency)}</span>
                </div>
                {whatsappEnabled && waUrl && (
                  <a
                    href={waUrl} target="_blank" rel="noreferrer"
                    className="block w-full rounded-full bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground"
                  >
                    Enviar pedido por WhatsApp
                  </a>
                )}
                <button onClick={clear} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground">
                  Vaciar carrito
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}