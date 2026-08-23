import type { Rol } from "@/types";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";

export interface MiembroCardData {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  cargo: string | null;
}

export function MiembroCard({ miembro }: { miembro: MiembroCardData }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <h2 className="text-lg font-semibold">{miembro.nombre}</h2>
      <p className="mt-2 text-sm text-text-subtle">{miembro.email}</p>
      <div className="mt-1">
        <UsuarioRolCargo rol={miembro.rol} cargo={miembro.cargo} />
      </div>
    </div>
  );
}
