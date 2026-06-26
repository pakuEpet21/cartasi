import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";

type Msg = { role: "bot" | "user"; text: string };

const QUICK = [
  { q: "¿Cuál es vuestro horario?", k: "schedule" },
  { q: "¿Tenéis opciones sin gluten?", k: "gluten" },
  { q: "¿Puedo reservar mesa?", k: "reserve" },
  { q: "¿Dónde estáis?", k: "address" },
] as const;

export function ChatbotWidget({
  restaurantName, address, phone, email,
}: {
  restaurantName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: `¡Hola! Soy el asistente de ${restaurantName}. ¿En qué te ayudo?` },
  ]);
  const [input, setInput] = useState("");

  function reply(q: string): string {
    const t = q.toLowerCase();
    if (t.includes("horario") || t.includes("abierto") || t.includes("cierra")) {
      return "Encontrarás nuestro horario completo al pie de la página, en la sección Horario.";
    }
    if (t.includes("gluten") || t.includes("alérg") || t.includes("alerg")) {
      return "Sí. Activa el filtro de alérgenos en la carta para excluir los que necesites.";
    }
    if (t.includes("reserva") || t.includes("mesa")) {
      return "Puedes solicitar reserva en la sección Reservas más abajo. Confirmamos en menos de 24h.";
    }
    if (t.includes("dónde") || t.includes("donde") || t.includes("dirección") || t.includes("direccion")) {
      return address ? `Estamos en ${address}.` : "Consulta nuestra dirección en el pie de página.";
    }
    if (t.includes("teléfono") || t.includes("telefono") || t.includes("contacto")) {
      const bits = [phone && `tel: ${phone}`, email && `email: ${email}`].filter(Boolean).join(" · ");
      return bits || "Puedes contactarnos por los canales del pie de página.";
    }
    return "Buena pregunta. Para detalles, escríbenos por WhatsApp o usa el formulario de reservas. ¡Gracias!";
  }

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }, { role: "bot", text: reply(t) }]);
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asistente"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elev)] transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 right-5 z-40 flex h-[480px] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[calc(var(--radius)+4px)] border border-border bg-card shadow-2xl"
          >
            <header className="border-b border-border p-3">
              <p className="font-display text-sm">{restaurantName}</p>
              <p className="text-[11px] text-muted-foreground">Asistente · responde al instante</p>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span
                    className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
              {messages.length <= 1 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {QUICK.map((q) => (
                    <button
                      key={q.k}
                      onClick={() => send(q.q)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground/80 hover:bg-muted"
                    >
                      {q.q}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex gap-2 border-t border-border p-2"
            >
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta…"
                className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm"
              />
              <button
                aria-label="Enviar"
                className="rounded-full bg-primary p-2 text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}