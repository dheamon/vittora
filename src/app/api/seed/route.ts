import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateAisPassword } from "@/lib/ais";

export const dynamic = "force-dynamic";

export async function GET() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return NextResponse.json(
      { message: "Database already seeded. Delete all users first to re-seed." },
      { status: 400 },
    );
  }

  const username = process.env.DEV_AUTH_USERNAME || "admin";
  const password = process.env.DEV_AUTH_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: { username, passwordHash, name: "Practice Admin", role: "ADMIN" },
  });

  const clients = [
    {
      type: "INDIVIDUAL" as const,
      name: "Aarav Sharma",
      pan: "ABCPS1234K",
      password: "Aarav@2024",
      aadhaar: "4821 6390 7752",
      dob: "12/03/1988",
      phone: "+91 98450 11223",
      email: "aarav.sharma@gmail.com",
      address: "No. 42, 3rd Cross, Indiranagar, Bengaluru, Karnataka 560038",
      userId: "AARAVS88",
      portalPassword: "ITportal#88",
    },
    {
      type: "COMPANY" as const,
      name: "Meridian Textiles Pvt Ltd",
      pan: "AADCM5678P",
      password: "Merid!an#01",
      dof: "21/07/2015",
      phone: "+91 80471 55210",
      email: "accounts@meridiantextiles.in",
      address: "Plot 18, Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058",
      gstNumber: "29AADCM5678P1ZQ",
      userId: "MERIDIAN15",
      portalPassword: "Gst@Merid2015",
    },
    {
      type: "INDIVIDUAL" as const,
      name: "Priya Nair",
      pan: "BXYPN9012Q",
      password: "Priya#nair7",
      aadhaar: "7290 1183 4460",
      dob: "05/09/1992",
      phone: "+91 99001 78654",
      email: "priya.nair92@outlook.com",
      address: "Flat 7B, Brigade Gateway, Rajajinagar, Bengaluru, Karnataka 560055",
      userId: "PRIYAN92",
      portalPassword: "Nair@pass92",
    },
    {
      type: "COMPANY" as const,
      name: "Kaveri Constructions LLP",
      pan: "AAFCK3456R",
      password: "Kaveri$2019",
      dof: "14/02/2019",
      phone: "+91 80293 44120",
      email: "finance@kavericonstructions.com",
      address: "Survey 91, Sarjapur Main Road, Bengaluru, Karnataka 560035",
      gstNumber: "29AAFCK3456R1Z8",
      userId: "KAVERI19",
      portalPassword: "Build@Kav19",
    },
    {
      type: "INDIVIDUAL" as const,
      name: "Rohan Iyer",
      pan: "CDEPI7890M",
      password: "Rohan!iyer3",
      aadhaar: "5514 8802 3971",
      dob: "28/11/1979",
      phone: "+91 98860 33471",
      email: "rohan.iyer@protonmail.com",
      address: "221, Jayanagar 4th Block, Bengaluru, Karnataka 560011",
      userId: "ROHANI79",
      portalPassword: "Iyer#2024ok",
    },
  ];

  let count = 0;
  for (const c of clients) {
    await prisma.client.create({
      data: {
        type: c.type,
        name: c.name,
        pan: c.pan,
        password: c.password,
        aadhaar: "aadhaar" in c ? c.aadhaar : null,
        dob: "dob" in c ? c.dob : null,
        dof: "dof" in c ? c.dof : null,
        phone: c.phone,
        email: c.email,
        address: c.address,
        gstNumber: "gstNumber" in c ? c.gstNumber : null,
        userId: c.userId,
        portalPassword: c.portalPassword,
        aisPassword: generateAisPassword(c.pan, "dob" in c ? c.dob : null),
        createdById: admin.id,
      },
    });
    count++;
  }

  return NextResponse.json({
    message: "Database seeded successfully",
    admin: { username, password },
    clientsCreated: count,
  });
}
