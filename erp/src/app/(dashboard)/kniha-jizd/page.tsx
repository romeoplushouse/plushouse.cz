export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Car, Route, Fuel, MapPin, FileDown, Calendar,
  Briefcase, User, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { getTrips, getTripStats } from "@/lib/actions/trips";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "success" }> = {
  DRAFT: { label: "Koncept", variant: "secondary" },
  SUBMITTED: { label: "Odesláno", variant: "default" },
  APPROVED: { label: "Schváleno", variant: "success" },
};

export default async function TripLogPage() {
  const [{ trips, total }, stats] = await Promise.all([
    getTrips(),
    getTripStats(),
  ]);

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kniha jízd</h1>
          <p className="text-gray-500">
            Evidence služebních a soukromých jízd, GPS tracking, náklady
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/kniha-jizd/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nová jízda
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-blue-500 to-blue-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white">{stats.totalTrips}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Celkem jízd</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-blue-400 font-semibold">{stats.businessTrips} služebních</span>
                <span className="text-gray-400">|</span>
                <span className="text-amber-400 font-semibold">{stats.personalTrips} osobních</span>
              </div>
            </CardContent>
          </div>
        </Card>

        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-green-500 to-emerald-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white">
                {stats.totalKm.toLocaleString("cs-CZ")} km
              </p>
              <p className="text-sm font-medium text-gray-500 mt-1">Celkem najeté km</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Briefcase className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{stats.businessKm.toLocaleString("cs-CZ")} km služebně</span>
              </div>
            </CardContent>
          </div>
        </Card>

        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-purple-500 to-violet-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white">
                {formatCurrency(stats.totalCosts)}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-1">Celkové náklady</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Fuel className="h-3 w-3 text-purple-400" />
                <span className="text-purple-400 font-semibold">PHM: {formatCurrency(stats.totalFuel)}</span>
              </div>
            </CardContent>
          </div>
        </Card>

        <Card className="card-hover overflow-hidden rounded-2xl border-[#2a2d35] shadow-none">
          <div className="flex">
            <div className="w-1 shrink-0 bg-gradient-to-b from-amber-500 to-orange-600" />
            <CardContent className="p-5 flex-1">
              <p className="text-3xl font-bold text-white">
                {formatCurrency(stats.taxDeduction)}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-1">Daňový odpočet</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <TrendingUp className="h-3 w-3 text-amber-400" />
                <span className="text-amber-400 font-semibold">{stats.kmRate} Kč/km</span>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="stat-card-blue rounded-2xl border-[#2a2d35] shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Stravné</p>
                <p className="text-xl font-bold text-white">{formatCurrency(stats.totalMeal)}</p>
              </div>
              <div className="p-2 rounded-xl bg-[#2a2d35] shadow-sm">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card-green rounded-2xl border-[#2a2d35] shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Osobní km</p>
                <p className="text-xl font-bold text-white">{stats.personalKm.toLocaleString("cs-CZ")} km</p>
              </div>
              <div className="p-2 rounded-xl bg-[#2a2d35] shadow-sm">
                <User className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card-purple rounded-2xl border-[#2a2d35] shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ostatní náklady</p>
                <p className="text-xl font-bold text-white">{formatCurrency(stats.totalOther)}</p>
              </div>
              <div className="p-2 rounded-xl bg-[#2a2d35] shadow-sm">
                <Fuel className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips Table */}
      <Card className="rounded-2xl border-[#2a2d35] shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Záznamy jízd</CardTitle>
          <Badge variant="outline">{total} záznamů</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Řidič</TableHead>
                <TableHead>Odkud</TableHead>
                <TableHead>Kam</TableHead>
                <TableHead>Účel</TableHead>
                <TableHead className="text-right">Km</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-12">
                    <Route className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">Zatím žádné záznamy jízd</p>
                    <p className="text-sm mt-1">
                      <Link href="/kniha-jizd/nova" className="text-[#B5E126] hover:underline">
                        Zaznamenejte první jízdu
                      </Link>
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => {
                  const isPersonal = trip.purpose.startsWith("OSOBNÍ:");
                  const purpose = isPersonal
                    ? trip.purpose.replace("OSOBNÍ: ", "")
                    : trip.purpose;
                  const si = statusMap[trip.status] ?? statusMap.DRAFT;

                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        {formatDate(trip.startDate)}
                      </TableCell>
                      <TableCell>
                        {trip.employee.firstName} {trip.employee.lastName}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {trip.startLocation}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {trip.endLocation}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {purpose}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {Number(trip.distanceKm).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isPersonal ? "warning" : "success"}>
                          {isPersonal ? "Osobní" : "Služební"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={si.variant}>{si.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/kniha-jizd/${trip.id}`}>
                          <Button variant="ghost" size="sm">Detail</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
