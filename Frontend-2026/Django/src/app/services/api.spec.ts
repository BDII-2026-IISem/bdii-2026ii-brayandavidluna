import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ApiCollection,
  Client,
  CreateServiceOrderPayload,
  Diagnosis,
  DiagnosisWritePayload,
  Equipment,
  EquipmentWritePayload,
  getCollectionItems,
  ServiceOrder,
  SparePart,
  SparePartConsumption,
  SparePartConsumptionWritePayload,
  SparePartWritePayload,
  Technician,
  TechnicianWritePayload,
} from '../models/climatec';
import { ApiService } from './api';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('uses the ClimaTec API routes for every list resource', async () => {
    const expectGet = async <T>(
      response: Observable<ApiCollection<T>>,
      url: string,
    ): Promise<void> => {
      const result = firstValueFrom(response);
      const request = http.expectOne(url);
      expect(request.request.method).toBe('GET');
      request.flush([]);
      await expect(result).resolves.toEqual([]);
    };

    await expectGet(service.getServiceOrders(), '/api/v1/service-orders/');
    await expectGet(service.getClients(), '/api/v1/clients/');
    await expectGet(service.getEquipment(), '/api/v1/equipment/');
    await expectGet(service.getTechnicians(), '/api/v1/technicians/');
    await expectGet(service.getAvailableSpareParts(), '/api/v1/spare-parts/available/');
    await expectGet(service.getSpareParts(), '/api/v1/spare-parts/');
    await expectGet(service.getDiagnoses(), '/api/v1/diagnoses/');
    await expectGet(service.getSparePartConsumptions(), '/api/v1/spare-part-consumptions/');
    await expectGet(service.getPayments(), '/api/v1/payments/');
  });

  it('creates a service order with the typed payload', async () => {
    const payload: CreateServiceOrderPayload = {
      client: 3,
      equipment: 5,
      technician: 2,
      number: 'OS-2026-001',
      openedAt: '2026-11-02T10:00:00-05:00',
    };
    const order: ServiceOrder = {
      ...payload,
      id: 8,
      closedAt: null,
      total: '0.00',
      status: 'ABIERTA',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    };

    const result = firstValueFrom(service.createServiceOrder(payload));
    const request = http.expectOne('/api/v1/service-orders/');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(order);

    await expect(result).resolves.toEqual(order);
  });

  it('loads one service order and writes its diagnosis and part consumption', async () => {
    const order: ServiceOrder = {
      id: 8,
      client: 3,
      equipment: 5,
      technician: 2,
      number: 'OS-2026-001',
      openedAt: '2026-11-02T10:00:00-05:00',
      closedAt: null,
      total: '0.00',
      status: 'ABIERTA',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    };
    const orderResult = firstValueFrom(service.getServiceOrder(order.id));
    const orderRequest = http.expectOne('/api/v1/service-orders/8/');
    expect(orderRequest.request.method).toBe('GET');
    orderRequest.flush(order);
    await expect(orderResult).resolves.toEqual(order);

    const diagnosisPayload: DiagnosisWritePayload = {
      serviceOrder: order.id,
      name: 'Falla de compresor',
      description: 'Se detectó pérdida de presión.',
      status: 'ACTIVE',
    };
    const diagnosis: Diagnosis = {
      ...diagnosisPayload,
      id: 20,
      technicianName: 'Técnico',
      createdAt: order.openedAt,
      updatedAt: order.openedAt,
    };
    const diagnosisResult = firstValueFrom(service.createDiagnosis(diagnosisPayload));
    const diagnosisRequest = http.expectOne('/api/v1/diagnoses/');
    expect(diagnosisRequest.request.method).toBe('POST');
    expect(diagnosisRequest.request.body).toEqual(diagnosisPayload);
    diagnosisRequest.flush(diagnosis);
    await expect(diagnosisResult).resolves.toEqual(diagnosis);

    const consumptionPayload: SparePartConsumptionWritePayload = {
      serviceOrder: order.id,
      sparePart: 12,
      quantity: 2,
      unitPrice: '125000.00',
    };
    const consumption: SparePartConsumption = {
      ...consumptionPayload,
      id: 24,
      technicianName: 'Técnico',
      status: 'ACTIVE',
      createdAt: order.openedAt,
      updatedAt: order.openedAt,
    };
    const consumptionResult = firstValueFrom(
      service.createSparePartConsumption(consumptionPayload),
    );
    const consumptionRequest = http.expectOne('/api/v1/spare-part-consumptions/');
    expect(consumptionRequest.request.method).toBe('POST');
    expect(consumptionRequest.request.body).toEqual(consumptionPayload);
    consumptionRequest.flush(consumption);
    await expect(consumptionResult).resolves.toEqual(consumption);

    const updateResult = firstValueFrom(
      service.updateSparePartConsumption(consumption.id, {
        status: 'INACTIVE',
      }),
    );
    const updateRequest = http.expectOne('/api/v1/spare-part-consumptions/24/');
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ status: 'INACTIVE' });
    updateRequest.flush({ ...consumption, status: 'INACTIVE' });
    await expect(updateResult).resolves.toMatchObject({ status: 'INACTIVE' });
  });

  it('creates, updates, and deletes clients through their REST routes', async () => {
    const payload = {
      documentType: 'CC' as const,
      documentNumber: '123456',
      name: 'Cliente de prueba',
      email: 'cliente@example.com',
      phone: '3000000000',
      address: null,
      isActive: 'ACTIVE' as const,
    };
    const client = {
      ...payload,
      id: 4,
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    };

    const createResult = firstValueFrom(service.createClient(payload));
    const createRequest = http.expectOne('/api/v1/clients/');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush(client);
    await expect(createResult).resolves.toEqual(client);

    const updateResult = firstValueFrom(
      service.updateClient(client.id, { name: 'Cliente actualizado' }),
    );
    const updateRequest = http.expectOne('/api/v1/clients/4/');
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({
      name: 'Cliente actualizado',
    });
    updateRequest.flush({ ...client, name: 'Cliente actualizado' });
    await expect(updateResult).resolves.toMatchObject({
      name: 'Cliente actualizado',
    });

    const deleteResult = firstValueFrom(service.deleteClient(client.id));
    const deleteRequest = http.expectOne('/api/v1/clients/4/');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deleteResult).resolves.toBeUndefined();
  });

  it('creates, updates, and deletes equipment and technicians through REST routes', async () => {
    const equipmentPayload: EquipmentWritePayload = {
      client: 4,
      name: 'Aire acondicionado',
      description: null,
      status: 'ACTIVE',
    };
    const equipment: Equipment = {
      ...equipmentPayload,
      id: 8,
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    };
    const createEquipmentResult = firstValueFrom(service.createEquipment(equipmentPayload));
    const createEquipmentRequest = http.expectOne('/api/v1/equipment/');
    expect(createEquipmentRequest.request.method).toBe('POST');
    expect(createEquipmentRequest.request.body).toEqual(equipmentPayload);
    createEquipmentRequest.flush(equipment);
    await expect(createEquipmentResult).resolves.toEqual(equipment);

    const updateEquipmentResult = firstValueFrom(
      service.updateEquipment(equipment.id, { name: 'Aire actualizado' }),
    );
    const updateEquipmentRequest = http.expectOne('/api/v1/equipment/8/');
    expect(updateEquipmentRequest.request.method).toBe('PATCH');
    updateEquipmentRequest.flush({ ...equipment, name: 'Aire actualizado' });
    await expect(updateEquipmentResult).resolves.toMatchObject({
      name: 'Aire actualizado',
    });

    const deleteEquipmentResult = firstValueFrom(service.deleteEquipment(equipment.id));
    const deleteEquipmentRequest = http.expectOne('/api/v1/equipment/8/');
    expect(deleteEquipmentRequest.request.method).toBe('DELETE');
    deleteEquipmentRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deleteEquipmentResult).resolves.toBeUndefined();

    const technicianPayload: TechnicianWritePayload = {
      name: 'Técnico de prueba',
      description: null,
      status: 'ACTIVE',
    };
    const technician: Technician = {
      ...technicianPayload,
      id: 6,
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    };
    const createTechnicianResult = firstValueFrom(service.createTechnician(technicianPayload));
    const createTechnicianRequest = http.expectOne('/api/v1/technicians/');
    expect(createTechnicianRequest.request.method).toBe('POST');
    expect(createTechnicianRequest.request.body).toEqual(technicianPayload);
    createTechnicianRequest.flush(technician);
    await expect(createTechnicianResult).resolves.toEqual(technician);

    const updateTechnicianResult = firstValueFrom(
      service.updateTechnician(technician.id, { name: 'Técnico actualizado' }),
    );
    const updateTechnicianRequest = http.expectOne('/api/v1/technicians/6/');
    expect(updateTechnicianRequest.request.method).toBe('PATCH');
    updateTechnicianRequest.flush({
      ...technician,
      name: 'Técnico actualizado',
    });
    await expect(updateTechnicianResult).resolves.toMatchObject({
      name: 'Técnico actualizado',
    });

    const deleteTechnicianResult = firstValueFrom(service.deleteTechnician(technician.id));
    const deleteTechnicianRequest = http.expectOne('/api/v1/technicians/6/');
    expect(deleteTechnicianRequest.request.method).toBe('DELETE');
    deleteTechnicianRequest.flush(null, {
      status: 204,
      statusText: 'No Content',
    });
    await expect(deleteTechnicianResult).resolves.toBeUndefined();
  });

  it('creates and updates spare parts and uses the available-only route', async () => {
    const payload: SparePartWritePayload = {
      name: 'Compresor',
      description: 'Compresor de prueba',
      price: '125000.00',
      stock: 3,
      status: 'ACTIVE',
    };
    const sparePart: SparePart = {
      ...payload,
      id: 12,
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    };

    const createResult = firstValueFrom(service.createSparePart(payload));
    const createRequest = http.expectOne('/api/v1/spare-parts/');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush(sparePart);
    await expect(createResult).resolves.toEqual(sparePart);

    const updateResult = firstValueFrom(service.updateSparePart(sparePart.id, { stock: 0 }));
    const updateRequest = http.expectOne('/api/v1/spare-parts/12/');
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ stock: 0 });
    updateRequest.flush({ ...sparePart, stock: 0 });
    await expect(updateResult).resolves.toMatchObject({ stock: 0 });

    const availableResult = firstValueFrom(service.getAvailableSpareParts());
    const availableRequest = http.expectOne('/api/v1/spare-parts/available/');
    expect(availableRequest.request.method).toBe('GET');
    availableRequest.flush([sparePart]);
    await expect(availableResult).resolves.toEqual([sparePart]);
  });

  it('uses the RBAC administration routes and effective-permission endpoint', async () => {
    const expectGet = async <T>(
      response: Observable<ApiCollection<T>>,
      url: string,
    ): Promise<void> => {
      const result = firstValueFrom(response);
      const request = http.expectOne(url);
      expect(request.request.method).toBe('GET');
      request.flush([]);
      await expect(result).resolves.toEqual([]);
    };
    await expectGet(service.getAdminUsers(), '/api/v1/users/');
    await expectGet(service.getAdminRoles(), '/api/v1/roles/');
    await expectGet(service.getResources(), '/api/v1/resources/');
    await expectGet(service.getRoleUserAssignments(), '/api/v1/role-users/');
    await expectGet(service.getResourceRoleGrants(), '/api/v1/resource-roles/');

    const permissions = firstValueFrom(service.getUserPermissions(7));
    const permissionsRequest = http.expectOne('/api/v1/users/7/permissions/');
    expect(permissionsRequest.request.method).toBe('GET');
    permissionsRequest.flush({ permissions: [] });
    await expect(permissions).resolves.toEqual({ permissions: [] });

    const userPayload = {
      username: 'rbac-user',
      email: 'rbac@example.com',
      firstName: 'RBAC',
      lastName: 'User',
      isActive: true,
      password: 'secure-test-password',
    };
    const user = { ...userPayload, id: 7, createdAt: '', updatedAt: '' };
    const createUser = firstValueFrom(service.createAdminUser(userPayload));
    const createUserRequest = http.expectOne('/api/v1/users/');
    expect(createUserRequest.request.method).toBe('POST');
    createUserRequest.flush(user);
    await expect(createUser).resolves.toEqual(user);

    const updateUser = firstValueFrom(service.updateAdminUser(7, { firstName: 'Updated' }));
    const updateUserRequest = http.expectOne('/api/v1/users/7/');
    expect(updateUserRequest.request.method).toBe('PATCH');
    updateUserRequest.flush({ ...user, firstName: 'Updated' });
    await expect(updateUser).resolves.toMatchObject({ firstName: 'Updated' });

    const role = { id: 3, name: 'AUDITOR', description: null };
    const createRole = firstValueFrom(
      service.createAdminRole({ name: role.name, description: role.description }),
    );
    const createRoleRequest = http.expectOne('/api/v1/roles/');
    expect(createRoleRequest.request.method).toBe('POST');
    createRoleRequest.flush(role);
    await expect(createRole).resolves.toEqual(role);

    const updateRole = firstValueFrom(service.updateAdminRole(3, { description: 'Updated role' }));
    const updateRoleRequest = http.expectOne('/api/v1/roles/3/');
    expect(updateRoleRequest.request.method).toBe('PATCH');
    updateRoleRequest.flush({ ...role, description: 'Updated role' });
    await expect(updateRole).resolves.toMatchObject({
      description: 'Updated role',
    });

    const resource = {
      id: 8,
      method: 'GET',
      path: '/api/v1/clients/',
      description: 'List clients',
    };
    const createResource = firstValueFrom(
      service.createResource({
        method: resource.method,
        path: resource.path,
        description: resource.description,
      }),
    );
    const createResourceRequest = http.expectOne('/api/v1/resources/');
    expect(createResourceRequest.request.method).toBe('POST');
    createResourceRequest.flush(resource);
    await expect(createResource).resolves.toEqual(resource);

    const updateResource = firstValueFrom(
      service.updateResource(8, { description: 'Updated resource' }),
    );
    const updateResourceRequest = http.expectOne('/api/v1/resources/8/');
    expect(updateResourceRequest.request.method).toBe('PATCH');
    updateResourceRequest.flush({
      ...resource,
      description: 'Updated resource',
    });
    await expect(updateResource).resolves.toMatchObject({
      description: 'Updated resource',
    });

    const roleUser = { id: 2, user: 7, role: 3 };
    const createRoleUser = firstValueFrom(service.createRoleUserAssignment({ user: 7, role: 3 }));
    const createRoleUserRequest = http.expectOne('/api/v1/role-users/');
    expect(createRoleUserRequest.request.method).toBe('POST');
    createRoleUserRequest.flush(roleUser);
    await expect(createRoleUser).resolves.toEqual(roleUser);

    const updateRoleUser = firstValueFrom(service.updateRoleUserAssignment(2, { role: 4 }));
    const updateRoleUserRequest = http.expectOne('/api/v1/role-users/2/');
    expect(updateRoleUserRequest.request.method).toBe('PATCH');
    updateRoleUserRequest.flush({ ...roleUser, role: 4 });
    await expect(updateRoleUser).resolves.toMatchObject({ role: 4 });

    const resourceRole = { id: 9, resource: 8, role: 3 };
    const createGrant = firstValueFrom(service.createResourceRoleGrant({ resource: 8, role: 3 }));
    const createGrantRequest = http.expectOne('/api/v1/resource-roles/');
    expect(createGrantRequest.request.method).toBe('POST');
    createGrantRequest.flush(resourceRole);
    await expect(createGrant).resolves.toEqual(resourceRole);

    const updateGrant = firstValueFrom(service.updateResourceRoleGrant(9, { role: 4 }));
    const updateGrantRequest = http.expectOne('/api/v1/resource-roles/9/');
    expect(updateGrantRequest.request.method).toBe('PATCH');
    updateGrantRequest.flush({ ...resourceRole, role: 4 });
    await expect(updateGrant).resolves.toMatchObject({ role: 4 });

    const deleteResults = [
      service.deleteAdminUser(7),
      service.deleteAdminRole(3),
      service.deleteResource(8),
      service.deleteRoleUserAssignment(2),
      service.deleteResourceRoleGrant(9),
    ];
    const deleteUrls = [
      '/api/v1/users/7/',
      '/api/v1/roles/3/',
      '/api/v1/resources/8/',
      '/api/v1/role-users/2/',
      '/api/v1/resource-roles/9/',
    ];
    for (const [index, response] of deleteResults.entries()) {
      const result = firstValueFrom(response);
      const request = http.expectOne(deleteUrls[index]);
      expect(request.request.method).toBe('DELETE');
      request.flush(null, { status: 204, statusText: 'No Content' });
      await expect(result).resolves.toBeUndefined();
    }
  });

  it('normalizes plain and paginated API collections', () => {
    const client: Client = {
      id: 1,
      documentType: 'CC',
      documentNumber: '123',
      name: 'Cliente',
      email: 'cliente@example.com',
      phone: '3000000000',
      address: null,
      isActive: 'ACTIVE',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    };
    const plainCollection: ApiCollection<Client> = [client];
    const paginatedCollection: ApiCollection<Client> = {
      count: 1,
      next: null,
      previous: null,
      results: [client],
    };

    expect(getCollectionItems(plainCollection)).toEqual([client]);
    expect(getCollectionItems(paginatedCollection)).toEqual([client]);
  });
});
