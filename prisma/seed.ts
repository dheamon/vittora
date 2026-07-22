import { PrismaClient, ClientType } from "@prisma/client";
import { generateAisPassword } from "../src/lib/ais";

const prisma = new PrismaClient();

interface SeedClient {
  type: ClientType;
  name: string;
  pan: string;
  password: string;
  aadhaar: string | null;
  dob: string | null;
  dof: string | null;
  phone: string;
  email: string;
  address: string;
  gstNumber: string | null;
  userId: string;
  portalPassword: string;
  createdAt: string;
  updatedAt: string;
}

const clients: SeedClient[] = [
  {
    type: "INDIVIDUAL",
    name: "Aarav Sharma",
    pan: "ABCPS1234K",
    password: "Aarav@2024",
    aadhaar: "4821 6390 7752",
    dob: "12/03/1988",
    dof: null,
    phone: "+91 98450 11223",
    email: "aarav.sharma@gmail.com",
    address: "No. 42, 3rd Cross, Indiranagar, Bengaluru, Karnataka 560038",
    gstNumber: null,
    userId: "AARAVS88",
    portalPassword: "ITportal#88",
    createdAt: "2024-11-02",
    updatedAt: "2025-06-18",
  },
  {
    type: "COMPANY",
    name: "Meridian Textiles Pvt Ltd",
    pan: "AADCM5678P",
    password: "Merid!an#01",
    aadhaar: null,
    dob: null,
    dof: "21/07/2015",
    phone: "+91 80471 55210",
    email: "accounts@meridiantextiles.in",
    address: "Plot 18, Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058",
    gstNumber: "29AADCM5678P1ZQ",
    userId: "MERIDIAN15",
    portalPassword: "Gst@Merid2015",
    createdAt: "2024-09-14",
    updatedAt: "2025-07-01",
  },
  {
    type: "INDIVIDUAL",
    name: "Priya Nair",
    pan: "BXYPN9012Q",
    password: "Priya#nair7",
    aadhaar: "7290 1183 4460",
    dob: "05/09/1992",
    dof: null,
    phone: "+91 99001 78654",
    email: "priya.nair92@outlook.com",
    address: "Flat 7B, Brigade Gateway, Rajajinagar, Bengaluru, Karnataka 560055",
    gstNumber: null,
    userId: "PRIYAN92",
    portalPassword: "Nair@pass92",
    createdAt: "2025-01-20",
    updatedAt: "2025-05-30",
  },
  {
    type: "COMPANY",
    name: "Kaveri Constructions LLP",
    pan: "AAFCK3456R",
    password: "Kaveri$2019",
    aadhaar: null,
    dob: null,
    dof: "14/02/2019",
    phone: "+91 80293 44120",
    email: "finance@kavericonstructions.com",
    address: "Survey 91, Sarjapur Main Road, Bengaluru, Karnataka 560035",
    gstNumber: "29AAFCK3456R1Z8",
    userId: "KAVERI19",
    portalPassword: "Build@Kav19",
    createdAt: "2025-02-11",
    updatedAt: "2025-07-09",
  },
  {
    type: "INDIVIDUAL",
    name: "Rohan Iyer",
    pan: "CDEPI7890M",
    password: "Rohan!iyer3",
    aadhaar: "5514 8802 3971",
    dob: "28/11/1979",
    dof: null,
    phone: "+91 98860 33471",
    email: "rohan.iyer@protonmail.com",
    address: "221, Jayanagar 4th Block, Bengaluru, Karnataka 560011",
    gstNumber: null,
    userId: "ROHANI79",
    portalPassword: "Iyer#2024ok",
    createdAt: "2024-12-05",
    updatedAt: "2025-06-25",
  },
];

async function main() {
  console.log("🌱 Seeding Vittora database…");

  // Start clean so re-running the seed is idempotent.
  await prisma.client.deleteMany();

  for (const c of clients) {
    const created = await prisma.client.create({
      data: {
        type: c.type,
        name: c.name,
        pan: c.pan,
        password: c.password,
        aadhaar: c.aadhaar,
        dob: c.dob,
        dof: c.dof,
        phone: c.phone,
        email: c.email,
        address: c.address,
        gstNumber: c.gstNumber,
        userId: c.userId,
        portalPassword: c.portalPassword,
        aisPassword: generateAisPassword(c.pan, c.dob),
        createdAt: new Date(c.createdAt),
      },
    });
    // Set the historical "updated" timestamp with a raw update so the
    // dashboard's "recently updated" ordering looks realistic.
    await prisma.$executeRaw`UPDATE "Client" SET "updatedAt" = ${new Date(
      c.updatedAt,
    )} WHERE "id" = ${created.id}`;
  }

  const count = await prisma.client.count();
  console.log(`✅ Seeded ${count} clients.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
