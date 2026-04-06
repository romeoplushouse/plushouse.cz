"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Send, FileSignature, CheckCircle, Clock, Shield,
  Eye, Copy, AlertTriangle, History,
} from "lucide-react";
import { getContractById, sendForSigning } from "@/lib/actions/contracts";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

type Contract = Awaited<ReturnType<typeof getContractById>>;

const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "success" | "warning" | "destructive" }> = {
  DRAFT: { label: "Koncept", variant: "secondary" },
  PENDING_FIELDS: { label: "Čeká na vyplnění", variant: "warning" },
  PENDING_SIGNATURE: { label: "Čeká na podpis", variant: "default" },
  PARTIALLY_SIGNED: { label: "Částečně podepsáno", variant: "warning" },
  SIGNED: { label: "Podepsáno", variant: "success" },
  REJECTED: { label: "Odmítnuto", variant: "destructive" },
};

const signingStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Čeká", color: "text-gray-500" },
  VIEWED: { label: "Zobrazeno", color: "text-blue-400" },
  FIELDS_FILLED: { label: "Vyplněno", color: "text-amber-400" },
  IDENTITY_VERIFIED: { label: "Ověřeno BankID", color: "text-purple-400" },
  SIGNED: { label: "Podepsáno", color: "text-emerald-400" },
  REJECTED: { label: "Odmítnuto", color: "text-red-400" },
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract>(null);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await getContractById(params.id as string);
    setContract(data);
    setLoading(false);
  }

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const form = new FormData(e.currentTarget);
    try {
      await sendForSigning(params.id as string, {
        signerEmail: form.get("signerEmail") as string,
        signerName: form.get("signerName") as string,
        signerRole: form.get("signerRole") as string,
        verificationMethod: form.get("verificationMethod") as string,
      });
      setShowSendForm(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSending(false);
    }
  }

  if (loading || !contract) return <div className="text-center py-12 text-gray-500">Načítám...</div>;

  const si = statusMap[contract.status] ?? statusMap.DRAFT;

  return (
    <div className="page-enter space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/smlouvy")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{contract.title}</h1>
            <p className="text-gray-500">{contract.contractNumber} • {contract.partyBName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={si.variant} className="text-sm px-3 py-1">{si.label}</Badge>
          {contract.status === "DRAFT" && (
            <Button onClick={() => setShowSendForm(true)}>
              <Send className="h-4 w-4 mr-2" />
              Odeslat k podpisu
            </Button>
          )}
        </div>
      </div>

      {/* Send for signing form */}
      {showSendForm && (
        <Card className="rounded-xl border-[#B5E126]/20 bg-[#B5E126]/5">
          <CardHeader><CardTitle>Odeslat k podpisu</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Jméno podepisujícího <span className="text-red-500">*</span></label>
                  <Input name="signerName" required defaultValue={contract.partyBRepresentative ?? contract.partyBName} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Email <span className="text-red-500">*</span></label>
                  <Input name="signerEmail" type="email" required className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Role</label>
                  <select name="signerRole" className="mt-1 flex h-10 w-full rounded-lg border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                    <option value="PARTY_B">Druhá smluvní strana</option>
                    <option value="PARTY_A">Za naši firmu</option>
                    <option value="WITNESS">Svědek</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Metoda ověření totožnosti</label>
                  <select name="verificationMethod" className="mt-1 flex h-10 w-full rounded-lg border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm text-white">
                    <option value="SMS_OTP">SMS overeni</option>
                    <option value="NONE">Bez overeni (jednoduchy podpis)</option>
                  </select>
                </div>
              </div>
              <div className="p-3 bg-[#B5E126]/10 rounded-lg text-sm text-[#B5E126]">
                <Shield className="h-4 w-4 inline mr-1" />
                Podepisující obdrží e-mail s odkazem. Po otevření vyplní požadované údaje, ověří totožnost přes zvolenou metodu a podepíše smlouvu elektronicky dle eIDAS.
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={sending}>
                  {sending ? "Odesílám..." : "Odeslat odkaz k podpisu"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSendForm(false)}>Zrušit</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Info */}
        <Card className="rounded-xl">
          <CardHeader><CardTitle>Smluvní strany</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 bg-[#1a1d24] rounded-lg">
              <p className="text-xs text-gray-400 mb-1">STRANA A (my)</p>
              <p className="font-medium">{contract.partyAName}</p>
              {contract.partyAIco && <p className="text-gray-500">IČO: {contract.partyAIco}</p>}
              {contract.partyAAddress && <p className="text-gray-500">{contract.partyAAddress}</p>}
            </div>
            <div className="p-3 bg-[#1a1d24] rounded-lg">
              <p className="text-xs text-gray-400 mb-1">STRANA B</p>
              <p className="font-medium">{contract.partyBName}</p>
              {contract.partyBIco && <p className="text-gray-500">IČO: {contract.partyBIco}</p>}
              {contract.partyBAddress && <p className="text-gray-500">{contract.partyBAddress}</p>}
              {contract.partyBRepresentative && <p className="text-gray-500">Zast.: {contract.partyBRepresentative}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-400">Platnost od:</span> <span className="font-medium">{contract.validFrom ? formatDate(contract.validFrom) : "—"}</span></div>
              <div><span className="text-gray-400">Platnost do:</span> <span className="font-medium">{contract.validTo ? formatDate(contract.validTo) : "—"}</span></div>
              {contract.totalAmount && (
                <div className="col-span-2"><span className="text-gray-400">Částka:</span> <span className="font-bold text-lg">{formatCurrency(Number(contract.totalAmount))}</span></div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signing Status */}
        <Card className="rounded-xl">
          <CardHeader><CardTitle>Podpisy ({contract.signingRequests.filter((r) => r.status === "SIGNED").length}/{contract.signingRequests.length})</CardTitle></CardHeader>
          <CardContent>
            {contract.signingRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Zatím nikdo nebyl vyzván k podpisu</p>
            ) : (
              <div className="space-y-3">
                {contract.signingRequests.map((req) => {
                  const ss = signingStatusMap[req.status] ?? signingStatusMap.PENDING;
                  return (
                    <div key={req.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{req.signerName}</p>
                          <p className="text-xs text-gray-400">{req.signerEmail}</p>
                        </div>
                        <span className={`text-sm font-semibold ${ss.color}`}>{ss.label}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        {req.sentAt && <span>Odesláno: {formatDateTime(req.sentAt)}</span>}
                        {req.bankIdVerified && (
                          <Badge variant="success" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />BankID ověřeno
                          </Badge>
                        )}
                        {req.signedAt && <span className="text-emerald-400 font-medium">Podepsáno: {formatDateTime(req.signedAt)}</span>}
                      </div>
                      {req.status === "PENDING" && req.accessUrl && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + req.accessUrl);
                              alert("Odkaz zkopírován do schránky");
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Kopírovat odkaz
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fillable Fields */}
      {contract.fillableFields.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader><CardTitle>Vyplnitelná pole ({contract.fillableFields.filter((f) => f.filledValue).length}/{contract.fillableFields.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pole</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Hodnota</TableHead>
                  <TableHead>Vyplněno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.fillableFields.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.fieldLabel}</TableCell>
                    <TableCell><Badge variant="secondary">{f.fieldType}</Badge></TableCell>
                    <TableCell>{f.filledValue ?? <span className="text-gray-400">Nevyplněno</span>}</TableCell>
                    <TableCell>
                      {f.filledAt ? (
                        <span className="text-emerald-400 text-sm">{formatDateTime(f.filledAt)}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {contract.auditTrail.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                <span className="text-gray-400 w-36 shrink-0">{formatDateTime(entry.timestamp)}</span>
                <Badge variant="outline" className="shrink-0">{entry.action}</Badge>
                <span className="text-gray-400">{entry.actor}</span>
                {entry.actorIp && <span className="text-gray-400">({entry.actorIp})</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
