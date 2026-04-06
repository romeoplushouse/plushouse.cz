"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Fuel, Clock } from "lucide-react";
import { createTrip } from "@/lib/actions/trips";
import { getEmployees } from "@/lib/actions/employees";
import { getVehicles } from "@/lib/actions/settings";

type Employee = { id: string; firstName: string; lastName: string };
type Vehicle = { id: string; licensePlate: string; make: string; model: string };

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isPersonal, setIsPersonal] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    async function load() {
      const [empResult, veh] = await Promise.all([
        getEmployees(),
        getVehicles(),
      ]);
      setEmployees(empResult.employees);
      setVehicles(veh);
    }
    load();
  }, []);

  function startGpsTracking() {
    if (!navigator.geolocation) {
      alert("GPS není dostupné v tomto prohlížeči");
      return;
    }
    setGpsActive(true);
    navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      await createTrip({
        employeeId: form.get("employeeId") as string,
        vehicleId: (form.get("vehicleId") as string) || undefined,
        purpose: form.get("purpose") as string,
        startLocation: form.get("startLocation") as string,
        endLocation: form.get("endLocation") as string,
        startDate: form.get("startDate") as string,
        endDate: (form.get("endDate") as string) || undefined,
        distanceKm: Number(form.get("distanceKm")),
        avgSpeedKmh: form.get("avgSpeedKmh") ? Number(form.get("avgSpeedKmh")) : undefined,
        maxSpeedKmh: form.get("maxSpeedKmh") ? Number(form.get("maxSpeedKmh")) : undefined,
        hardBrakeCount: form.get("hardBrakeCount") ? Number(form.get("hardBrakeCount")) : undefined,
        fuelCost: form.get("fuelCost") ? Number(form.get("fuelCost")) : undefined,
        otherCosts: form.get("otherCosts") ? Number(form.get("otherCosts")) : undefined,
        notes: (form.get("notes") as string) || undefined,
        isPersonal,
      });
      router.push("/kniha-jizd");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <h1 className="text-2xl font-bold text-white mb-6">Nová jízda</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        {/* Trip type toggle */}
        <div className="flex gap-3 mb-6">
          <Button
            type="button"
            variant={!isPersonal ? "default" : "outline"}
            onClick={() => setIsPersonal(false)}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Služební jízda
          </Button>
          <Button
            type="button"
            variant={isPersonal ? "default" : "outline"}
            onClick={() => setIsPersonal(true)}
            className="flex-1"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Osobní jízda
          </Button>
        </div>

        {isPersonal && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm p-3 rounded-lg mb-4">
            Osobní jízdy se zapisují pro evidenci km firemního vozu pro soukromé účely.
          </div>
        )}

        <Card className="mb-4 rounded-xl">
          <CardHeader><CardTitle>Řidič a vozidlo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Řidič <span className="text-red-500">*</span></label>
                <select name="employeeId" required className="mt-1 flex h-10 w-full rounded-lg border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                  <option value="">Vyberte řidiče</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Vozidlo</label>
                <select name="vehicleId" className="mt-1 flex h-10 w-full rounded-lg border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm">
                  <option value="">Vyberte vozidlo</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.licensePlate} – {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 rounded-xl">
          <CardHeader><CardTitle>Trasa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Odkud <span className="text-red-500">*</span></label>
                <Input name="startLocation" required placeholder="např. Brno, sídlo firmy" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Kam <span className="text-red-500">*</span></label>
                <Input name="endLocation" required placeholder="např. Olomouc, zákazník" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Účel jízdy <span className="text-red-500">*</span></label>
              <Input name="purpose" required placeholder="např. Montáž FVE u zákazníka" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Odjezd <span className="text-red-500">*</span></label>
                <Input name="startDate" type="datetime-local" required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Příjezd</label>
                <Input name="endDate" type="datetime-local" className="mt-1" />
              </div>
            </div>

            {/* GPS tracking */}
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              {gpsActive ? (
                <>
                  <div className="h-3 w-3 rounded-full bg-emerald-500/100 animate-pulse" />
                  <span className="text-sm text-emerald-400 font-medium">
                    GPS aktivní {currentPos && `(${currentPos.lat.toFixed(4)}, ${currentPos.lng.toFixed(4)})`}
                  </span>
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5 text-blue-400" />
                  <Button type="button" variant="outline" size="sm" onClick={startGpsTracking}>
                    Zapnout GPS tracking
                  </Button>
                  <span className="text-xs text-gray-500">Automatický záznam trasy</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 rounded-xl">
          <CardHeader><CardTitle>Vzdálenost a náklady</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Vzdálenost (km) <span className="text-red-500">*</span></label>
                <Input name="distanceKm" type="number" step="0.1" required placeholder="0.0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Průměrná rychlost (km/h)</label>
                <Input name="avgSpeedKmh" type="number" step="0.1" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Max. rychlost (km/h)</label>
                <Input name="maxSpeedKmh" type="number" step="0.1" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Náklady PHM (Kč)</label>
                <Input name="fuelCost" type="number" step="0.01" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Ostatní náklady (Kč)</label>
                <Input name="otherCosts" type="number" step="0.01" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Tvrdé brzdění</label>
                <Input name="hardBrakeCount" type="number" defaultValue="0" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Poznámky</label>
              <textarea
                name="notes"
                rows={2}
                className="mt-1 flex w-full rounded-lg border border-[#2a2d35] bg-[#1a1d24] text-white px-3 py-2 text-sm"
                placeholder="Volitelné poznámky k jízdě..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/kniha-jizd")}>
            Zrušit
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Ukládám..." : "Zaznamenat jízdu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
