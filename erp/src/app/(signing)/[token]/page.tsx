"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, CheckCircle, FileText, Pen, AlertTriangle, Loader2,
  Building2, Calendar, Banknote, Lock,
} from "lucide-react";
import {
  getSigningData,
  fillContractFields,
  verifyBankId,
  signContract,
} from "@/lib/actions/contracts";

type SigningData = Awaited<ReturnType<typeof getSigningData>>;

const BANK_PROVIDERS = [
  { id: "csob", name: "ČSOB", color: "#003366" },
  { id: "kb", name: "Komerční banka", color: "#cc0000" },
  { id: "cs", name: "Česká spořitelna", color: "#0071ce" },
  { id: "mbank", name: "mBank", color: "#009ee0" },
  { id: "rb", name: "Raiffeisenbank", color: "#fee600" },
  { id: "fio", name: "Fio banka", color: "#2e368f" },
  { id: "moneta", name: "MONETA", color: "#00a6a0" },
  { id: "airbank", name: "Air Bank", color: "#72c02c" },
];

export default function SigningPage() {
  const params = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<SigningData>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"fields" | "identity" | "sign" | "done" | "error">("fields");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const result = await getSigningData(params.token as string);
    if (!result) {
      setStep("error");
      setLoading(false);
      return;
    }
    setData(result);
    // Pre-fill existing field values
    const existing: Record<string, string> = {};
    result.contract.fillableFields.forEach((f) => {
      if (f.filledValue) existing[f.fieldName] = f.filledValue;
    });
    setFieldValues(existing);

    if (result.status === "SIGNED") setStep("done");
    else if (result.bankIdVerified) setStep("sign");
    else if (result.status === "FIELDS_FILLED" || result.status === "IDENTITY_VERIFIED") setStep("identity");
    setLoading(false);
  }

  async function handleFieldsSubmit() {
    setProcessing(true);
    const fields = Object.entries(fieldValues).map(([fieldName, value]) => ({ fieldName, value }));
    await fillContractFields(params.token as string, fields);
    setStep("identity");
    setProcessing(false);
  }

  async function handleBankIdVerify(bankId: string) {
    setProcessing(true);
    // In production, this would redirect to the bank's OAuth flow
    // For now, we simulate the verification
    await verifyBankId(params.token as string, {
      bankIdProvider: bankId,
      bankIdTransactionId: `BID-${Date.now()}`,
      verifiedName: data?.signerName ?? "",
      idCardNumber: fieldValues.id_card_number ?? "",
      idCardType: fieldValues.id_card_type ?? "OP",
      secondIdNumber: fieldValues.second_id_number,
      secondIdType: fieldValues.second_id_type,
    });
    await loadData();
    setStep("sign");
    setProcessing(false);
  }

  async function handleSign() {
    if (!canvasRef.current) return;
    setProcessing(true);
    const signatureData = canvasRef.current.toDataURL("image/png");
    await signContract(params.token as string, {
      signatureData,
      signatureType: data?.verificationMethod === "BANK_ID" ? "ADVANCED" : "SIMPLE",
      signerIp: undefined,
      signerUserAgent: navigator.userAgent,
    });
    setStep("done");
    setProcessing(false);
  }

  // Canvas drawing
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (loading) return <div className="text-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" /></div>;

  if (step === "error") {
    return (
      <Card className="rounded-2xl text-center py-12">
        <CardContent>
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Neplatný nebo vypršelý odkaz</h2>
          <p className="text-gray-500">Tento odkaz pro podpis již není platný. Kontaktujte odesílatele smlouvy.</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "done") {
    return (
      <Card className="rounded-2xl text-center py-12">
        <CardContent>
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Smlouva podepsána</h2>
          <p className="text-gray-500 mb-4">Děkujeme. Vaše elektronické podepsání bylo úspěšně zaznamenáno.</p>
          <Badge variant="success" className="text-sm px-4 py-1">
            <Shield className="h-4 w-4 mr-1" />
            Podpis ověřen
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2 text-sm">
        {["Údaje", "Ověření totožnosti", "Podpis"].map((label, i) => {
          const stepIdx = i;
          const currentIdx = step === "fields" ? 0 : step === "identity" ? 1 : 2;
          const isActive = stepIdx === currentIdx;
          const isDone = stepIdx < currentIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-px ${isDone ? "bg-green-500" : "bg-gray-200"}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isActive ? "bg-blue-100 text-blue-700" : isDone ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                {isDone ? <CheckCircle className="h-3 w-3" /> : <span>{i + 1}</span>}
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contract Preview */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {data?.contract.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span>{data?.contract.partyAName} ↔ {data?.contract.partyBName}</span>
          </div>
          {data?.contract.validFrom && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Platnost: {new Date(data.contract.validFrom).toLocaleDateString("cs-CZ")} – {data.contract.validTo ? new Date(data.contract.validTo).toLocaleDateString("cs-CZ") : "neurčito"}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Fill Fields */}
      {step === "fields" && (
        <Card className="rounded-xl">
          <CardHeader><CardTitle>Vyplňte požadované údaje</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data?.contract.fillableFields.map((field) => (
              <div key={field.id}>
                <label className="text-sm font-medium text-gray-700">
                  {field.fieldLabel}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Input
                  type={field.fieldType === "DATE" ? "date" : field.fieldType === "NUMBER" ? "number" : "text"}
                  value={fieldValues[field.fieldName] ?? ""}
                  onChange={(e) => setFieldValues({ ...fieldValues, [field.fieldName]: e.target.value })}
                  required={field.isRequired}
                  className="mt-1"
                />
              </div>
            ))}
            <Button onClick={handleFieldsSubmit} disabled={processing} className="w-full">
              {processing ? "Ukládám..." : "Pokračovat k ověření totožnosti"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Identity Verification */}
      {step === "identity" && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Ověření totožnosti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Pro právní platnost podpisu dle eIDAS je nutné ověřit vaši totožnost.
              Vyberte svou banku pro přihlášení přes Bankovní identitu:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {BANK_PROVIDERS.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleBankIdVerify(bank.id)}
                  disabled={processing}
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: bank.color }}>
                    {bank.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{bank.name}</span>
                </button>
              ))}
            </div>
            {data?.verificationMethod !== "BANK_ID" && (
              <div className="border-t pt-4">
                <Button variant="outline" onClick={() => setStep("sign")} className="w-full">
                  Přeskočit ověření (jednoduchý podpis)
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Jednoduchý podpis nemá stejnou právní váhu jako podpis ověřený BankID
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Signature */}
      {step === "sign" && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Elektronický podpis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.bankIdVerified && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700">Totožnost ověřena přes BankID</p>
                  <p className="text-xs text-green-600">{data.bankIdProvider} • {data.bankIdVerifiedName}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500">Nakreslete svůj podpis myší nebo prstem:</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={() => setIsDrawing(false)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearCanvas}>Vymazat podpis</Button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <Lock className="h-3 w-3 inline mr-1" />
              Podpisem potvrzuji, že jsem se seznámil/a s obsahem smlouvy a souhlasím s jejími podmínkami.
              Podpis je zabezpečen SHA-256 hashem a záznamem v audit trail.
            </div>
            <Button onClick={handleSign} disabled={processing} className="w-full" size="lg">
              {processing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Podepisuji...</>
              ) : (
                <><Pen className="h-4 w-4 mr-2" />Podepsat smlouvu</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
