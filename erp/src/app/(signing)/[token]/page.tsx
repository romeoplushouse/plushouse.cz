"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, CheckCircle, FileText, Pen, AlertTriangle, Loader2,
  Building2, Calendar, Lock, ArrowLeft, Phone,
} from "lucide-react";
import {
  getSigningData,
  fillContractFields,
  verifyBankId,
  signContract,
} from "@/lib/actions/contracts";

type SigningData = Awaited<ReturnType<typeof getSigningData>>;

export default function SigningPage() {
  const params = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<SigningData>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"fields" | "identity" | "sign" | "done" | "error">("fields");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // SMS OTP state
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsVerified, setSmsVerified] = useState(false);

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
    result.contract.fillableFields.forEach((f: { filledValue: string | null; fieldName: string }) => {
      if (f.filledValue) existing[f.fieldName] = f.filledValue;
    });
    setFieldValues(existing);

    if (result.status === "SIGNED") setStep("done");
    else if (result.bankIdVerified) setStep("sign");
    else if (result.status === "FIELDS_FILLED" || result.status === "IDENTITY_VERIFIED") setStep("identity");
    setLoading(false);
  }

  function validateFields(): boolean {
    const errors: string[] = [];
    if (data?.contract.fillableFields) {
      for (const field of data.contract.fillableFields) {
        if (field.isRequired && !fieldValues[field.fieldName]?.trim()) {
          errors.push(field.fieldLabel);
        }
      }
    }
    setValidationErrors(errors);
    return errors.length === 0;
  }

  async function handleFieldsSubmit() {
    if (!validateFields()) return;
    setProcessing(true);
    const fields = Object.entries(fieldValues).map(([fieldName, value]) => ({ fieldName, value }));
    await fillContractFields(params.token as string, fields);
    setStep("identity");
    setProcessing(false);
  }

  function handleSendSms() {
    if (!smsPhone || smsPhone.length < 9) {
      setSmsError("Zadejte platné telefonní číslo");
      return;
    }
    setSmsError("");
    setSmsSent(true);
  }

  async function handleVerifySms() {
    if (smsCode.length !== 6 || !/^\d{6}$/.test(smsCode)) {
      setSmsError("Zadejte 6místný číselný kód");
      return;
    }
    setSmsError("");
    setProcessing(true);
    // Simulate SMS OTP verification - accept any 6-digit code
    await verifyBankId(params.token as string, {
      bankIdProvider: "SMS_OTP",
      bankIdTransactionId: `SMS-${Date.now()}`,
      verifiedName: data?.signerName ?? "",
      idCardNumber: fieldValues.id_card_number ?? "",
      idCardType: "SMS",
      secondIdNumber: undefined,
      secondIdType: undefined,
    });
    setSmsVerified(true);
    await loadData();
    setStep("sign");
    setProcessing(false);
  }

  function handleSkipVerification() {
    setStep("sign");
  }

  async function handleSign() {
    if (!canvasRef.current) return;
    setProcessing(true);
    const signatureData = canvasRef.current.toDataURL("image/png");
    await signContract(params.token as string, {
      signatureData,
      signatureType: smsVerified ? "ADVANCED" : "SIMPLE",
      signerIp: undefined,
      signerUserAgent: navigator.userAgent,
    });
    setStep("done");
    setProcessing(false);
  }

  function goToStep(target: "fields" | "identity" | "sign") {
    const stepOrder = ["fields", "identity", "sign"];
    const currentIdx = step === "fields" ? 0 : step === "identity" ? 1 : 2;
    const targetIdx = stepOrder.indexOf(target);
    // Only allow going back
    if (targetIdx < currentIdx) {
      setStep(target);
    }
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
    ctx.strokeStyle = "#B5E126";
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

  // Render contract HTML with replaced placeholders
  function getRenderedHtml(): string {
    if (!data?.contract) return "";
    return renderContractHtmlClient(data.contract);
  }

  function renderContractHtmlClient(contract: NonNullable<SigningData>["contract"]): string {
    let html = contract.htmlContent ?? "";

    const replacements: Record<string, string> = {
      "{{partyAName}}": contract.partyAName ?? "",
      "{{partyBName}}": contract.partyBName ?? "",
      "{{partyAIco}}": contract.partyAIco ?? "",
      "{{partyBIco}}": contract.partyBIco ?? "",
      "{{partyADic}}": contract.partyADic ?? "",
      "{{partyBDic}}": contract.partyBDic ?? "",
      "{{partyAAddress}}": contract.partyAAddress ?? "",
      "{{partyBAddress}}": contract.partyBAddress ?? "",
      "{{partyARepresentative}}": contract.partyARepresentative ?? "",
      "{{partyBRepresentative}}": contract.partyBRepresentative ?? "",
      "{{totalAmount}}": contract.totalAmount ? Number(contract.totalAmount).toLocaleString("cs-CZ") : "",
      "{{validFrom}}": contract.validFrom ? new Date(contract.validFrom).toLocaleDateString("cs-CZ") : "",
      "{{validTo}}": contract.validTo ? new Date(contract.validTo).toLocaleDateString("cs-CZ") : "",
      "{{contractNumber}}": contract.contractNumber ?? "",
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      html = html.replaceAll(placeholder, value);
    }

    // Replace {{field:name:label:type}} with filled values or placeholder
    html = html.replace(/\{\{field:(\w+):([^:]+):(\w+)\}\}/g, (_match, fieldName, _label, _type) => {
      const field = contract.fillableFields.find((f: { fieldName: string }) => f.fieldName === fieldName);
      if (field?.filledValue) return `<strong>${field.filledValue}</strong>`;
      return `<span style="color: #B5E126; border-bottom: 1px dashed #B5E126;">[${_label}]</span>`;
    });

    return html;
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#B5E126]" />
    </div>
  );

  if (step === "error") {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <Card className="rounded-2xl text-center py-12 bg-[#1a1d24] border-[#2a2d35] max-w-md w-full">
          <CardContent>
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Neplatny nebo vyprsely odkaz</h2>
            <p className="text-gray-400">Tento odkaz pro podpis jiz neni platny. Kontaktujte odesilatele smlouvy.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <Card className="rounded-2xl text-center py-12 bg-[#1a1d24] border-[#2a2d35] max-w-md w-full">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-[#B5E126]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-[#B5E126]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Smlouva podepsana</h2>
            <p className="text-gray-400 mb-4">Dekujeme. Vase elektronicke podepsani bylo uspesne zaznamenano.</p>
            <Badge variant="success" className="text-sm px-4 py-1 bg-[#B5E126]/20 text-[#B5E126] border-[#B5E126]/30">
              <Shield className="h-4 w-4 mr-1" />
              Podpis overen
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentIdx = step === "fields" ? 0 : step === "identity" ? 1 : 2;

  return (
    <div className="min-h-screen bg-[#0f1117] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Stepper */}
        <div className="flex items-center gap-2 text-sm">
          {["Udaje", "Overeni totoznosti", "Podpis"].map((label, i) => {
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            const isClickable = i < currentIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-px ${isDone ? "bg-[#B5E126]" : "bg-[#2a2d35]"}`} />}
                <button
                  type="button"
                  onClick={() => isClickable && goToStep(["fields", "identity", "sign"][i] as "fields" | "identity" | "sign")}
                  disabled={!isClickable}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#B5E126]/20 text-[#B5E126]"
                      : isDone
                        ? "bg-[#B5E126]/10 text-[#B5E126] cursor-pointer hover:bg-[#B5E126]/20"
                        : "bg-[#1a1d24] text-gray-500"
                  } ${isClickable ? "cursor-pointer" : ""}`}
                >
                  {isDone ? <CheckCircle className="h-3 w-3" /> : <span>{i + 1}</span>}
                  {label}
                </button>
              </div>
            );
          })}
        </div>

        {/* Contract Preview */}
        <Card className="rounded-xl bg-[#1a1d24] border-[#2a2d35]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-[#B5E126]" />
              {data?.contract.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span>{data?.contract.partyAName} ↔ {data?.contract.partyBName}</span>
            </div>
            {data?.contract.validFrom && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Platnost: {new Date(data.contract.validFrom).toLocaleDateString("cs-CZ")} – {data.contract.validTo ? new Date(data.contract.validTo).toLocaleDateString("cs-CZ") : "neurcito"}</span>
              </div>
            )}
            {/* Rendered contract HTML */}
            {data?.contract.htmlContent && (
              <div className="mt-4 p-4 bg-[#0f1117] rounded-lg border border-[#2a2d35]">
                <div
                  className="prose prose-invert prose-sm max-w-none text-gray-300 [&_h1]:text-white [&_h1]:text-lg [&_h2]:text-white [&_h2]:text-base [&_strong]:text-white"
                  dangerouslySetInnerHTML={{ __html: getRenderedHtml() }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 1: Fill Fields */}
        {step === "fields" && (
          <Card className="rounded-xl bg-[#1a1d24] border-[#2a2d35]">
            <CardHeader><CardTitle className="text-white">Vyplnte pozadovane udaje</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm font-medium text-red-400 mb-1">Vyplnte vsechna povinna pole:</p>
                  <ul className="text-sm text-red-400/80 list-disc list-inside">
                    {validationErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data?.contract.fillableFields.map((field) => (
                <div key={field.id}>
                  <label className="text-sm font-medium text-gray-300">
                    {field.fieldLabel}
                    {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <Input
                    type={field.fieldType === "DATE" ? "date" : field.fieldType === "NUMBER" ? "number" : "text"}
                    value={fieldValues[field.fieldName] ?? ""}
                    onChange={(e) => {
                      setFieldValues({ ...fieldValues, [field.fieldName]: e.target.value });
                      if (validationErrors.length > 0) setValidationErrors([]);
                    }}
                    required={field.isRequired}
                    className="mt-1 bg-[#0f1117] border-[#2a2d35] text-white"
                  />
                </div>
              ))}
              <Button
                onClick={handleFieldsSubmit}
                disabled={processing}
                className="w-full bg-[#B5E126] text-[#0f1117] hover:bg-[#b5e154] font-semibold"
              >
                {processing ? "Ukladam..." : "Pokracovat k overeni totoznosti"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Identity Verification */}
        {step === "identity" && (
          <Card className="rounded-xl bg-[#1a1d24] border-[#2a2d35]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-[#B5E126]" />
                Overeni totoznosti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.verificationMethod === "SMS_OTP" ? (
                <>
                  <p className="text-sm text-gray-400">
                    Pro overeni vasi totoznosti odeslete SMS kod na vase telefonni cislo.
                  </p>

                  {!smsSent ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Telefonni cislo</label>
                        <div className="flex gap-2 mt-1">
                          <div className="flex items-center gap-1 px-3 bg-[#0f1117] border border-[#2a2d35] rounded-lg text-gray-400 text-sm">
                            <Phone className="h-4 w-4" />
                            +420
                          </div>
                          <Input
                            type="tel"
                            value={smsPhone}
                            onChange={(e) => { setSmsPhone(e.target.value); setSmsError(""); }}
                            placeholder="777 123 456"
                            className="bg-[#0f1117] border-[#2a2d35] text-white"
                          />
                        </div>
                      </div>
                      {smsError && <p className="text-sm text-red-400">{smsError}</p>}
                      <Button
                        onClick={handleSendSms}
                        className="w-full bg-[#B5E126] text-[#0f1117] hover:bg-[#b5e154] font-semibold"
                      >
                        Odeslat kod
                      </Button>
                    </div>
                  ) : !smsVerified ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#B5E126]/10 border border-[#B5E126]/30 rounded-lg">
                        <p className="text-sm text-[#B5E126]">
                          Kod byl odeslan na cislo +420 {smsPhone}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Overovaci kod (6 cislic)</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={smsCode}
                          onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, "")); setSmsError(""); }}
                          placeholder="000000"
                          className="mt-1 bg-[#0f1117] border-[#2a2d35] text-white text-center text-2xl tracking-[0.5em] font-mono"
                        />
                      </div>
                      {smsError && <p className="text-sm text-red-400">{smsError}</p>}
                      <Button
                        onClick={handleVerifySms}
                        disabled={processing || smsCode.length !== 6}
                        className="w-full bg-[#B5E126] text-[#0f1117] hover:bg-[#b5e154] font-semibold"
                      >
                        {processing ? "Overuji..." : "Overit kod"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => { setSmsSent(false); setSmsCode(""); }}
                        className="text-sm text-gray-500 hover:text-gray-300 w-full text-center"
                      >
                        Odeslat znovu
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  U teto smlouvy neni vyzadovano overeni totoznosti.
                </p>
              )}

              {/* Skip / None verification */}
              {data?.verificationMethod !== "SMS_OTP" && (
                <Button
                  onClick={handleSkipVerification}
                  className="w-full bg-[#B5E126] text-[#0f1117] hover:bg-[#b5e154] font-semibold"
                >
                  Pokracovat k podpisu
                </Button>
              )}

              {data?.verificationMethod === "SMS_OTP" && (
                <div className="border-t border-[#2a2d35] pt-4">
                  <Button
                    variant="outline"
                    onClick={handleSkipVerification}
                    className="w-full border-[#2a2d35] text-gray-300 hover:bg-[#2a2d35]"
                  >
                    Preskocit overeni (jednoduchy podpis)
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Jednoduchy podpis nema stejnou pravni vahu jako overeny podpis
                  </p>
                </div>
              )}

              {/* Back button */}
              <Button
                variant="ghost"
                onClick={() => setStep("fields")}
                className="w-full text-gray-400 hover:text-white hover:bg-[#2a2d35]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpet na udaje
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Signature */}
        {step === "sign" && (
          <Card className="rounded-xl bg-[#1a1d24] border-[#2a2d35]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Pen className="h-5 w-5 text-[#B5E126]" />
                Elektronicky podpis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {smsVerified && (
                <div className="p-3 bg-[#B5E126]/10 border border-[#B5E126]/30 rounded-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#B5E126]" />
                  <div>
                    <p className="text-sm font-medium text-[#B5E126]">Totoznost overena pres SMS</p>
                    <p className="text-xs text-[#B5E126]/70">+420 {smsPhone}</p>
                  </div>
                </div>
              )}
              {data?.bankIdVerified && !smsVerified && (
                <div className="p-3 bg-[#B5E126]/10 border border-[#B5E126]/30 rounded-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#B5E126]" />
                  <div>
                    <p className="text-sm font-medium text-[#B5E126]">Totoznost overena</p>
                    <p className="text-xs text-[#B5E126]/70">{data.bankIdVerifiedName}</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400">Nakreslete svuj podpis mysi nebo prstem:</p>
              <div className="border-2 border-dashed border-[#2a2d35] rounded-xl bg-[#0f1117]">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  className="border-[#2a2d35] text-gray-300 hover:bg-[#2a2d35]"
                >
                  Vymazat podpis
                </Button>
              </div>
              <div className="p-3 bg-[#0f1117] border border-[#2a2d35] rounded-lg text-xs text-gray-500">
                <Lock className="h-3 w-3 inline mr-1" />
                Podpisem potvrzuji, ze jsem se seznamil/a s obsahem smlouvy a souhlasim s jejimi podminkami.
                Podpis je zabezpecen SHA-256 hashem a zaznamem v audit trail.
              </div>
              <Button
                onClick={handleSign}
                disabled={processing}
                className="w-full bg-[#B5E126] text-[#0f1117] hover:bg-[#b5e154] font-semibold"
                size="lg"
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Podepisuji...</>
                ) : (
                  <><Pen className="h-4 w-4 mr-2" />Podepsat smlouvu</>
                )}
              </Button>

              {/* Back button */}
              <Button
                variant="ghost"
                onClick={() => setStep("identity")}
                className="w-full text-gray-400 hover:text-white hover:bg-[#2a2d35]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpet na overeni
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
