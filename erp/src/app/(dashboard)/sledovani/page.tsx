export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  MapPin, Car, AlertTriangle, Activity, Navigation, Shield,
} from "lucide-react";
import Link from "next/link";
import { getSosAlerts, getGeofenceAlerts, getVehicles } from "@/lib/actions/settings";

export default async function TrackingPage() {
  const [sosAlerts, geofenceAlerts, vehicles] = await Promise.all([
    getSosAlerts(false),
    getGeofenceAlerts(false),
    getVehicles(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GPS Sledování</h1>
          <p className="text-gray-500">
            Realtime poloha zaměstnanců, vozidel, SOS signály, geofencing
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sledovani/vozidla">
            <Button variant="outline">
              <Car className="h-4 w-4 mr-2" />
              Vozidla ({vehicles.length})
            </Button>
          </Link>
          <Link href="/sledovani/cesty">
            <Button variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Pracovní cesty
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Online zaměstnanci</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Registrovaná vozidla</p>
                <p className="text-xl font-bold">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">SOS upozornění</p>
                <p className="text-xl font-bold">{sosAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Geofence výstrahy</p>
                <p className="text-xl font-bold">{geofenceAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa - živé sledování
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="h-16 w-16 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Mapa bude zobrazena po propojení s mobilními zařízeními</p>
              <p className="text-sm mt-1">
                Integrace s Apple Watch, iPhone GPS a vehicletracking API
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOS Alerts */}
      {sosAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Aktivní SOS upozornění
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zaměstnanec</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Poloha</TableHead>
                  <TableHead>Tep</TableHead>
                  <TableHead>Čas</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sosAlerts.map((alert) => (
                  <TableRow key={alert.id} className="bg-red-50">
                    <TableCell className="font-medium">
                      {alert.employee.firstName} {alert.employee.lastName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{alert.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                    </TableCell>
                    <TableCell>{alert.heartRate ? `${alert.heartRate} BPM` : "—"}</TableCell>
                    <TableCell>{new Date(alert.createdAt).toLocaleString("cs-CZ")}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm">Řešit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <Activity className="h-8 w-8 text-red-600 mb-3" />
            <h3 className="font-medium">Zdravotní monitoring</h3>
            <p className="text-sm text-gray-500 mt-1">Tepová frekvence, detekce pádu, Apple SOS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Car className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-medium">Fleet management</h3>
            <p className="text-sm text-gray-500 mt-1">Sledování vozidel, km, osobní/služební účely</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Shield className="h-8 w-8 text-orange-600 mb-3" />
            <h3 className="font-medium">Geofencing</h3>
            <p className="text-sm text-gray-500 mt-1">Upozornění při opuštění kraje, republiky</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
