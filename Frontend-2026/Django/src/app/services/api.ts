import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ApiCollection,
  Client,
  ClientWritePayload,
  CreateServiceOrderPayload,
  Diagnosis,
  DiagnosisWritePayload,
  Equipment,
  EquipmentWritePayload,
  Payment,
  ServiceOrder,
  SparePart,
  SparePartConsumption,
  SparePartConsumptionWritePayload,
  SparePartWritePayload,
  Technician,
  TechnicianWritePayload,
} from '../models/climatec';
import {
  AdminResource,
  AdminRole,
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
  EffectivePermission,
  ResourceRoleGrant,
  ResourceRoleWritePayload,
  ResourceWritePayload,
  RoleUserAssignment,
  RoleUserWritePayload,
  RoleWritePayload,
} from '../models/rbac';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getServiceOrders(): Observable<ApiCollection<ServiceOrder>> {
    return this.http.get<ApiCollection<ServiceOrder>>(`${this.baseUrl}/service-orders/`);
  }

  getServiceOrder(id: number): Observable<ServiceOrder> {
    return this.http.get<ServiceOrder>(`${this.baseUrl}/service-orders/${id}/`);
  }

  createServiceOrder(data: CreateServiceOrderPayload): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(`${this.baseUrl}/service-orders/`, data);
  }

  getClients(): Observable<ApiCollection<Client>> {
    return this.http.get<ApiCollection<Client>>(`${this.baseUrl}/clients/`);
  }

  createClient(data: ClientWritePayload): Observable<Client> {
    return this.http.post<Client>(`${this.baseUrl}/clients/`, data);
  }

  updateClient(id: number, data: Partial<ClientWritePayload>): Observable<Client> {
    return this.http.patch<Client>(`${this.baseUrl}/clients/${id}/`, data);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clients/${id}/`).pipe(map(() => void 0));
  }

  getEquipment(): Observable<ApiCollection<Equipment>> {
    return this.http.get<ApiCollection<Equipment>>(`${this.baseUrl}/equipment/`);
  }

  createEquipment(data: EquipmentWritePayload): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.baseUrl}/equipment/`, data);
  }

  updateEquipment(id: number, data: Partial<EquipmentWritePayload>): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.baseUrl}/equipment/${id}/`, data);
  }

  deleteEquipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/equipment/${id}/`).pipe(map(() => void 0));
  }

  getTechnicians(): Observable<ApiCollection<Technician>> {
    return this.http.get<ApiCollection<Technician>>(`${this.baseUrl}/technicians/`);
  }

  createTechnician(data: TechnicianWritePayload): Observable<Technician> {
    return this.http.post<Technician>(`${this.baseUrl}/technicians/`, data);
  }

  updateTechnician(id: number, data: Partial<TechnicianWritePayload>): Observable<Technician> {
    return this.http.patch<Technician>(`${this.baseUrl}/technicians/${id}/`, data);
  }

  deleteTechnician(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/technicians/${id}/`).pipe(map(() => void 0));
  }

  getAvailableSpareParts(): Observable<ApiCollection<SparePart>> {
    return this.http.get<ApiCollection<SparePart>>(`${this.baseUrl}/spare-parts/available/`);
  }

  getSpareParts(): Observable<ApiCollection<SparePart>> {
    return this.http.get<ApiCollection<SparePart>>(`${this.baseUrl}/spare-parts/`);
  }

  createSparePart(data: SparePartWritePayload): Observable<SparePart> {
    return this.http.post<SparePart>(`${this.baseUrl}/spare-parts/`, data);
  }

  updateSparePart(id: number, data: Partial<SparePartWritePayload>): Observable<SparePart> {
    return this.http.patch<SparePart>(`${this.baseUrl}/spare-parts/${id}/`, data);
  }

  getDiagnoses(): Observable<ApiCollection<Diagnosis>> {
    return this.http.get<ApiCollection<Diagnosis>>(`${this.baseUrl}/diagnoses/`);
  }

  createDiagnosis(data: DiagnosisWritePayload): Observable<Diagnosis> {
    return this.http.post<Diagnosis>(`${this.baseUrl}/diagnoses/`, data);
  }

  updateDiagnosis(id: number, data: Partial<DiagnosisWritePayload>): Observable<Diagnosis> {
    return this.http.patch<Diagnosis>(`${this.baseUrl}/diagnoses/${id}/`, data);
  }

  getSparePartConsumptions(): Observable<ApiCollection<SparePartConsumption>> {
    return this.http.get<ApiCollection<SparePartConsumption>>(
      `${this.baseUrl}/spare-part-consumptions/`,
    );
  }

  createSparePartConsumption(
    data: SparePartConsumptionWritePayload,
  ): Observable<SparePartConsumption> {
    return this.http.post<SparePartConsumption>(`${this.baseUrl}/spare-part-consumptions/`, data);
  }

  updateSparePartConsumption(
    id: number,
    data: Partial<SparePartConsumptionWritePayload>,
  ): Observable<SparePartConsumption> {
    return this.http.patch<SparePartConsumption>(
      `${this.baseUrl}/spare-part-consumptions/${id}/`,
      data,
    );
  }

  getPayments(): Observable<ApiCollection<Payment>> {
    return this.http.get<ApiCollection<Payment>>(`${this.baseUrl}/payments/`);
  }

  getAdminUsers(): Observable<ApiCollection<AdminUser>> {
    return this.http.get<ApiCollection<AdminUser>>(`${this.baseUrl}/users/`);
  }

  createAdminUser(data: AdminUserCreatePayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseUrl}/users/`, data);
  }

  updateAdminUser(id: number, data: AdminUserUpdatePayload): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/users/${id}/`, data);
  }

  deleteAdminUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}/`).pipe(map(() => void 0));
  }

  getUserPermissions(id: number): Observable<{ permissions: EffectivePermission[] }> {
    return this.http.get<{ permissions: EffectivePermission[] }>(
      `${this.baseUrl}/users/${id}/permissions/`,
    );
  }

  getAdminRoles(): Observable<ApiCollection<AdminRole>> {
    return this.http.get<ApiCollection<AdminRole>>(`${this.baseUrl}/roles/`);
  }

  createAdminRole(data: RoleWritePayload): Observable<AdminRole> {
    return this.http.post<AdminRole>(`${this.baseUrl}/roles/`, data);
  }

  updateAdminRole(id: number, data: Partial<RoleWritePayload>): Observable<AdminRole> {
    return this.http.patch<AdminRole>(`${this.baseUrl}/roles/${id}/`, data);
  }

  deleteAdminRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}/`).pipe(map(() => void 0));
  }

  getResources(): Observable<ApiCollection<AdminResource>> {
    return this.http.get<ApiCollection<AdminResource>>(`${this.baseUrl}/resources/`);
  }

  createResource(data: ResourceWritePayload): Observable<AdminResource> {
    return this.http.post<AdminResource>(`${this.baseUrl}/resources/`, data);
  }

  updateResource(id: number, data: Partial<ResourceWritePayload>): Observable<AdminResource> {
    return this.http.patch<AdminResource>(`${this.baseUrl}/resources/${id}/`, data);
  }

  deleteResource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/resources/${id}/`).pipe(map(() => void 0));
  }

  getRoleUserAssignments(): Observable<ApiCollection<RoleUserAssignment>> {
    return this.http.get<ApiCollection<RoleUserAssignment>>(`${this.baseUrl}/role-users/`);
  }

  createRoleUserAssignment(data: RoleUserWritePayload): Observable<RoleUserAssignment> {
    return this.http.post<RoleUserAssignment>(`${this.baseUrl}/role-users/`, data);
  }

  updateRoleUserAssignment(
    id: number,
    data: Partial<RoleUserWritePayload>,
  ): Observable<RoleUserAssignment> {
    return this.http.patch<RoleUserAssignment>(`${this.baseUrl}/role-users/${id}/`, data);
  }

  deleteRoleUserAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/role-users/${id}/`).pipe(map(() => void 0));
  }

  getResourceRoleGrants(): Observable<ApiCollection<ResourceRoleGrant>> {
    return this.http.get<ApiCollection<ResourceRoleGrant>>(`${this.baseUrl}/resource-roles/`);
  }

  createResourceRoleGrant(data: ResourceRoleWritePayload): Observable<ResourceRoleGrant> {
    return this.http.post<ResourceRoleGrant>(`${this.baseUrl}/resource-roles/`, data);
  }

  updateResourceRoleGrant(
    id: number,
    data: Partial<ResourceRoleWritePayload>,
  ): Observable<ResourceRoleGrant> {
    return this.http.patch<ResourceRoleGrant>(`${this.baseUrl}/resource-roles/${id}/`, data);
  }

  deleteResourceRoleGrant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/resource-roles/${id}/`).pipe(map(() => void 0));
  }
}
