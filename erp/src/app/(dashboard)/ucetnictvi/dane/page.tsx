import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calculator, FileText, Download, Sparkles } from "lucide-react";

export default function TaxPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daňová přiznání</h1>
          <p className="text-gray-500">
            DPH, kontrolní hlášení, daň z příjmů PO - automatické generování
          </p>
        </div>
      </div>

      {/* Tax Types */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* VAT Return */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Přiznání k DPH
            </CardTitle>
            <CardDescription>
              Měsíční/čtvrtletní přiznání k dani z přidané hodnoty
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-500">
              <p>Další termín: <span className="font-medium text-gray-900">25. 4. 2026</span></p>
              <p>Období: <span className="font-medium text-gray-900">03/2026</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Sparkles className="h-4 w-4 mr-1" />
                Generovat AI
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Control Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Kontrolní hlášení
            </CardTitle>
            <CardDescription>
              Měsíční kontrolní hlášení k DPH
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-500">
              <p>Další termín: <span className="font-medium text-gray-900">25. 4. 2026</span></p>
              <p>Období: <span className="font-medium text-gray-900">03/2026</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Sparkles className="h-4 w-4 mr-1" />
                Generovat AI
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Income Tax */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              Daň z příjmů PO
            </CardTitle>
            <CardDescription>
              Roční přiznání k dani z příjmů právnických osob
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-500">
              <p>Další termín: <span className="font-medium text-gray-900">1. 4. 2027</span></p>
              <p>Rok: <span className="font-medium text-gray-900">2026</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Sparkles className="h-4 w-4 mr-1" />
                Generovat AI
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historie přiznání</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Období</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Vygenerováno</TableHead>
                <TableHead>Podáno</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Zatím žádná přiznání. Použijte tlačítko &quot;Generovat AI&quot; pro automatické vytvoření.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
