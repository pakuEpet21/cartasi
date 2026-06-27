/**
 * Super Admin Restaurant Management — Restaurant list component
 * PR 3: Admin UI
 */

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { listRestaurants } from "@/features/restaurants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleStatusButton } from "./toggle-status-button";
import type { Restaurant } from "@/features/restaurants/types";

interface RestaurantListProps {
  page?: number;
  pageSize?: number;
}

export function RestaurantList({ page = 1, pageSize = 20 }: RestaurantListProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["super-admin", "restaurants", page, pageSize],
    queryFn: () => listRestaurants({ data: { page, pageSize } }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Error al cargar los restaurantes.</p>;
  }

  const { items, total } = data;

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay restaurantes registrados.</p>
        <Button asChild className="mt-4">
          <Link to="/admin/restaurants/new">
            <PlusIcon className="size-4" data-icon="inline-start" />
            Crear restaurante
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} restaurante{total !== 1 ? "s" : ""}
        </p>
        <Button asChild>
          <Link to="/admin/restaurants/new">
            <PlusIcon className="size-4" data-icon="inline-start" />
            Nuevo
          </Link>
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Miembros</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((restaurant: Restaurant) => (
              <RestaurantRow key={restaurant.id} restaurant={restaurant} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const memberCount =
    (restaurant as unknown as { restaurant_members: { count: number }[] }).restaurant_members?.[0]
      ?.count ?? 0;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          to="/admin/restaurants/$id"
          params={{ id: restaurant.id }}
          className="hover:underline"
        >
          {restaurant.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground font-mono text-xs">{restaurant.slug}</span>
      </TableCell>
      <TableCell>
        <Badge variant={restaurant.is_active ? "secondary" : "destructive"}>
          {restaurant.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm text-muted-foreground">{memberCount}</span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <ToggleStatusButton restaurant={restaurant} />
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/restaurants/$id" params={{ id: restaurant.id }}>
              Ver
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
