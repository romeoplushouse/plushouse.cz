"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calculator, FileText, Download, Sparkles } from "lucide-react";
import {
  generateVatReturn,
  generateControlReport,
  getVatReturns,
  getControlReports,
} from "@/lib/actions/tax";
import { formatCurrency, formatDate } from "@/lib/utils";

type VatReturn = Awaited<ReturnType<typeof getVatReturns>>[0];
type ControlReport = Awaited<ReturnType<typeof getControlReports>>[0];

const statusLabels: Record<string, string> = {
  DRAFT: "Koncept",
  GENERATED: "Vygenerováno",
  REVIEWED: "Zkontrolováno",
  SUBMITTED: "Podáno",
  ACCEPTED: "Přijato",
};

const statusVariants: Record<string, "secondary" | "default" | "success" | "warning"> = {
  DRAFT: "secondary",
  GENERATED: "default",
  REVIEWED: "warning",
  SUBMITTED: "success",
  ACCEPTED: "success",
};

export default function TaxPage() {
  const [vatReturns, setVatReturns] = useState<VatReturn[]>([]);
  const [controlReports, setControlReports] = useState<ControlReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingVat, setGeneratingVat] = useState(false);
  const [generatingKH, setGeneratingKH] = useState(false);
  const [xmlPreview, setXmlPreview] = useState<string | null>(null);

  // Default period = current month
  const now = new Date();
  const [periodFrom, setPeriodFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [periodTo, setPeriodTo] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
  );

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [vat, kh] = await Promise.all([getVatReturns(), getControlReports()]);
    setVatReturns(vat);
    setControlReports(kh);
    setLoading(false);
  }

  async function handleGenerateVat() {
    setGeneratingVat(true);
    try {
      const result = await generateVatReturn(periodFrom, periodTo);
      if (result.xmlExport) setXmlPreview(result.xmlExport);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba");
    } finally {
      setGeneratingVat(false);
    }
  }

  async function handleGenerateKH() {
    setGeneratingKH(true);
    try {
      await generateControlReport(periodFrom, periodTo);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba");
    } finally {
      setGeneratingKH(false);
    }
  }

  function downloadXml(xml: string, filename: string) {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daňová přiznání</h1>
          <p className="text-gray-500">DPH, kontrolní hlášení, daň z příjmů PO</p>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400">Období od</label>
              <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Období do</label>
              <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Types */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-400" />
              Přiznání k DPH
            </CardTitle>
            <CardDescription>Měsíční/čtvrtletní přiznání</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateVat} disabled={generatingVat} className="w-full">
              <Sparkles className="h-4 w-4 mr-1" />
              {generatingVat ? "Generuji..." : "Generovat přiznání k DPH"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Kontrolní hlášení
            </CardTitle>
            <CardDescription>Měsíční kontrolní hlášení k DPH</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateKH} disabled={generatingKH} className="w-full">
              <Sparkles className="h-4 w-4 mr-1" />
              {generatingKH ? "Generuji..." : "Generovat kontrolní hlášení"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-400" />
              Daň z příjmů PO
            </CardTitle>
            <CardDescription>Roční přiznání (21 % sazba)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Termín: 1. 4. {now.getFullYear() + 1}
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Sparkles className="h-4 w-4 mr-1" />
              Generovat (po uzávěrce roku)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* XML Preview */}
      {xmlPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>XML přiznání k DPH</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => downloadXml(xmlPreview, `dph-${periodFrom}.xml`)}>
                <Download className="h-4 w-4 mr-1" />
                Stáhnout XML
              </Button>
              <Button size="sm" variant="outline" onClick={() => setXmlPreview(null)}>
                Zavřít
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-[#1a1d24] p-4 rounded-lg overflow-auto max-h-64 font-mono">
              {xmlPreview}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Historie přiznání k DPH</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Období</TableHead>
                <TableHead>Základ 21 %</TableHead>
                <TableHead>DPH 21 %</TableHead>
                <TableHead>Základ 12 %</TableHead>
                <TableHead>DPH 12 %</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vatReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                    Zatím žádná přiznání
                  </TableCell>
                </TableRow>
              ) : (
                vatReturns.map((vr) => (
                  <TableRow key={vr.id}>
                    <TableCell className="font-medium">{vr.period}</TableCell>
                    <TableCell>{formatCurrency(Number(vr.totalBase21))}</TableCell>
                    <TableCell>{formatCurrency(Number(vr.totalVat21))}</TableCell>
                    <TableCell>{formatCurrency(Number(vr.totalBase12))}</TableCell>
                    <TableCell>{formatCurrency(Number(vr.totalVat12))}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[vr.status] ?? "secondary"}>
                        {statusLabels[vr.status] ?? vr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vr.xmlExport && (
                        <Button size="sm" variant="ghost" onClick={() => downloadXml(vr.xmlExport!, `dph-${vr.period}.xml`)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Control Reports */}
      <Card>
        <CardHeader><CardTitle>Historie kontrolních hlášení</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Období</TableHead>
                <TableHead>Položek</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Vygenerováno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controlReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                    Zatím žádná kontrolní hlášení
                  </TableCell>
                </TableRow>
              ) : (
                controlReports.map((cr) => (
                  <TableRow key={cr.id}>
                    <TableCell className="font-medium">{cr.period}</TableCell>
                    <TableCell>{cr.items.length}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[cr.status] ?? "secondary"}>
                        {statusLabels[cr.status] ?? cr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cr.generatedAt ? formatDate(cr.generatedAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
