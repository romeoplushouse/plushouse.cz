import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { czechChartOfAccounts } from "../src/lib/czech-chart-of-accounts";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@plushouse.cz" },
    update: {},
    create: {
      email: "admin@plushouse.cz",
      name: "Administrátor",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create organization
  await prisma.organization.upsert({
    where: { ico: "00000000" },
    update: {},
    create: {
      name: "PLUS HOUSE s.r.o.",
      ico: "00000000",
      dic: "CZ00000000",
      street: "",
      city: "Brno",
      zip: "60200",
      country: "CZ",
      email: "info@plushouse.cz",
    },
  });
  console.log("Created organization");

  // Seed chart of accounts
  for (const account of czechChartOfAccounts) {
    await prisma.chartOfAccounts.upsert({
      where: { code: account.code },
      update: {},
      create: {
        code: account.code,
        name: account.name,
        type: account.type,
        group: account.group,
      },
    });
  }
  console.log(`Seeded ${czechChartOfAccounts.length} accounts in chart of accounts`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
