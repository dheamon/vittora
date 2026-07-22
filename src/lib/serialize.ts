import type { Client, User, ClientUser } from "@prisma/client";
import type { ClientDTO } from "./types";

type ClientWithRelations = Client & {
  createdBy?: User | null;
  assignedUsers?: (ClientUser & { user?: User })[];
};

export function serializeClient(c: ClientWithRelations): ClientDTO {
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
    createdById: c.createdById,
    createdByName: c.createdBy?.name ?? null,
    assignedUserIds: c.assignedUsers?.map((a) => a.userId) ?? [],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
