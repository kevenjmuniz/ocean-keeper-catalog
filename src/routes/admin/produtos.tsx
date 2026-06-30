import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search, Download, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProducts,
});

function buildRows(rows: any[]) {
  const cols = [
    "name", "slug", "category", "internal_code",
    "weight_kg", "unit", "stock_quantity", "is_featured", "description",
  ];
  const data = rows.map((r) => {
    const o: Record<string, any> = {};
    for (const c of cols) {
      const v = c === "category" ? r.category?.name : r[c];
      o[c] = Array.isArray(v) ? v.join("|") : v ?? "";
    }
    return o;
  });
  return { cols, data };
}

function exportProductsCSV(rows: any[]) {
  const { cols, data } = buildRows(rows);
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(","), ...data.map((r) => cols.map((c) => esc(r[c])).join(","))];
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `produtos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportProductsXLSX(rows: any[]) {
  const { cols, data } = buildRows(rows);
  const ws = XLSX.utils.json_to_sheet(data, { header: cols });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, `produtos-${new Date().toISOString().slice(0, 10)}.xlsx`);
}


type Product = {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  category_id?: string | null;
  subcategory?: string | null;
  weight_kg?: number | null;
  unit?: string | null;
  internal_code?: string | null;
  price?: number | null;
  image_url?: string | null;
  gallery_images?: string[] | null;
  is_featured?: boolean;
  is_active?: boolean;
  is_available?: boolean;
  stock_quantity?: number | null;
};

function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("name")).data ?? [],
  });

  const filtered = (products ?? []).filter((p: any) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.internal_code?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  const startNew = () => { setEditing({ name: "", is_active: true, is_available: true, is_featured: false }); setOpen(true); };
  const startEdit = (p: any) => { setEditing(p); setOpen(true); };

  const toggleActive = async (p: any) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };


  const remove = async (p: any) => {
    if (!confirm(`Excluir "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} item(ns)</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <Download className="h-4 w-4 mr-1" /> Exportar <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportProductsCSV(filtered)}>CSV (.csv)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportProductsXLSX(filtered)}>Excel (.xlsx)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={startNew} className="rounded-full bg-primary"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Produto</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Caixa</th>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-center">Estoque</th>
              <th className="px-4 py-3 text-center">Ativo</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p: any) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                      {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-3">{p.weight_kg ? `${p.weight_kg} kg` : "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.internal_code ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-2 py-1 text-xs font-medium ${(p.stock_quantity ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {p.stock_quantity ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(p)} className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p)} className="rounded p-2 hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Nenhum produto.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        categories={categories ?? []}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-products"] }); setOpen(false); }}
      />
    </div>
  );
}

function ProductDialog({
  open, onOpenChange, editing, categories, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Product | null;
  categories: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Product>(editing ?? { name: "", is_active: true, is_available: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(editing ?? { name: "", is_active: true, is_available: true });
  }, [open, editing]);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setForm({ ...form, [k]: v });

  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description ?? null,
        category_id: form.category_id ?? null,
        subcategory: form.subcategory ?? null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        unit: form.unit ?? null,
        internal_code: form.internal_code ?? null,
        price: form.price ? Number(form.price) : null,
        image_url: form.image_url ?? null,
        gallery_images: form.gallery_images ?? [],
        is_active: !!form.is_active,
        is_available: form.is_available !== false,
        is_featured: !!form.is_featured,
        stock_quantity: Number.isFinite(Number(form.stock_quantity)) ? Math.max(0, Number(form.stock_quantity)) : 0,
      };
      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
      toast.success("Produto salvo");
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category_id ?? "none"} onValueChange={(v) => set("category_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategoria</Label>
              <Input value={form.subcategory ?? ""} onChange={(e) => set("subcategory", e.target.value)} />
            </div>
            <div>
              <Label>Peso da caixa (kg)</Label>
              <Input type="number" step="0.001" value={form.weight_kg ?? ""} onChange={(e) => set("weight_kg", e.target.value as any)} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={form.unit ?? ""} onChange={(e) => set("unit", e.target.value)} placeholder="ex: caixa, kg, un" />
            </div>
            <div>
              <Label>Código interno</Label>
              <Input value={form.internal_code ?? ""} onChange={(e) => set("internal_code", e.target.value)} />
            </div>
            <div>
              <Label>Preço (opcional)</Label>
              <Input type="number" step="0.01" value={form.price ?? ""} onChange={(e) => set("price", e.target.value as any)} />
            </div>
            <div>
              <Label>Quantidade em estoque</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={form.stock_quantity ?? 0}
                onChange={(e) => set("stock_quantity", e.target.value as any)}
              />
            </div>
          </div>
          <div>
            <Label>Imagem</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { const url = await uploadImage(f); set("image_url", url); toast.success("Imagem enviada"); }
                  catch (err) { toast.error((err as Error).message); }
                }}
              />
              {form.image_url && <img src={form.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
            </div>
            <Input className="mt-2" placeholder="Ou cole uma URL" value={form.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} />
          </div>
          <div>
            <Label>Imagens extras (galeria)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length === 0) return;
                  try {
                    const urls = await Promise.all(files.map(uploadImage));
                    set("gallery_images", [...(form.gallery_images ?? []), ...urls]);
                    toast.success(`${urls.length} imagem(ns) adicionada(s)`);
                  } catch (err) { toast.error((err as Error).message); }
                  e.currentTarget.value = "";
                }}
              />
            </div>
            {(form.gallery_images?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.gallery_images!.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => set("gallery_images", form.gallery_images!.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center shadow"
                      aria-label="Remover"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">A imagem principal continua sendo a capa. As extras aparecem no carrossel da página do produto.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_available !== false} onCheckedChange={(v) => set("is_available", v)} /> Disponível
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.is_featured} onCheckedChange={(v) => set("is_featured", v)} /> Destaque
            </label>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            "Ativo" controla se o produto aparece no catálogo. "Disponível" mantém o produto visível, mas marcado como indisponível no momento (sem estoque).
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-primary">{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
