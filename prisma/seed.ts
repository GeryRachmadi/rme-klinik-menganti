import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.account.upsert({
    where: { username: "gery.admin" },
    update: {},
    create: {
      username: "gery.admin",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      practitioner: {
        create: {
          name: "Gery Rachmadi",
          speciality: "Administrator",
        },
      },
    },
  });

  const pendaftaran = await prisma.account.upsert({
    where: { username: "gabrielle.frontdesk" },
    update: {},
    create: {
      username: "gabrielle.frontdesk",
      password: hashedPassword,
      role: "PENDAFTARAN",
      isActive: true,
      practitioner: {
        create: {
          name: "Gabrielle",
          speciality: "Pendaftaran",
        },
      },
    },
  });

  const perawat = await prisma.account.upsert({
    where: { username: "fanny.nurse" },
    update: {},
    create: {
      username: "fanny.nurse",
      password: hashedPassword,
      role: "PERAWAT",
      isActive: true,
      practitioner: {
        create: {
          name: "Fanny",
          speciality: "Perawat",
        },
      },
    },
  });

  const dokter = await prisma.account.upsert({
    where: { username: "strange.doctor" },
    update: {},
    create: {
      username: "strange.doctor",
      password: hashedPassword,
      role: "DOKTER",
      isActive: true,
      practitioner: {
        create: {
          name: "dr. Strange",
          speciality: "Umum",
        },
      },
    },
  });

  console.log("Seeded accounts:", {
    admin: admin.username,
    pendaftaran: pendaftaran.username,
    perawat: perawat.username,
    dokter: dokter.username,
  });

  console.log("Done! Password for all accounts: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());