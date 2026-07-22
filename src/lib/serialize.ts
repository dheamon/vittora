import type { Client } from "@prisma/client";
import type { ClientDTO } from "./types";

export function serializeClient(c: Client): ClientDTO {
  return {
    id: c.id,
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
    aisPassword: c.aisPassword,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
