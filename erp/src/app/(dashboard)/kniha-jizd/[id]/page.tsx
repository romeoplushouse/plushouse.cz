"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Navigation, Fuel, Clock, CheckCircle, Trash2,
  ArrowLeft, Route,
} from "lucide-react";
import { getTripById, updateTripStatus, deleteTrip, getGpsTrack } from "@/lib/actions/trips";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type Trip = Awaited<ReturnType<typeof getTripById>>;
type GpsPoint = { lat: number; lng: number; speed: number | null; timestamp: Date };

const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "success" }> = {
  DRAFT: { label: "Koncept", variant: "secondary" },
  SUBMITTED: { label: "Odesláno", variant: "default" },
  APPROVED: { label: "Schváleno", variant: "success" },
};

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>(null);
  const [gpsTrack, setGpsTrack] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await getTripById(params.id as string);
    setTrip(data);
    if (data) {
      const track = await getGpsTrack(
        data.employeeId,
        new Date(data.startDate).toISOString().split("T")[0]
      );
      setGpsTrack(track as GpsPoint[]);
    }
    setLoading(false);
  }

  async function handleStatusChange(status: "SUBMITTED" | "APPROVED") {
    await updateTripStatus(params.id as string, status);
    loadData();
  }

  async function handleDelete() {
    if (!confirm("Opravdu chcete smazat tento záznam?")) return;
    await deleteTrip(params.id as string);
    router.push("/kniha-jizd");
  }

  if (loading || !trip) {
    return <div className="text-center py-12 text-gray-500">Načítám...</div>;
  }

  const isPersonal = trip.purpose.startsWith("OSOBNÍ:");
  const purpose = isPersonal ? trip.purpose.replace("OSOBNÍ: ", "") : trip.purpose;
  const duration = trip.endDate
    ? Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 60000)
    : null;
  const si = statusMap[trip.status] ?? statusMap.DRAFT;

  return (
    <div className="page-enter space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/kniha-jizd")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {trip.startLocation} → {trip.endLocation}
            </h1>
            <p className="text-gray-500">
              {formatDate(trip.startDate)} • {trip.employee.firstName} {trip.employee.lastName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={si.variant} className="text-sm px-3 py-1">{si.label}</Badge>
          <Badge variant={isPersonal ? "warning" : "success"} className="text-sm px-3 py-1">
            {isPersonal ? "Osobní" : "Služební"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Details */}
        <Card className="rounded-xl">
          <CardHeader><CardTitle>Detaily jízdy</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Řidič</span>
              <span className="font-medium">{trip.employee.firstName} {trip.employee.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Účel</span>
              <span className="font-medium">{purpose}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Odjezd</span>
              <span className="font-medium">{formatDateTime(trip.startDate)}</span>
            </div>
            {trip.endDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Příjezd</span>
                <span className="font-medium">{formatDateTime(trip.endDate)}</span>
              </div>
            )}
            {duration && (
              <div className="flex justify-between">
                <span className="text-gray-500">Doba jízdy</span>
                <span className="font-medium">
                  {Math.floor(duration / 60)}h {duration % 60}min
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Vzdálenost</span>
              <span className="font-bold text-lg">{Number(trip.distanceKm).toFixed(1)} km</span>
            </div>
            {trip.avgSpeedKmh && (
              <div className="flex justify-between">
                <span className="text-gray-500">Průměrná rychlost</span>
                <span className="font-medium">{Number(trip.avgSpeedKmh).toFixed(0)} km/h</span>
              </div>
            )}
            {trip.maxSpeedKmh && (
              <div className="flex justify-between">
                <span className="text-gray-500">Maximální rychlost</span>
                <span className="font-medium">{Number(trip.maxSpeedKmh).toFixed(0)} km/h</span>
              </div>
            )}
            {trip.hardBrakeCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tvrdé brzdění</span>
                <span className="font-medium text-red-400">{trip.hardBrakeCount}x</span>
              </div>
            )}
            {trip.notes && (
              <div className="pt-2 border-t">
                <span className="text-gray-500">Poznámky:</span>
                <p className="mt-1 text-gray-400">{trip.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Costs */}
        <Card className="rounded-xl">
          <CardHeader><CardTitle>Náklady</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {trip.fuelCost && Number(trip.fuelCost) > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-500">PHM</span>
                </div>
                <span className="font-medium">{formatCurrency(Number(trip.fuelCost))}</span>
              </div>
            )}
            {trip.mealAllowance && Number(trip.mealAllowance) > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span className="text-gray-500">Stravné</span>
                </div>
                <span className="font-medium">{formatCurrency(Number(trip.mealAllowance))}</span>
              </div>
            )}
            {trip.otherCosts && Number(trip.otherCosts) > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-500">Ostatní</span>
                </div>
                <span className="font-medium">{formatCurrency(Number(trip.otherCosts))}</span>
              </div>
            )}
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-medium text-gray-400">Celkem náklady</span>
              <span className="font-bold text-lg">
                {formatCurrency(
                  Number(trip.fuelCost ?? 0) +
                  Number(trip.mealAllowance ?? 0) +
                  Number(trip.otherCosts ?? 0)
                )}
              </span>
            </div>
            {!isPersonal && (
              <div className="p-3 bg-emerald-500/10 rounded-lg mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-400">Daňový odpočet (5,60 Kč/km)</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(Number(trip.distanceKm) * 5.6)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GPS Track */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            GPS trasa ({gpsTrack.length} bodů)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gpsTrack.length === 0 ? (
            <div className="bg-[#1a1d24] rounded-lg h-48 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Žádná GPS data pro tento den</p>
                <p className="text-xs text-gray-400 mt-1">GPS tracking zaznamenává pozici automaticky</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1d24] rounded-lg h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">{gpsTrack.length} GPS bodů zaznamenáno</p>
                <p className="text-xs text-gray-400 mt-1">
                  {gpsTrack[0]?.lat.toFixed(4)}, {gpsTrack[0]?.lng.toFixed(4)} →{" "}
                  {gpsTrack[gpsTrack.length - 1]?.lat.toFixed(4)}, {gpsTrack[gpsTrack.length - 1]?.lng.toFixed(4)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Smazat
        </Button>
        <div className="flex gap-2">
          {trip.status === "DRAFT" && (
            <Button variant="outline" onClick={() => handleStatusChange("SUBMITTED")}>
              Odeslat ke schválení
            </Button>
          )}
          {trip.status === "SUBMITTED" && (
            <Button variant="success" onClick={() => handleStatusChange("APPROVED")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Schválit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
