"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Car } from "lucide-react";
import { getVehicles, createVehicle } from "@/lib/actions/settings";

type Vehicle = Awaited<ReturnType<typeof getVehicles>>[0];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    const data = await getVehicles();
    setVehicles(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await createVehicle({
      licensePlate: form.get("licensePlate") as string,
      make: form.get("make") as string,
      model: form.get("model") as string,
      year: form.get("year") ? Number(form.get("year")) : undefined,
      vin: (form.get("vin") as string) || undefined,
      fuelType: (form.get("fuelType") as string) || undefined,
      personalUseAllowed: form.get("personalUseAllowed") === "on",
      geofenceRegion: (form.get("geofenceRegion") as string) || undefined,
    });
    setShowForm(false);
    loadVehicles();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vozidla</h1>
          <p className="text-gray-500">Firemní vozový park, osobní využití, geofencing</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nové vozidlo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nové vozidlo</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">SPZ <span className="text-red-500">*</span></label>
                  <Input name="licensePlate" required placeholder="1B2 3456" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Značka <span className="text-red-500">*</span></label>
                  <Input name="make" required placeholder="Škoda" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Model <span className="text-red-500">*</span></label>
                  <Input name="model" required placeholder="Octavia" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Rok výroby</label>
                  <Input name="year" type="number" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">VIN</label>
                  <Input name="vin" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Palivo</label>
                  <select name="fuelType" className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="GASOLINE">Benzín</option>
                    <option value="DIESEL">Nafta</option>
                    <option value="ELECTRIC">Elektro</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Geofence region</label>
                  <select name="geofenceRegion" className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">Bez omezení</option>
                    <option value="CZ">Česká republika</option>
                    <option value="JIHOMORAVSKY_KRAJ">Jihomoravský kraj</option>
                    <option value="OLOMOUCKY_KRAJ">Olomoucký kraj</option>
                    <option value="EU">EU</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" name="personalUseAllowed" id="personalUse" />
                  <label htmlFor="personalUse" className="text-sm font-medium text-gray-700">
                    Povolit osobní využití
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Uložit</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Zrušit</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SPZ</TableHead>
                <TableHead>Vozidlo</TableHead>
                <TableHead>Rok</TableHead>
                <TableHead>Palivo</TableHead>
                <TableHead>Osobní účely</TableHead>
                <TableHead>Geofence</TableHead>
                <TableHead>Stav tachometru</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Načítám...</TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádná vozidla</p>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold">{v.licensePlate}</TableCell>
                    <TableCell>{v.make} {v.model}</TableCell>
                    <TableCell>{v.year ?? "—"}</TableCell>
                    <TableCell>{v.fuelType ?? "—"}</TableCell>
                    <TableCell>
                      {v.personalUseAllowed ? (
                        <Badge variant="success">Ano</Badge>
                      ) : (
                        <Badge variant="secondary">Ne</Badge>
                      )}
                    </TableCell>
                    <TableCell>{v.geofenceRegion ?? "Bez omezení"}</TableCell>
                    <TableCell>{Number(v.odometerKm).toLocaleString("cs-CZ")} km</TableCell>
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
