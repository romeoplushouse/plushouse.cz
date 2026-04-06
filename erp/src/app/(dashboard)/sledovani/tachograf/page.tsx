"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Gauge, Upload, AlertTriangle, Clock, MapPin, FileText,
  Plus, Flag, BarChart3,
} from "lucide-react";
import {
  getTachographFiles,
  getTachographStats,
  uploadTachographFile,
  importManualActivities,
  getDailySummaries,
  getViolations,
  getBorderCrossings,
} from "@/lib/actions/tachograph";
import { getEmployees } from "@/lib/actions/employees";
import { getVehicles } from "@/lib/actions/settings";
import { formatDate } from "@/lib/utils";

type TachographFile = Awaited<ReturnType<typeof getTachographFiles>>["files"][0];
type DailySummary = Awaited<ReturnType<typeof getDailySummaries>>[0];
type Violation = Awaited<ReturnType<typeof getViolations>>["violations"][0];
type Employee = Awaited<ReturnType<typeof getEmployees>>["employees"][0];
type Vehicle = Awaited<ReturnType<typeof getVehicles>>[0];

const activityLabels: Record<string, string> = {
  DRIVING: "Řízení",
  WORK: "Práce",
  AVAILABILITY: "Pohotovost",
  REST: "Odpočinek",
  BREAK: "Přestávka",
};

const activityColors: Record<string, string> = {
  DRIVING: "bg-blue-500/100",
  WORK: "bg-yellow-500",
  AVAILABILITY: "bg-purple-500",
  REST: "bg-emerald-500/100",
  BREAK: "bg-gray-400",
};

const violationLabels: Record<string, string> = {
  CONTINUOUS_DRIVING: "Nepřetržité řízení > 4,5h",
  DAILY_DRIVING: "Denní doba řízení > 9h",
  WEEKLY_DRIVING: "Týdenní doba řízení > 56h",
  BIWEEKLY_DRIVING: "2-týdenní doba řízení > 90h",
  DAILY_REST: "Denní odpočinek < 11h",
  WEEKLY_REST: "Týdenní odpočinek < 45h",
  BREAK_VIOLATION: "Chybějící přestávka",
  SPEED_LIMIT: "Překročení rychlosti",
  CARD_NOT_INSERTED: "Bez karty řidiče",
  MANIPULATION: "Manipulace s tachografem",
};

