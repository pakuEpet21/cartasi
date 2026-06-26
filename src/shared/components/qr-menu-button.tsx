import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function QrMenuButton() {
  const [open, setOpen] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin + "/" : "";
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Mostrar QR de la carta"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-wide text-foreground/80 hover:bg-muted"
      >
        <QrCode className="h-3.5 w-3.5" />
        QR
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-[calc(var(--radius)+4px)] bg-background p-6 text-center shadow-2xl"
            >
              <button
                onClick={() => setOpen(false)} aria-label="Cerrar"
                className="absolute right-2 top-2 rounded-md p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="font-display text-lg">Escanea para ver la carta</h3>
              <p className="mt-1 text-xs text-muted-foreground">Comparte esta URL en tus mesas.</p>
              <div className="mt-4 inline-block rounded-md bg-white p-3">
                <QRCodeSVG value={url} size={208} />
              </div>
              <p className="mt-3 truncate text-xs text-muted-foreground">{url}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}