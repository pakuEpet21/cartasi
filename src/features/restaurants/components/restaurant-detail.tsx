/**
 * Super Admin Restaurant Management — Restaurant detail component
 * PR 3: Admin UI
 */

import { useQuery } from "@tanstack/react-query";
import { getRestaurantDetails } from "@/features/restaurants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteForm } from "./invite-form";
import { ToggleStatusButton } from "./toggle-status-button";
import type {
  SuperAdminRestaurantDetails,
  SuperAdminMember,
  RestaurantInvitation,
} from "@/features/restaurants/types";

interface RestaurantDetailProps {
  restaurantId: string;
}

export function RestaurantDetail({ restaurantId }: RestaurantDetailProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["super-admin", "restaurant", restaurantId],
    queryFn: () => getRestaurantDetails({ data: { restaurantId } }),
    enabled: !!restaurantId,
  });

  if (isLoading) {
    return <RestaurantDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">Error al cargar los detalles del restaurante.</p>
    );
  }

  return <RestaurantDetailContent data={data} />;
}

function RestaurantDetailContent({ data }: { data: SuperAdminRestaurantDetails }) {
  const { restaurant, invitations, members } = data;

  return (
    <div className="space-y-8">
      {/* Overview */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">{restaurant.name}</h2>
            <p className="text-muted-foreground font-mono text-sm">{restaurant.slug}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={restaurant.is_active ? "secondary" : "destructive"}>
              {restaurant.is_active ? "Activo" : "Inactivo"}
            </Badge>
            <ToggleStatusButton restaurant={restaurant} />
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Creado</span>
            <span>{new Date(restaurant.created_at).toLocaleDateString("es-ES")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono text-xs">{restaurant.id}</span>
          </div>
          {restaurant.email && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Email</span>
              <span>{restaurant.email}</span>
            </div>
          )}
          {restaurant.address && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Dirección</span>
              <span>{restaurant.address}</span>
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Members */}
      <section className="space-y-4">
        <h3 className="font-display text-lg">Miembros</h3>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay miembros registrados.</p>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Rol</th>
                  <th className="px-3 py-2 text-left font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member: SuperAdminMember) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{member.email}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{member.role}</Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Separator />

      {/* Invitations */}
      <section className="space-y-4">
        <h3 className="font-display text-lg">Invitaciones pendientes</h3>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay invitaciones pendientes.</p>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Rol</th>
                  <th className="px-3 py-2 text-left font-medium">Enviada</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv: RestaurantInvitation) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{inv.email}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{inv.role}</Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-md border border-dashed border-border p-4">
          <h4 className="text-sm font-medium mb-3">Enviar nueva invitación</h4>
          <InviteForm restaurantId={restaurant.id} />
        </div>
      </section>
    </div>
  );
}

function RestaurantDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
