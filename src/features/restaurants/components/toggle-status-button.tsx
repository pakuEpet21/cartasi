/**
 * Super Admin Restaurant Management — Toggle status button
 * PR 3: Admin UI
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toggleRestaurantStatus } from "@/features/restaurants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Restaurant } from "@/features/restaurants/types";

interface ToggleStatusButtonProps {
  restaurant: Restaurant;
}

export function ToggleStatusButton({ restaurant }: ToggleStatusButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  async function handleToggle(confirmed: boolean) {
    if (!confirmed) {
      setOpen(false);
      return;
    }

    setOpen(false);
    try {
      await toggleRestaurantStatus({
        data: {
          restaurantId: restaurant.id,
          isActive: !restaurant.is_active,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "restaurant", restaurant.id] });
      toast.success(
        restaurant.is_active
          ? ` "${restaurant.name}" ha sido desactivado.`
          : ` "${restaurant.name}" ha sido activado.`,
      );
    } catch {
      toast.error("Error al cambiar el estado del restaurante.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer">
          <Switch checked={restaurant.is_active} aria-label="Cambiar estado" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {restaurant.is_active ? "Desactivar" : "Activar"} restaurante
          </AlertDialogTitle>
          <AlertDialogDescription>
            {restaurant.is_active
              ? `¿Estás seguro de que quieres desactivar "${restaurant.name}"? Los miembros perderán el acceso inmediatamente.`
              : `¿Quieres activar "${restaurant.name}"? Los miembros recuperarán el acceso.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleToggle(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleToggle(true)}>
            {restaurant.is_active ? "Desactivar" : "Activar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
