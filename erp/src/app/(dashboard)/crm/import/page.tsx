"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowLeft,
  Download, Eye, Loader2,
} from "lucide-react";
import { parseImportData, importContacts, type ImportRow } from "@/lib/actions/import";

export default function ImportContactsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: Array<{ row: number; message: string }> } | null>(null);
  const [contactType, setContactType] = useState<"CUSTOMER" | "SUPPLIER" | "SUBCONTRACTOR" | "OTHER">("CUSTOMER");
  const [loading, setLoading] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      // Dynamic import xlsx (client-side only)
      const XLSX = await import("xlsx");

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

      const { parsed, errors } = await parseImportData(rawData);
      setParsedRows(parsed);
      setParseErrors(errors);
      setStep("preview");
    } catch (err) {
      alert("Chyba při čtení souboru: " + (err instanceof Error ? err.message : "Neznámá chyba"));
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setStep("importing");
    const result = await importContacts(parsedRows, contactType);
    setImportResult(result);
    setStep("done");
  }

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/crm")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Import kontaktů</h1>
          <p className="text-gray-500">Import z CSV nebo XLSX souboru</p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Nahrát soubor
            </CardTitle>
            <CardDescription>
              Podporované formáty: .xlsx, .xls, .csv
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Typ importovaných kontaktů</label>
              <div className="flex gap-2">
                {[
                  { value: "CUSTOMER", label: "Zákazníci" },
                  { value: "SUPPLIER", label: "Dodavatelé" },
                  { value: "SUBCONTRACTOR", label: "Subdodavatelé" },
                  { value: "OTHER", label: "Ostatní" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setContactType(t.value as typeof contactType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      contactType === t.value
                        ? "bg-[#B5E126] text-[#0f1117] shadow-sm"
                        : "bg-[#1a1d24] text-gray-400 hover:bg-[#2a2d35]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#2a2d35] rounded-2xl p-12 text-center cursor-pointer hover:border-[#B5E126] hover:bg-[#B5E126]/10 transition-all"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {loading ? (
                <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              )}
              <p className="font-medium text-gray-400">
                {loading ? "Zpracovávám soubor..." : "Klikněte nebo přetáhněte soubor"}
              </p>
              <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, .csv</p>
            </div>

            {/* Expected columns */}
            <div className="p-4 bg-[#1a1d24] rounded-xl">
              <p className="text-sm font-medium text-gray-400 mb-2">Očekávané sloupce:</p>
              <div className="flex flex-wrap gap-1.5">
                {["Firma", "IČ", "DIČ / IČ DPH", "DIČ (SK)", "Ulice", "PSČ", "Město", "Stát",
                  "E-mailová adresa", "Další příjemci", "Telefon", "www", "Sleva", "Splatnost",
                  "Nastavení odesílaní upomínek", "Titul", "Jméno", "Příjmení", "Mobil",
                  "Číslo účtu", "Kód banky", "IBAN", "SWIFT"].map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Náhled importu - {fileName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{parsedRows.length} platných</Badge>
                  {parseErrors.length > 0 && (
                    <Badge variant="destructive">{parseErrors.length} chyb</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>IČO</TableHead>
                      <TableHead>Jméno</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Město</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 20).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-gray-400">{i + 1}</TableCell>
                        <TableCell className="font-medium">{row.companyName || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{row.ico || "—"}</TableCell>
                        <TableCell>{[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}</TableCell>
                        <TableCell>{row.email || "—"}</TableCell>
                        <TableCell>{row.phone || row.mobile || "—"}</TableCell>
                        <TableCell>{row.city || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {parsedRows.length > 20 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-400 py-3">
                          ...a dalších {parsedRows.length - 20} řádků
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {parseErrors.length > 0 && (
            <Card className="rounded-2xl border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Chyby ({parseErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {parseErrors.slice(0, 10).map((err, i) => (
                    <li key={i} className="text-amber-400">
                      Řádek {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setStep("upload"); setParsedRows([]); }}>
              Zpět
            </Button>
            <Button onClick={handleImport} disabled={parsedRows.length === 0}>
              <Upload className="h-4 w-4 mr-2" />
              Importovat {parsedRows.length} kontaktů jako {contactType === "CUSTOMER" ? "zákazníky" : contactType === "SUPPLIER" ? "dodavatele" : contactType === "SUBCONTRACTOR" ? "subdodavatele" : "ostatní"}
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Importing */}
      {step === "importing" && (
        <Card className="rounded-2xl text-center py-12">
          <CardContent>
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="font-medium text-gray-400">Importuji {parsedRows.length} kontaktů...</p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === "done" && importResult && (
        <Card className="rounded-2xl text-center py-12">
          <CardContent className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">Import dokončen</h2>
            <div className="flex justify-center gap-4">
              <div>
                <p className="text-3xl font-bold text-emerald-400">{importResult.imported}</p>
                <p className="text-sm text-gray-500">Importováno</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400">{importResult.skipped}</p>
                <p className="text-sm text-gray-500">Přeskočeno (duplikáty)</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">{importResult.errors.length}</p>
                <p className="text-sm text-gray-500">Chyb</p>
              </div>
            </div>
            <Button onClick={() => router.push("/crm")}>
              Přejít do adresáře
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
