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

export const Route = createFileRoute("/admin/importar")({
  component: ImportPage,
});

const REQUIRED_COLUMNS = ["codigo", "descricao", "unidade", "peso_cx"] as const;
const OPTIONAL_COLUMNS = ["categoria"] as const;

const normalizeCategoryName = (s: string) =>
  s.trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");

type Row = Record<string, any>;

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, "_");

function ImportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(0);
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrors([]); setDone(0); setProgress(0); setResult(null); setRows([]); setHeaders([]);

    try {
      let parsed: Row[] = [];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const r = Papa.parse<Row>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => normalize(h),
        });
        parsed = r.data;
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const raw = XLSX.utils.sheet_to_json<Row>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        parsed = raw.map((row) => {
          const out: Row = {};
          for (const k of Object.keys(row)) out[normalize(k)] = row[k];
          return out;
        });
      }
      if (parsed.length === 0) return toast.error("Arquivo vazio.");

      const hdrs = Object.keys(parsed[0]);
      const missing = REQUIRED_COLUMNS.filter((c) => !hdrs.includes(c));
      if (missing.length > 0) {
        toast.error(`Colunas obrigatórias ausentes: ${missing.join(", ")}`);
        return;
      }

      setHeaders(hdrs);
      setRows(parsed);
      toast.success(`${parsed.length} linhas detectadas.`);
    } catch (err) {
      toast.error("Erro ao ler arquivo: " + (err as Error).message);
    }
  };

  const runImport = async () => {
    setImporting(true); setErrors([]); setDone(0); setResult(null);

    // Preload existing products by internal_code
    const { data: existing } = await supabase
      .from("products")
      .select("id, internal_code, slug")
      .not("internal_code", "is", null);
    const codeMap = new Map((existing ?? []).map((p) => [String(p.internal_code), p]));

    // Preload existing categories
    const { data: existingCats } = await supabase.from("categories").select("id, name, slug");
    const catMap = new Map<string, string>(
      (existingCats ?? []).map((c) => [normalizeCategoryName(c.name), c.id])
    );

    const ensureCategory = async (rawName: string): Promise<string | null> => {
      const name = normalizeCategoryName(rawName);
      if (!name) return null;
      const cached = catMap.get(name);
      if (cached) return cached;
      const slug = slugify(name);
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, slug })
        .select("id")
        .single();
      if (error || !data) {
        // Possible race / unique slug collision — try fetching
        const { data: again } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", name)
          .maybeSingle();
        if (again) {
          catMap.set(name, again.id);
          return again.id;
        }
        return null;
      }
      catMap.set(name, data.id);
      return data.id;
    };

    const errs: string[] = [];
    let created = 0;
    let updated = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const codigo = String(r.codigo ?? "").trim();
      const descricao = String(r.descricao ?? "").trim();
      const unidade = String(r.unidade ?? "").trim() || null;
      const pesoRaw = String(r.peso_cx ?? "").trim().replace(",", ".");
      const peso_cx = pesoRaw ? Number(pesoRaw) : null;
      const categoriaRaw = String(r.categoria ?? "").trim();

      if (!codigo) { errs.push(`Linha ${i + 2}: codigo vazio`); continue; }
      if (!descricao) { errs.push(`Linha ${i + 2}: descricao vazia`); continue; }
      if (peso_cx !== null && Number.isNaN(peso_cx)) {
        errs.push(`Linha ${i + 2}: peso_cx inválido`); continue;
      }

      let category_id: string | null = null;
      if (categoriaRaw) {
        category_id = await ensureCategory(categoriaRaw);
        if (!category_id) {
          errs.push(`Linha ${i + 2}: falha ao criar/vincular categoria "${categoriaRaw}"`);
        }
      }

      const found = codeMap.get(codigo);
      if (found) {
        const updatePayload = {
          name: descricao,
          unit: unidade,
          weight_kg: peso_cx,
          is_active: true,
          ...(category_id ? { category_id } : {}),
        };
        const { error } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", found.id);
        if (error) errs.push(`Linha ${i + 2} (${codigo}): ${error.message}`);
        else updated++;
      } else {
        const slug = slugify(descricao) + "-" + slugify(codigo);
        const { error } = await supabase.from("products").insert({
          name: descricao,
          slug,
          internal_code: codigo,
          unit: unidade,
          weight_kg: peso_cx,
          is_active: true,
          category_id,
        });
        if (error) errs.push(`Linha ${i + 2} (${codigo}): ${error.message}`);
        else created++;
      }

      setDone(i + 1);
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setErrors(errs);
    setResult({ created, updated });
    setImporting(false);
    toast.success(`Importação concluída: ${created} novos, ${updated} atualizados, ${errs.length} erro(s).`);
  };

  const downloadTemplate = () => {
    const csv =
      "codigo,descricao,unidade,peso_cx,categoria\n" +
      "100088,PESCADA-MARIA-MOLE G,PCT 5 KG,15,FILÉS\n" +
      "353550,CAM. SANTANA DESC. EVISC. 50/60,PCT 5 KG,15,CAMARÕES\n" +
      "293000,LULA EM ANÉIS IQF,A GRANEL,10,MOLUSCOS\n";
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo-m2i.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar produtos</h1>
        <p className="text-sm text-muted-foreground">
          Envie um arquivo CSV ou Excel (.xlsx) com as colunas:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">codigo, descricao, unidade, peso_cx</code>.
          Produtos com código já existente serão atualizados automaticamente.
        </p>
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

          {result && !importing && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              {result.created} produto(s) criado(s), {result.updated} atualizado(s).
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRows([]); setHeaders([]); setResult(null); }}>Cancelar</Button>
            <Button onClick={runImport} disabled={importing} className="rounded-full bg-primary">
              {importing ? "Importando..." : `Importar ${rows.length} produto(s)`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
