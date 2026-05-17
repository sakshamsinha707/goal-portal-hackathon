import "dotenv/config";
import { compare } from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { DEMO_PASSWORD } from "../src/lib/constants";

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true },
    orderBy: { email: "asc" },
  });

  console.log(`Users (${users.length}):`);
  for (const u of users) {
    console.log(`  ${u.role.padEnd(8)} ${u.email} — ${u.name}`);
  }

  const admin = await prisma.user.findUnique({
    where: { email: "admin@atomquest.com" },
  });
  if (!admin) {
    console.error("FAIL: admin@atomquest.com not found");
    process.exit(1);
  }

  const passwordOk = await compare(DEMO_PASSWORD, admin.passwordHash);
  console.log(`Admin password check: ${passwordOk ? "PASS" : "FAIL"}`);

  const departments = await prisma.department.count();
  const goalSheets = await prisma.goalSheet.count();
  console.log(`Departments: ${departments}, Goal sheets: ${goalSheets}`);

  if (!passwordOk || users.length < 8) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
