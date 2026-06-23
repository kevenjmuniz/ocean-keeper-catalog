import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/vendedores")({
  component: AdminSellers,
});

type Seller = {
  id?: string;
  name: string;
  phone: string;
  is_active?: boolean;
  sort_order?: number;
};

function AdminSellers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Seller>({ name: "", phone: "", is_active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["sellers"],
    queryFn: async () =>
      (await supabase.from("sellers").select("*").order("sort_order").order("name")).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, phone: form.phone.replace(/\D/g, "") };
    const { error } = form.id
      ? await supabase.from("sellers").update(payload).eq("id", form.id)
      : await supabase.from("sellers").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["sellers"] });
    qc.invalidateQueries({ queryKey: ["sellers-active"] });
  };

  const remove = async (s: any) => {
    if (!confirm(`Excluir "${s.name}"?`)) return;
    const { error } = await supabase.from("sellers").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Excluído");
      qc.invalidateQueries({ queryKey: ["sellers"] });
      qc.invalidateQueries({ queryKey: ["sellers-active"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendedores</h1>
          <p className="text-sm text-muted-foreground">
            {data?.length ?? 0} vendedor(es) — usados no botão "Solicitar orçamento"
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ name: "", phone: "", is_active: true, sort_order: 0 });
            setOpen(true);
          }}
          className="rounded-full bg-primary"
        >
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">WhatsApp</th>
              <th className="px-4 py-3 text-left">Ordem</th>
              <th className="px-4 py-3 text-left">Ativo</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data ?? []).map((s: any) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">+{s.phone}</td>
                <td className="px-4 py-3">{s.sort_order}</td>
                <td className="px-4 py-3">
                  <span className={s.is_active ? "text-emerald-600" : "text-muted-foreground"}>
                    {s.is_active ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setForm(s);
                      setOpen(true);
                    }}
                    className="rounded p-2 hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(s)}
                    className="rounded p-2 hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum vendedor cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar" : "Novo"} vendedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: João Silva"
              />
            </div>
            <div>
              <Label>WhatsApp *</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="5511999999999 (com DDI)"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Inclua o código do país. Apenas números (ex.: 5511937392121).
              </p>
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="mb-0">Ativo</Label>
                <p className="text-xs text-muted-foreground">Vendedores inativos não aparecem no site</p>
              </div>
              <Switch
                checked={form.is_active ?? true}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary">
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
