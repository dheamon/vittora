export type ClientType = "INDIVIDUAL" | "COMPANY";

/** Client shape as serialized over the API (dates as ISO strings). */
export interface ClientDTO {
  id: string;
  type: ClientType;
  name: string;
  pan: string;
  password: string | null;
  aadhaar: string | null;
  dob: string | null;
  dof: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  userId: string | null;
  portalPassword: string | null;
  aisPassword: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SortKey = "name" | "pan" | "createdAt" | "updatedAt";
export type SortDir = "asc" | "desc";
export type TypeFilter = "all" | "individual" | "company";

export interface ClientListResponse {
  data: ClientDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: {
    total: number;
    individuals: number;
    companies: number;
    lastUpdated: { name: string; updatedAt: string } | null;
  };
}
