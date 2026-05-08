import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/importar")({
  component: ImportPage,
});

const FIELDS = [
  { key: "name", label: "Nome *", required: true },
  { key: "description", label: "Descrição" },
  { key: "category", label: "Categoria (nome)" },
  { key: "subcategory", label: "Subcategoria" },
  { key: "weight_kg", label: "Peso da caixa (kg)" },
  { key: "unit", label: "Unidade" },
  { key: "internal_code", label: "Código interno" },
  { key: "price", label: "Preço" },
  { key: "image_url", label: "URL da imagem" },
  { key: "is_active", label: "Status (ativo)" },
] as const;

type Row = Record<string, any>;

function ImportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(0);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrors([]); setDone(0); setProgress(0);

    try {
      let parsed: Row[] = [];
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const r = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
        parsed = r.data;
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        parsed = XLSX.utils.sheet_to_json<Row>(wb.Sheets[wb.SheetNames[0]]);
      }
      if (parsed.length === 0) return toast.error("Arquivo vazio.");
      const hdrs = Object.keys(parsed[0]);
      setHeaders(hdrs);
      setRows(parsed);

      // Auto-map by name similarity
      const m: Record<string, string> = {};
      for (const f of FIELDS) {
        const found = hdrs.find((h) =>
          slugify(h).replace(/-/g, "") === slugify(f.key).replace(/-/g, "") ||
          slugify(h).replace(/-/g, "") === slugify(f.label).replace(/-/g, ""),
        );
        if (found) m[f.key] = found;
      }
      setMapping(m);
      toast.success(`${parsed.length} linhas detectadas.`);
    } catch (err) {
      toast.error("Erro ao ler arquivo: " + (err as Error).message);
    }
  };

  const runImport = async () => {
    if (!mapping.name) return toast.error("Mapeie pelo menos a coluna Nome.");
    setImporting(true); setErrors([]); setDone(0);

    // Preload categories
    const { data: cats } = await supabase.from("categories").select("id, name, slug");
    const catMap = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c.id]));

    const errs: string[] = [];
    let ok = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const get = (k: string) => {
        const col = mapping[k];
        return col ? r[col] : undefined;
      };
      const name = String(get("name") ?? "").trim();
      if (!name) { errs.push(`Linha ${i + 2}: nome vazio`); continue; }

      let category_id: string | null = null;
      const catName = get("category");
      if (catName) {
        const key = String(catName).trim().toLowerCase();
        if (catMap.has(key)) category_id = catMap.get(key)!;
        else {
          const { data: nc } = await supabase
            .from("categories")
            .insert({ name: String(catName).trim(), slug: slugify(String(catName)) })
            .select("id")
            .single();
          if (nc) { category_id = nc.id; catMap.set(key, nc.id); }
        }
      }

      const payload = {
        name,
        slug: slugify(name) + "-" + (get("internal_code") || Math.random().toString(36).slice(2, 6)),
        description: get("description") || null,
        category_id,
        subcategory: get("subcategory") || null,
        weight_kg: get("weight_kg") ? Number(String(get("weight_kg")).replace(",", ".")) : null,
        unit: get("unit") || null,
        internal_code: get("internal_code") ? String(get("internal_code")) : null,
        price: get("price") ? Number(String(get("price")).replace(",", ".")) : null,
        image_url: get("image_url") || null,
        is_active: get("is_active") === undefined ? true : !["false", "0", "não", "nao", "inativo"].includes(String(get("is_active")).toLowerCase()),
      };

      // Upsert by internal_code if present
      let res;
      if (payload.internal_code) {
        res = await supabase.from("products").upsert(payload, { onConflict: "internal_code" });
      } else {
        res = await supabase.from("products").insert(payload);
      }
      if (res.error) errs.push(`Linha ${i + 2} (${name}): ${res.error.message}`);
      else ok++;

      setDone(i + 1);
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setErrors(errs);
    setImporting(false);
    toast.success(`Importação concluída: ${ok} ok, ${errs.length} erro(s).`);
  };

  const downloadTemplate = () => {
    const csv = "name,description,category,subcategory,weight_kg,unit,internal_code,price,image_url,is_active\nSalmão Filé,Filé de salmão congelado premium,Peixes Nobres,Salmão,10,caixa,SAL-001,289.90,https://exemplo.com/salmao.jpg,true\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "modelo-m2i.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar produtos</h1>
        <p className="text-sm text-muted-foreground">Suba um arquivo CSV ou Excel (.xlsx). O sistema mapeia colunas automaticamente.</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center shadow-soft">
        <FileSpreadsheet className="mx-auto h-10 w-10 text-ocean" />
        <h2 className="mt-3 font-semibold">Arraste ou selecione o arquivo</h2>
        <p className="text-xs text-muted-foreground">CSV ou XLSX, até 10MB</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Upload className="h-4 w-4" /> Selecionar arquivo
            <input type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} />
          </label>
          <Button variant="outline" onClick={downloadTemplate} className="rounded-full">
            <Download className="h-4 w-4 mr-1" /> Baixar modelo CSV
          </Button>
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Mapeamento de colunas</h2>
            <p className="text-xs text-muted-foreground">Confirme qual coluna do seu arquivo corresponde a cada campo.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <div className="w-40 text-sm font-medium">{f.label}</div>
                  <Select value={mapping[f.key] ?? "none"} onValueChange={(v) => setMapping({ ...mapping, [f.key]: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Não mapear</SelectItem>
                      {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Preview ({rows.length} linhas)</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>{headers.map((h) => <th key={h} className="px-2 py-2 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      {headers.map((h) => <td key={h} className="px-2 py-2 truncate max-w-[200px]">{String(r[h] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && <p className="mt-2 text-xs text-muted-foreground">… e mais {rows.length - 5} linhas</p>}
            </div>
          </div>

          {importing && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between text-sm">
                <span>Importando…</span>
                <span className="text-muted-foreground">{done}/{rows.length}</span>
              </div>
              <Progress value={progress} className="mt-3" />
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" /> {errors.length} erro(s)
              </div>
              <ul className="mt-3 max-h-48 overflow-y-auto space-y-1 text-xs text-destructive">
                {errors.slice(0, 50).map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}

          {done === rows.length && done > 0 && !importing && errors.length === 0 && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" /> Importação concluída com sucesso!
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRows([]); setHeaders([]); setMapping({}); }}>Cancelar</Button>
            <Button onClick={runImport} disabled={importing} className="rounded-full bg-primary">
              {importing ? "Importando..." : `Importar ${rows.length} produto(s)`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
