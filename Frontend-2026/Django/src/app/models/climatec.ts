export type ActiveStatus = 'ACTIVE' | 'INACTIVE';

export type ClientDocumentType = 'CC' | 'CE' | 'NIT' | 'PP';

export interface Client {
  id: number;
  documentType: ClientDocumentType;
  documentNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  isActive: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export type ClientWritePayload = Pick<
  Client,
  | 'documentType'
  | 'documentNumber'
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'isActive'
>;

export interface Equipment {
  id: number;
  client: number;
  name: string;
  description: string | null;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentWritePayload = Pick<
  Equipment,
  'client' | 'name' | 'description' | 'status'
>;

export interface Technician {
  id: number;
  name: string;
  description: string | null;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export type TechnicianWritePayload = Pick<
  Technician,
  'name' | 'description' | 'status'
>;

export type ServiceOrderStatus =
  | 'ABIERTA'
  | 'DIAGNOSTICO'
  | 'COTIZADA'
  | 'APROBADA'
  | 'REPARACION'
  | 'CERRADA'
  | 'CANCELADA';

export interface ServiceOrder {
  id: number;
  client: number;
  equipment: number;
  technician: number;
  number: string;
  openedAt: string;
  closedAt: string | null;
  total: string;
  status: ServiceOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateServiceOrderPayload = Pick<
  ServiceOrder,
  'client' | 'equipment' | 'technician' | 'number' | 'openedAt'
> &
  Partial<Pick<ServiceOrder, 'closedAt' | 'total' | 'status'>>;

export interface Diagnosis {
  id: number;
  serviceOrder: number;
  technicianName: string;
  name: string;
  description: string;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export type DiagnosisWritePayload = Pick<
  Diagnosis,
  'serviceOrder' | 'name' | 'description' | 'status'
>;

export interface SparePart {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SparePartConsumption {
  id: number;
  serviceOrder: number;
  sparePart: number;
  technicianName: string;
  quantity: number;
  unitPrice: string;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export type SparePartConsumptionWritePayload = Pick<
  SparePartConsumption,
  'serviceOrder' | 'sparePart' | 'quantity' | 'unitPrice'
> &
  Partial<Pick<SparePartConsumption, 'status'>>;

export type SparePartWritePayload = Pick<
  SparePart,
  'name' | 'description' | 'price' | 'stock' | 'status'
>;

export type PaymentStatus = 'COMPLETADO' | 'PENDIENTE' | 'ANULADO';

export interface Payment {
  id: number;
  referenceType: string;
  referenceId: number;
  serviceOrder: number | null;
  registeredBy: number | null;
  method: string;
  amount: string;
  paymentDate: string;
  status: PaymentStatus;
  clientName: string | null;
  technicianName: string | null;
  registeredByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export type ApiCollection<T> = T[] | PaginatedResponse<T>;

export function getCollectionItems<T>(collection: ApiCollection<T>): T[] {
  return Array.isArray(collection) ? collection : collection.results ?? [];
}
