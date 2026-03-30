// Czech Standard Chart of Accounts (Účtový rozvrh)
// Based on Vyhláška č. 500/2002 Sb.

export type AccountDef = {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  group: string;
};

export const czechChartOfAccounts: AccountDef[] = [
  // Třída 0 - Dlouhodobý majetek
  { code: "011", name: "Zřizovací výdaje", type: "ASSET", group: "01 - Dlouhodobý nehmotný majetek" },
  { code: "012", name: "Nehmotné výsledky výzkumu a vývoje", type: "ASSET", group: "01 - Dlouhodobý nehmotný majetek" },
  { code: "013", name: "Software", type: "ASSET", group: "01 - Dlouhodobý nehmotný majetek" },
  { code: "019", name: "Ostatní dlouhodobý nehmotný majetek", type: "ASSET", group: "01 - Dlouhodobý nehmotný majetek" },
  { code: "021", name: "Stavby", type: "ASSET", group: "02 - Dlouhodobý hmotný majetek odpisovaný" },
  { code: "022", name: "Hmotné movité věci a jejich soubory", type: "ASSET", group: "02 - Dlouhodobý hmotný majetek odpisovaný" },
  { code: "031", name: "Pozemky", type: "ASSET", group: "03 - Dlouhodobý hmotný majetek neodpisovaný" },
  { code: "042", name: "Nedokončený dlouhodobý hmotný majetek", type: "ASSET", group: "04 - Nedokončený DHM a DFM" },
  { code: "052", name: "Poskytnuté zálohy na DHM", type: "ASSET", group: "05 - Zálohy na DM" },
  { code: "071", name: "Oprávky k zřizovacím výdajům", type: "ASSET", group: "07 - Oprávky k DNM" },
  { code: "073", name: "Oprávky k softwaru", type: "ASSET", group: "07 - Oprávky k DNM" },
  { code: "081", name: "Oprávky ke stavbám", type: "ASSET", group: "08 - Oprávky k DHM" },
  { code: "082", name: "Oprávky k hmotným movitým věcem", type: "ASSET", group: "08 - Oprávky k DHM" },

  // Třída 1 - Zásoby
  { code: "111", name: "Pořízení materiálu", type: "ASSET", group: "11 - Materiál" },
  { code: "112", name: "Materiál na skladě", type: "ASSET", group: "11 - Materiál" },
  { code: "119", name: "Materiál na cestě", type: "ASSET", group: "11 - Materiál" },
  { code: "131", name: "Pořízení zboží", type: "ASSET", group: "13 - Zboží" },
  { code: "132", name: "Zboží na skladě a v prodejnách", type: "ASSET", group: "13 - Zboží" },

  // Třída 2 - Krátkodobý finanční majetek a peněžní prostředky
  { code: "211", name: "Pokladna", type: "ASSET", group: "21 - Peníze" },
  { code: "213", name: "Ceniny", type: "ASSET", group: "21 - Peníze" },
  { code: "221", name: "Bankovní účty", type: "ASSET", group: "22 - Účty v bankách" },
  { code: "231", name: "Krátkodobé bankovní úvěry", type: "LIABILITY", group: "23 - Krátkodobé bankovní úvěry" },
  { code: "261", name: "Peníze na cestě", type: "ASSET", group: "26 - Převody mezi finančními účty" },

  // Třída 3 - Zúčtovací vztahy
  { code: "311", name: "Pohledávky z obchodních vztahů", type: "ASSET", group: "31 - Pohledávky" },
  { code: "314", name: "Poskytnuté zálohy", type: "ASSET", group: "31 - Pohledávky" },
  { code: "315", name: "Ostatní pohledávky", type: "ASSET", group: "31 - Pohledávky" },
  { code: "321", name: "Závazky z obchodních vztahů", type: "LIABILITY", group: "32 - Závazky" },
  { code: "324", name: "Přijaté zálohy", type: "LIABILITY", group: "32 - Závazky" },
  { code: "325", name: "Ostatní závazky", type: "LIABILITY", group: "32 - Závazky" },
  { code: "331", name: "Zaměstnanci", type: "LIABILITY", group: "33 - Zúčtování se zaměstnanci" },
  { code: "336", name: "Zúčtování s institucemi SZ a ZP", type: "LIABILITY", group: "33 - Zúčtování se zaměstnanci" },
  { code: "341", name: "Daň z příjmů", type: "LIABILITY", group: "34 - Zúčtování daní a dotací" },
  { code: "342", name: "Ostatní přímé daně", type: "LIABILITY", group: "34 - Zúčtování daní a dotací" },
  { code: "343", name: "DPH", type: "LIABILITY", group: "34 - Zúčtování daní a dotací" },
  { code: "345", name: "Ostatní daně a poplatky", type: "LIABILITY", group: "34 - Zúčtování daní a dotací" },
  { code: "349", name: "Vyrovnávací účet pro DPH", type: "LIABILITY", group: "34 - Zúčtování daní a dotací" },
  { code: "351", name: "Pohledávky - ovládající osoba", type: "ASSET", group: "35 - Pohledávky za společníky" },
  { code: "361", name: "Závazky - ovládající osoba", type: "LIABILITY", group: "36 - Závazky ke společníkům" },
  { code: "378", name: "Jiné pohledávky", type: "ASSET", group: "37 - Jiné pohledávky a závazky" },
  { code: "379", name: "Jiné závazky", type: "LIABILITY", group: "37 - Jiné pohledávky a závazky" },
  { code: "381", name: "Náklady příštích období", type: "ASSET", group: "38 - Přechodné účty aktiv a pasiv" },
  { code: "383", name: "Výdaje příštích období", type: "LIABILITY", group: "38 - Přechodné účty aktiv a pasiv" },
  { code: "384", name: "Výnosy příštích období", type: "LIABILITY", group: "38 - Přechodné účty aktiv a pasiv" },
  { code: "385", name: "Příjmy příštích období", type: "ASSET", group: "38 - Přechodné účty aktiv a pasiv" },
  { code: "389", name: "Dohadné účty pasivní", type: "LIABILITY", group: "38 - Přechodné účty aktiv a pasiv" },
  { code: "391", name: "Opravná položka k pohledávkám", type: "ASSET", group: "39 - Opravná položka" },

  // Třída 4 - Kapitálové účty a dlouhodobé závazky
  { code: "411", name: "Základní kapitál", type: "EQUITY", group: "41 - Základní kapitál" },
  { code: "421", name: "Zákonný rezervní fond", type: "EQUITY", group: "42 - Fondy ze zisku" },
  { code: "427", name: "Ostatní fondy", type: "EQUITY", group: "42 - Fondy ze zisku" },
  { code: "428", name: "Nerozdělený zisk minulých let", type: "EQUITY", group: "42 - Fondy ze zisku" },
  { code: "429", name: "Neuhrazená ztráta minulých let", type: "EQUITY", group: "42 - Fondy ze zisku" },
  { code: "431", name: "Výsledek hospodaření ve schvalovacím řízení", type: "EQUITY", group: "43 - Výsledek hospodaření" },
  { code: "451", name: "Rezervy zákonné", type: "LIABILITY", group: "45 - Rezervy" },
  { code: "461", name: "Bankovní úvěry dlouhodobé", type: "LIABILITY", group: "46 - Bankovní úvěry" },

  // Třída 5 - Náklady
  { code: "501", name: "Spotřeba materiálu", type: "EXPENSE", group: "50 - Spotřebované nákupy" },
  { code: "502", name: "Spotřeba energie", type: "EXPENSE", group: "50 - Spotřebované nákupy" },
  { code: "504", name: "Prodané zboží", type: "EXPENSE", group: "50 - Spotřebované nákupy" },
  { code: "511", name: "Opravy a udržování", type: "EXPENSE", group: "51 - Služby" },
  { code: "512", name: "Cestovné", type: "EXPENSE", group: "51 - Služby" },
  { code: "513", name: "Náklady na reprezentaci", type: "EXPENSE", group: "51 - Služby" },
  { code: "518", name: "Ostatní služby", type: "EXPENSE", group: "51 - Služby" },
  { code: "521", name: "Mzdové náklady", type: "EXPENSE", group: "52 - Osobní náklady" },
  { code: "524", name: "Zákonné sociální pojištění", type: "EXPENSE", group: "52 - Osobní náklady" },
  { code: "525", name: "Ostatní sociální pojištění", type: "EXPENSE", group: "52 - Osobní náklady" },
  { code: "527", name: "Zákonné sociální náklady", type: "EXPENSE", group: "52 - Osobní náklady" },
  { code: "531", name: "Daň silniční", type: "EXPENSE", group: "53 - Daně a poplatky" },
  { code: "532", name: "Daň z nemovitostí", type: "EXPENSE", group: "53 - Daně a poplatky" },
  { code: "538", name: "Ostatní daně a poplatky", type: "EXPENSE", group: "53 - Daně a poplatky" },
  { code: "541", name: "Zůstatková cena prodaného DNM a DHM", type: "EXPENSE", group: "54 - Jiné provozní náklady" },
  { code: "543", name: "Dary", type: "EXPENSE", group: "54 - Jiné provozní náklady" },
  { code: "544", name: "Smluvní pokuty a úroky z prodlení", type: "EXPENSE", group: "54 - Jiné provozní náklady" },
  { code: "545", name: "Ostatní pokuty a penále", type: "EXPENSE", group: "54 - Jiné provozní náklady" },
  { code: "546", name: "Odpis pohledávky", type: "EXPENSE", group: "54 - Jiné provozní náklady" },
  { code: "548", name: "Ostatní provozní náklady", type: "EXPENSE", group: "54 - Jiné provozní náklady" },
  { code: "551", name: "Odpisy DNM a DHM", type: "EXPENSE", group: "55 - Odpisy" },
  { code: "558", name: "Tvorba a zúčtování opravných položek", type: "EXPENSE", group: "55 - Odpisy" },
  { code: "562", name: "Úroky", type: "EXPENSE", group: "56 - Finanční náklady" },
  { code: "563", name: "Kurzové ztráty", type: "EXPENSE", group: "56 - Finanční náklady" },
  { code: "568", name: "Ostatní finanční náklady", type: "EXPENSE", group: "56 - Finanční náklady" },
  { code: "591", name: "Daň z příjmů z běžné činnosti - splatná", type: "EXPENSE", group: "59 - Daně z příjmů" },
  { code: "592", name: "Daň z příjmů z běžné činnosti - odložená", type: "EXPENSE", group: "59 - Daně z příjmů" },

  // Třída 6 - Výnosy
  { code: "601", name: "Tržby za vlastní výrobky", type: "REVENUE", group: "60 - Tržby za vlastní výkony" },
  { code: "602", name: "Tržby z prodeje služeb", type: "REVENUE", group: "60 - Tržby za vlastní výkony" },
  { code: "604", name: "Tržby za zboží", type: "REVENUE", group: "60 - Tržby za vlastní výkony" },
  { code: "641", name: "Tržby z prodeje DNM a DHM", type: "REVENUE", group: "64 - Jiné provozní výnosy" },
  { code: "642", name: "Tržby z prodeje materiálu", type: "REVENUE", group: "64 - Jiné provozní výnosy" },
  { code: "644", name: "Smluvní pokuty a úroky z prodlení", type: "REVENUE", group: "64 - Jiné provozní výnosy" },
  { code: "648", name: "Ostatní provozní výnosy", type: "REVENUE", group: "64 - Jiné provozní výnosy" },
  { code: "662", name: "Úroky", type: "REVENUE", group: "66 - Finanční výnosy" },
  { code: "663", name: "Kurzové zisky", type: "REVENUE", group: "66 - Finanční výnosy" },
  { code: "668", name: "Ostatní finanční výnosy", type: "REVENUE", group: "66 - Finanční výnosy" },

  // Třída 7 - Závěrkové a podrozvahové účty
  { code: "701", name: "Počáteční účet rozvažný", type: "EQUITY", group: "70 - Účty rozvažné" },
  { code: "702", name: "Konečný účet rozvažný", type: "EQUITY", group: "70 - Účty rozvažné" },
  { code: "710", name: "Účet zisků a ztrát", type: "EQUITY", group: "71 - Účet zisků a ztrát" },
];
