import { IfFlag } from "@/features/flags";
import { Container } from "./container";
import type { StaticOpeningHour, StaticSocialLink } from "@/shared/config/restaurant-static";
import { formatTime, weekdayLabel } from "@/shared/lib/format";

export function SiteFooter({
  siteName,
  address,
  phone,
  email,
  openingHours,
  socialLinks,
}: {
  siteName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  openingHours: StaticOpeningHour[];
  socialLinks: StaticSocialLink[];
}) {
  return (
    <footer id="contacto" className="mt-20 border-t border-border bg-card">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="font-display text-lg">{siteName}</h3>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {address && <p>{address}</p>}
            {phone && <p>{phone}</p>}
            {email && <p>{email}</p>}
          </div>
        </div>
        <IfFlag name="openingHours">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide">Horario</h4>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {openingHours.map((h) => (
                <li key={h.weekday} className="flex justify-between gap-4">
                  <span>{weekdayLabel(h.weekday)}</span>
                  <span>
                    {h.is_closed
                      ? "Cerrado"
                      : `${formatTime(h.opens)} – ${formatTime(h.closes)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </IfFlag>
        <IfFlag name="socialLinks">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide">Síguenos</h4>
            <ul className="mt-3 space-y-1 text-sm">
              {socialLinks.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </IfFlag>
      </Container>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteName} · Hecho con cariño.
      </div>
    </footer>
  );
}