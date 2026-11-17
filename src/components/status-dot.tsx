import type { DossierStatus } from "@/lib/dossiers";
import { cn } from "@/lib/utils";

// La couleur ne porte jamais seule l'information : le libellé du statut est toujours affiché à côté.
const DOT: Record<DossierStatus, string> = {
  demande: "border border-muted-foreground bg-transparent",
  visite: "bg-muted-foreground",
  option: "bg-status-amber",
  devis_envoye: "bg-status-blue",
  signe: "bg-status-green",
  solde: "bg-foreground",
  perdu: "bg-status-red",
};

export function StatusDot({ status, className }: { status: DossierStatus; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", DOT[status], className)} />;
}
