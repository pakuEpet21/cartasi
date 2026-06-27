/**
 * Super Admin Restaurant Management — Invite form component
 * PR 3: Admin UI
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { assignOwner, assignStaff } from "@/features/restaurants";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ownerSchema = z.object({
  email: z.string().email("Email inválido"),
});

const staffSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "staff"]),
});

type OwnerFormValues = z.infer<typeof ownerSchema>;
type StaffFormValues = z.infer<typeof staffSchema>;

interface InviteFormProps {
  restaurantId: string;
  defaultType?: "owner" | "staff";
}

export function InviteForm({ restaurantId, defaultType = "owner" }: InviteFormProps) {
  const [inviteType, setInviteType] = useState<"owner" | "staff">(defaultType);
  const [tokenUrl, setTokenUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ownerForm = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { email: "" },
  });

  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { email: "", role: "staff" },
  });

  async function handleOwnerSubmit(values: OwnerFormValues) {
    setIsSubmitting(true);
    try {
      const result = await assignOwner({ data: { restaurantId, email: values.email } });
      const url = `${window.location.origin}/invite/${result.token}`;
      setTokenUrl(url);
      ownerForm.reset();
      toast.success("Invitación creada. Comparte el enlace con el propietario.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStaffSubmit(values: StaffFormValues) {
    setIsSubmitting(true);
    try {
      const result = await assignStaff({
        data: { restaurantId, email: values.email, role: values.role },
      });
      const url = `${window.location.origin}/invite/${result.token}`;
      setTokenUrl(url);
      staffForm.reset();
      toast.success("Invitación creada. Comparte el enlace con el usuario.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyToClipboard() {
    if (tokenUrl) {
      navigator.clipboard.writeText(tokenUrl);
      toast.success("Enlace copiado al portapapeles.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setInviteType("owner")}
          className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
            inviteType === "owner"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          Propietario
        </button>
        <button
          type="button"
          onClick={() => setInviteType("staff")}
          className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
            inviteType === "staff"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          Personal
        </button>
      </div>

      {inviteType === "owner" ? (
        <Form {...ownerForm}>
          <form onSubmit={ownerForm.handleSubmit(handleOwnerSubmit)} className="space-y-4">
            <FormField
              control={ownerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del propietario</FormLabel>
                  <FormControl>
                    <Input placeholder="propietario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Crear invitación"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...staffForm}>
          <form onSubmit={staffForm.handleSubmit(handleStaffSubmit)} className="space-y-4">
            <FormField
              control={staffForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="staff@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={staffForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="staff">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El rol determina los permisos dentro del restaurante.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Crear invitación"}
            </Button>
          </form>
        </Form>
      )}

      {tokenUrl && (
        <div className="rounded-md border border-border bg-muted p-4 space-y-2">
          <p className="text-sm font-medium">Enlace de invitación</p>
          <p className="text-xs text-muted-foreground break-all">{tokenUrl}</p>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            Copiar enlace
          </Button>
        </div>
      )}
    </div>
  );
}
