"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Shield, ShieldAlert, ShieldCheck, AlertTriangle,
  CheckCircle, XCircle, FileText, TrendingUp, Clock, Building2,
  ExternalLink, RefreshCw, Star, Loader2, Banknote, Scale,
  BarChart3, Users, Calendar, MessageSquare,
} from "lucide-react";
import { runFullAnalysis } from "@/lib/actions/analysis";
import { getContactById } from "@/lib/actions/contacts";
import { formatCurrency } from "@/lib/utils";

type Analysis = Awaited<ReturnType<typeof runFullAnalysis>>;
type Contact = Awaited<ReturnType<typeof getContactById>>;

const gradeColors: Record<string, string> = {
  A: "from-green-500 to-emerald-600",
  B: "from-blue-500 to-blue-600",
  C: "from-yellow-500 to-amber-600",
  D: "from-orange-500 to-orange-600",
  F: "from-red-500 to-red-600",
};

const gradeLabels: Record<string, string> = {
  A: "Vynikající",
  B: "Dobrý",
  C: "Průměrný",
  D: "Rizikový",
  F: "Problémový",
};

export default function PartnerAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const c = await getContactById(params.id as string);
    setContact(c);
    setLoading(false);
  }

  async function handleRunAnalysis() {
    setAnalyzing(true);
    try {
      const result = await runFullAnalysis(params.id as string);
      setAnalysis(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba analýzy");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading || !contact) {
    return <div className="text-center py-12 text-gray-500">Načítám...</div>;
  }

  const displayName = contact.companyName || `${contact.firstName ?? ""} ${contact.lastName ?? ""}`;

  return (
    <div className="page-enter space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/crm/${params.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Analýza partnera</h1>
            <p className="text-gray-500">{displayName} {contact.ico ? `• IČO: ${contact.ico}` : ""}</p>
          </div>
        </div>
        <Button onClick={handleRunAnalysis} disabled={analyzing}>
          {analyzing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzuji...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" />Spustit analýzu</>
          )}
        </Button>
      </div>

      {!analysis ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">Analýza obchodního partnera</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Ověří spolehlivost plátce DPH, insolvenční rejstřík, exekuce, účetní závěrky a vypočítá interní scoring na základě platební morálky.
            </p>
            <Button size="lg" onClick={handleRunAnalysis} disabled={analyzing}>
              {analyzing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzuji...</>
              ) : (
                <><Shield className="h-5 w-5 mr-2" />Spustit kompletní analýzu</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-2xl overflow-hidden col-span-1">
              <div className={`bg-gradient-to-br ${gradeColors[analysis.scoring.grade]} p-8 text-center text-white`}>
                <div className="text-7xl font-bold mb-2">{analysis.scoring.grade}</div>
                <div className="text-xl font-medium opacity-90">{gradeLabels[analysis.scoring.grade]}</div>
                <div className="mt-3 text-sm opacity-75">Celkové skóre: {analysis.scoring.overallScore}/100</div>
                <div className="mt-4 w-full bg-[#1a1d24]/20 rounded-full h-2">
                  <div
                    className="bg-[#1a1d24] rounded-full h-2 transition-all"
                    style={{ width: `${analysis.scoring.overallScore}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Quick checks */}
            <Card className="rounded-2xl col-span-1 lg:col-span-2">
              <CardHeader><CardTitle>Rychlý přehled</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* VAT Reliability */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1d24]">
                  <div className="flex items-center gap-3">
                    {analysis.vatReliability?.isReliable === true ? (
                      <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    ) : analysis.vatReliability?.isReliable === false ? (
                      <ShieldAlert className="h-6 w-6 text-red-400" />
                    ) : (
                      <Shield className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Spolehlivost plátce DPH</p>
                      <p className="text-xs text-gray-500">Finanční správa ČR</p>
                    </div>
                  </div>
                  {analysis.vatReliability?.isReliable === true ? (
                    <Badge variant="success">Spolehlivý</Badge>
                  ) : analysis.vatReliability?.isReliable === false ? (
                    <Badge variant="destructive">Nespolehlivý</Badge>
                  ) : (
                    <Badge variant="secondary">{analysis.vatReliability?.error || "Neověřeno"}</Badge>
                  )}
                </div>

                {/* Insolvency */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1d24]">
                  <div className="flex items-center gap-3">
                    {analysis.insolvency?.hasInsolvency ? (
                      <XCircle className="h-6 w-6 text-red-400" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-emerald-400" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Insolvenční rejstřík</p>
                      <p className="text-xs text-gray-500">ISIR - justice.cz</p>
                    </div>
                  </div>
                  {analysis.insolvency?.hasInsolvency ? (
                    <Badge variant="destructive">
                      {analysis.insolvency.records.length} záznamů
                    </Badge>
                  ) : analysis.insolvency?.error ? (
                    <Badge variant="secondary">{analysis.insolvency.error}</Badge>
                  ) : (
                    <Badge variant="success">Bez insolvence</Badge>
                  )}
                </div>

                {/* Executions */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1d24]">
                  <div className="flex items-center gap-3">
                    <Scale className="h-6 w-6 text-blue-400" />
                    <div>
                      <p className="font-medium text-sm">Exekuce</p>
                      <p className="text-xs text-gray-500">CERD - cedr.mfcr.cz</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {analysis.executions?.note || "Vyžaduje ruční kontrolu"}
                  </Badge>
                </div>

                {/* Financial statements */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1d24]">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-purple-400" />
                    <div>
                      <p className="font-medium text-sm">Účetní závěrky</p>
                      <p className="text-xs text-gray-500">Sbírka listin OR</p>
                    </div>
                  </div>
                  <a
                    href={analysis.financials?.justiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Justice.cz
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-xl stat-card-green">
              <CardContent className="p-4 text-center">
                <Banknote className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{analysis.scoring.metrics.paymentOnTime}%</p>
                <p className="text-xs text-gray-500">Placeno včas</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl stat-card-blue">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{analysis.scoring.metrics.avgPaymentDelay}</p>
                <p className="text-xs text-gray-500">Průměr zpoždění (dny)</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl stat-card-purple">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{formatCurrency(analysis.scoring.metrics.totalInvoiced)}</p>
                <p className="text-xs text-gray-500">Celkem fakturováno</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl stat-card-red">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{formatCurrency(analysis.scoring.metrics.overdueAmount)}</p>
                <p className="text-xs text-gray-500">Po splatnosti</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment metrics table */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Detailní metriky</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-gray-500">Celkem faktur</TableCell>
                    <TableCell className="text-right font-bold">{analysis.scoring.metrics.invoiceCount}</TableCell>
                    <TableCell className="font-medium text-gray-500">Zaplaceno</TableCell>
                    <TableCell className="text-right font-bold text-emerald-400">{analysis.scoring.metrics.paidCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-500">Po splatnosti</TableCell>
                    <TableCell className="text-right font-bold text-red-400">{analysis.scoring.metrics.overdueCount}</TableCell>
                    <TableCell className="font-medium text-gray-500">Nejdelší zpoždění</TableCell>
                    <TableCell className="text-right font-bold">{analysis.scoring.metrics.longestDelay} dní</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-500">Celkem zaplaceno</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(analysis.scoring.metrics.totalPaid)}</TableCell>
                    <TableCell className="font-medium text-gray-500">Neuhrazeno</TableCell>
                    <TableCell className="text-right font-bold text-amber-400">{formatCurrency(analysis.scoring.metrics.unpaidAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-500">Průměrná faktura</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(analysis.scoring.metrics.avgInvoiceValue)}</TableCell>
                    <TableCell className="font-medium text-gray-500">Délka vztahu</TableCell>
                    <TableCell className="text-right font-bold">{analysis.scoring.metrics.relationshipDays} dní</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-500">Zakázky (dokončené/celkem)</TableCell>
                    <TableCell className="text-right font-bold">{analysis.scoring.metrics.projectsCompleted}/{analysis.scoring.metrics.projectsTotal}</TableCell>
                    <TableCell className="font-medium text-gray-500">Komunikace</TableCell>
                    <TableCell className="text-right font-bold">{analysis.scoring.metrics.communicationCount}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ARES Data */}
          {analysis.ares && !analysis.ares.error && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Údaje z ARES
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-gray-500">Název:</span> <span className="font-medium">{analysis.ares.name}</span></div>
                  <div><span className="text-gray-500">IČO:</span> <span className="font-medium">{analysis.ares.ico}</span></div>
                  <div><span className="text-gray-500">DIČ:</span> <span className="font-medium">{analysis.ares.dic ?? "—"}</span></div>
                  <div><span className="text-gray-500">Právní forma:</span> <span className="font-medium">{analysis.ares.legalForm ?? "—"}</span></div>
                  <div><span className="text-gray-500">Adresa:</span> <span className="font-medium">{analysis.ares.address ?? "—"}</span></div>
                  <div><span className="text-gray-500">Datum vzniku:</span> <span className="font-medium">{analysis.ares.dateEstablished ?? "—"}</span></div>
                </div>
                {analysis.ares.nace && analysis.ares.nace.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-500">Činnosti (NACE):</span>
                    <ul className="mt-1 list-disc list-inside text-gray-400">
                      {analysis.ares.nace.slice(0, 5).map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Insolvency records */}
          {analysis.insolvency?.hasInsolvency && (
            <Card className="rounded-2xl border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Insolvenční záznamy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Spisová značka</TableHead>
                      <TableHead>Stav</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Soud</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.insolvency.records.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{r.caseNumber}</TableCell>
                        <TableCell><Badge variant="destructive">{r.status}</Badge></TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.court}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.scoring.recommendations.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Doporučení
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.scoring.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