const severityVariants: Record<string, "secondary" | "warning" | "destructive"> = {
  MINOR: "secondary",
  SERIOUS: "warning",
  VERY_SERIOUS: "destructive",
};

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export default function TachographPage() {
  const [tab, setTab] = useState<"overview" | "files" | "summaries" | "violations" | "borders" | "import">("overview");
  const [stats, setStats] = useState({ totalFiles: 0, unprocessedFiles: 0, recentViolations: 0, daysWithViolations: 0 });
  const [files, setFiles] = useState<TachographFile[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 28);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [s, f, empResult, v] = await Promise.all([
      getTachographStats(),
      getTachographFiles(),
      getEmployees(),
      getVehicles(),
    ]);
    setStats(s);
    setFiles(f.files);
    setEmployees(empResult.employees);
    setVehicles(v);
    setLoading(false);
  }

  async function loadSummaries() {
    if (!selectedEmployee) return;
    const data = await getDailySummaries(selectedEmployee, dateFrom, dateTo);
    setSummaries(data);
  }

  async function loadViolations() {
    const data = await getViolations(
      selectedEmployee ? { employeeId: selectedEmployee } : undefined
    );
    setViolations(data.violations);
  }

  async function handleUploadFile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await uploadTachographFile({
      vehicleId: (form.get("vehicleId") as string) || undefined,
      employeeId: (form.get("employeeId") as string) || undefined,
      fileType: form.get("fileType") as "VEHICLE_DDD" | "DRIVER_DDD",
      fileName: form.get("fileName") as string,
      cardNumber: (form.get("cardNumber") as string) || undefined,
      downloadedAt: form.get("downloadedAt") as string,
      periodFrom: form.get("periodFrom") as string,
      periodTo: form.get("periodTo") as string,
    });
    loadData();
    setTab("files");
  }

  async function handleManualImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const date = form.get("date") as string;
    const empId = form.get("employeeId") as string;
    if (!empId || !date) return;

    const activities = [];
    // Collect from 4 time block inputs
    for (let i = 0; i < 4; i++) {
      const type = form.get(`act_type_${i}`) as string;
      const start = form.get(`act_start_${i}`) as string;
      const end = form.get(`act_end_${i}`) as string;
      const dist = form.get(`act_dist_${i}`) as string;
      if (type && start && end) {
        activities.push({
          type: type as "DRIVING" | "WORK" | "AVAILABILITY" | "REST" | "BREAK",
          startTime: `${date}T${start}:00`,
          endTime: `${date}T${end}:00`,
          distanceKm: dist ? Number(dist) : undefined,
        });
      }
    }

    if (activities.length > 0) {
      await importManualActivities({
        vehicleId: (form.get("vehicleId") as string) || undefined,
        employeeId: empId,
        date,
        activities,
      });
      alert("Data importována a denní souhrn přepočítán.");
      loadData();
    }
  }

  const tabs = [
    { id: "overview", label: "Přehled", icon: BarChart3 },
    { id: "files", label: "DDD soubory", icon: FileText },
    { id: "summaries", label: "Denní souhrny", icon: Clock },
    { id: "violations", label: "Přestupky", icon: AlertTriangle },
    { id: "borders", label: "Hranice", icon: Flag },
    { id: "import", label: "Import dat", icon: Upload },
  ] as const;

  if (loading) return <div className="text-center py-12 text-gray-500">Načítám...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Digitální tachograf</h1>
          <p className="text-gray-500">
            Smart tachograph Gen 2 - import DDD, aktivita řidičů, přestupky, hranice
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setTab(t.id);
              if (t.id === "summaries") loadSummaries();
              if (t.id === "violations") loadViolations();
            }}
          >
            <t.icon className="h-4 w-4 mr-1" />
            {t.label}
          </Button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-500">DDD soubory</p>
                    <p className="text-xl font-bold">{stats.totalFiles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Upload className="h-6 w-6 text-amber-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nezpracované</p>
                    <p className="text-xl font-bold">{stats.unprocessedFiles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                  <div>
                    <p className="text-sm text-gray-500">Přestupky (7 dní)</p>
                    <p className="text-xl font-bold">{stats.recentViolations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Gauge className="h-6 w-6 text-amber-400" />
                  <div>
                    <p className="text-sm text-gray-500">Dny s porušením</p>
                    <p className="text-xl font-bold">{stats.daysWithViolations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity type legend */}
          <Card>
            <CardHeader>
              <CardTitle>Typy aktivit řidiče (EU nařízení 561/2006)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(activityLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${activityColors[key]}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p><strong>EU limity:</strong></p>
                <p>Max. nepřetržité řízení: <strong>4,5 hodiny</strong> (pak 45 min přestávka)</p>
                <p>Max. denní řízení: <strong>9 hodin</strong> (2x týdně 10 hodin)</p>
                <p>Max. týdenní řízení: <strong>56 hodin</strong></p>
                <p>Max. 2-týdenní řízení: <strong>90 hodin</strong></p>
                <p>Min. denní odpočinek: <strong>11 hodin</strong> (3x týdně 9 hodin)</p>
                <p>Min. týdenní odpočinek: <strong>45 hodin</strong></p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* DDD Files */}
      {tab === "files" && (
        <Card>
          <CardHeader>
            <CardTitle>Nahraté DDD soubory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Soubor</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Vozidlo</TableHead>
                  <TableHead>Řidič</TableHead>
                  <TableHead>Karta</TableHead>
                  <TableHead>Období</TableHead>
                  <TableHead>Stav</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">Zatím žádné DDD soubory</p>
                      <p className="text-sm mt-1">
                        Přejděte na záložku &quot;Import dat&quot; pro nahrání
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.fileName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {f.fileType === "VEHICLE_DDD" ? "Vozidlo" : "Karta řidiče"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {f.vehicle ? `${f.vehicle.make} ${f.vehicle.model} (${f.vehicle.licensePlate})` : "—"}
                      </TableCell>
                      <TableCell>
                        {f.employee ? `${f.employee.firstName} ${f.employee.lastName}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono">{f.cardNumber ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(f.periodFrom)} – {formatDate(f.periodTo)}
                      </TableCell>
                      <TableCell>
                        {f.isProcessed ? (
                          <Badge variant="success">Zpracováno</Badge>
                        ) : (
                          <Badge variant="warning">Čeká</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Daily Summaries */}
      {tab === "summaries" && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Řidič</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm min-w-[200px]"
                  >
                    <option value="">Vyberte řidiče</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Od</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Do</label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={loadSummaries}>Zobrazit</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Řízení</TableHead>
                    <TableHead>Práce</TableHead>
                    <TableHead>Pohotovost</TableHead>
                    <TableHead>Odpočinek</TableHead>
                    <TableHead>Km</TableHead>
                    <TableHead>Max. rychlost</TableHead>
                    <TableHead>Nep. řízení</TableHead>
                    <TableHead>Porušení</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                        {selectedEmployee ? "Žádné záznamy pro vybrané období" : "Vyberte řidiče a klikněte Zobrazit"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaries.map((s) => (
                      <TableRow key={s.id} className={s.dailyDrivingExceeded || s.restViolation ? "bg-red-500/10" : ""}>
                        <TableCell className="font-medium">{formatDate(s.date)}</TableCell>
                        <TableCell className={s.dailyDrivingExceeded ? "text-red-400 font-bold" : ""}>
                          {formatMinutes(s.totalDrivingMinutes)}
                        </TableCell>
                        <TableCell>{formatMinutes(s.totalWorkMinutes)}</TableCell>
                        <TableCell>{formatMinutes(s.totalAvailMinutes)}</TableCell>
                        <TableCell className={s.restViolation ? "text-red-400 font-bold" : ""}>
                          {formatMinutes(s.totalRestMinutes)}
                        </TableCell>
                        <TableCell>{Number(s.totalDistanceKm).toFixed(0)} km</TableCell>
                        <TableCell>
                          {s.maxSpeedKmh ? `${Number(s.maxSpeedKmh).toFixed(0)} km/h` : "—"}
                        </TableCell>
                        <TableCell>{s.continuousDrivingMax ? formatMinutes(s.continuousDrivingMax) : "—"}</TableCell>
                        <TableCell>
                          {s.dailyDrivingExceeded && <Badge variant="destructive" className="mr-1">Řízení</Badge>}
                          {s.restViolation && <Badge variant="destructive">Odpočinek</Badge>}
                          {!s.dailyDrivingExceeded && !s.restViolation && (
                            <Badge variant="success">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Violations */}
      {tab === "violations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Přestupky a porušení
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Závažnost</TableHead>
                  <TableHead>Popis</TableHead>
                  <TableHead>Stav</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      Žádné zaznamenané přestupky
                    </TableCell>
                  </TableRow>
                ) : (
                  violations.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{formatDate(v.occurredAt)}</TableCell>
                      <TableCell>{violationLabels[v.violationType] ?? v.violationType}</TableCell>
                      <TableCell>
                        <Badge variant={severityVariants[v.severity] ?? "secondary"}>
                          {v.severity === "MINOR" ? "Mírné" : v.severity === "SERIOUS" ? "Závažné" : "Velmi závažné"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{v.description}</TableCell>
                      <TableCell>
                        {v.isAcknowledged ? (
                          <Badge variant="secondary">Uzavřeno</Badge>
                        ) : (
                          <Badge variant="destructive">Aktivní</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Border Crossings */}
      {tab === "borders" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Přechody hranic
            </CardTitle>
            <CardDescription>
              Automaticky zaznamenáváno tachografem Gen 2 pomocí GNSS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-8">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Přechody hranic budou zobrazeny po importu DDD dat</p>
              <p className="mt-1">Smart tachograf zaznamenává pozici každé 3 hodiny a při přechodu hranice</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import */}
      {tab === "import" && (
        <div className="space-y-6">
          {/* DDD File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Nahrát DDD soubor
              </CardTitle>
              <CardDescription>
                Import dat z karty řidiče nebo palubní jednotky tachografu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadFile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Typ souboru <span className="text-red-500">*</span></label>
                    <select name="fileType" required className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                      <option value="DRIVER_DDD">Karta řidiče (.ddd)</option>
                      <option value="VEHICLE_DDD">Palubní jednotka (.ddd)</option>
                      <option value="COMPANY_DDD">Firemní karta (.ddd)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Název souboru <span className="text-red-500">*</span></label>
                    <Input name="fileName" required placeholder="driver_card_20260330.ddd" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Řidič</label>
                    <select name="employeeId" className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                      <option value="">Vyberte řidiče</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Vozidlo</label>
                    <select name="vehicleId" className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                      <option value="">Vyberte vozidlo</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.licensePlate} – {v.make} {v.model}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Číslo karty</label>
                    <Input name="cardNumber" placeholder="CZ 0000000000000001" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Období od <span className="text-red-500">*</span></label>
                    <Input name="periodFrom" type="date" required className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Období do <span className="text-red-500">*</span></label>
                    <Input name="periodTo" type="date" required className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Staženo z tachografu <span className="text-red-500">*</span></label>
                  <Input name="downloadedAt" type="datetime-local" required className="mt-1" />
                </div>
                <Button type="submit">
                  <Upload className="h-4 w-4 mr-2" />
                  Nahrát soubor
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Manual Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Ruční import aktivit
              </CardTitle>
              <CardDescription>
                Zadejte aktivity řidiče ručně (pro případ nedostupnosti DDD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualImport} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Řidič <span className="text-red-500">*</span></label>
                    <select name="employeeId" required className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                      <option value="">Vyberte řidiče</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Datum <span className="text-red-500">*</span></label>
                    <Input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Vozidlo</label>
                    <select name="vehicleId" className="mt-1 flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                      <option value="">Vyberte vozidlo</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.licensePlate}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-400">Časové bloky aktivit:</p>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <select name={`act_type_${i}`} className="flex h-10 w-full rounded-md border border-[#2a2d35] bg-[#1a1d24] text-white px-2 py-2 text-sm">
                          <option value="">—</option>
                          <option value="DRIVING">Řízení</option>
                          <option value="WORK">Práce</option>
                          <option value="AVAILABILITY">Pohotovost</option>
                          <option value="REST">Odpočinek</option>
                          <option value="BREAK">Přestávka</option>
                        </select>
                      </div>
                      <div>
                        <Input name={`act_start_${i}`} type="time" placeholder="Od" />
                      </div>
                      <div>
                        <Input name={`act_end_${i}`} type="time" placeholder="Do" />
                      </div>
                      <div>
                        <Input name={`act_dist_${i}`} type="number" step="0.1" placeholder="km" />
                      </div>
                      <div className="text-xs text-gray-400">
                        {i === 0 ? "Blok 1" : i === 1 ? "Blok 2" : i === 2 ? "Blok 3" : "Blok 4"}
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Importovat aktivity
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
