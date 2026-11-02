import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import {
  Client,
  Diagnosis,
  Equipment,
  ServiceOrder,
  SparePart,
  SparePartConsumption,
  Technician,
} from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService, UserProfile } from '../../services/auth';
import { ServiceOrderDetailComponent } from './service-order-detail';

describe('ServiceOrderDetailComponent', () => {
  registerLocaleData(localeEsCo);

  let component: ServiceOrderDetailComponent;
  let fixture: ComponentFixture<ServiceOrderDetailComponent>;
  let apiService: {
    getServiceOrder: ReturnType<typeof vi.fn>;
    getClients: ReturnType<typeof vi.fn>;
    getEquipment: ReturnType<typeof vi.fn>;
    getTechnicians: ReturnType<typeof vi.fn>;
    getDiagnoses: ReturnType<typeof vi.fn>;
    getSparePartConsumptions: ReturnType<typeof vi.fn>;
    getSpareParts: ReturnType<typeof vi.fn>;
    createDiagnosis: ReturnType<typeof vi.fn>;
    updateDiagnosis: ReturnType<typeof vi.fn>;
    createSparePartConsumption: ReturnType<typeof vi.fn>;
    updateSparePartConsumption: ReturnType<typeof vi.fn>;
  };
  const currentUser = signal<UserProfile | null>(null);
  const order: ServiceOrder = {
    id: 8,
    client: 3,
    equipment: 5,
    technician: 2,
    number: 'OS-2026-001',
    openedAt: '2026-11-02T10:00:00-05:00',
    closedAt: null,
    total: '125000.00',
    status: 'DIAGNOSTICO',
    createdAt: '2026-11-02T10:00:00-05:00',
    updatedAt: '2026-11-02T10:00:00-05:00',
  };
  const client: Client = {
    id: order.client,
    documentType: 'CC',
    documentNumber: '123',
    name: 'Cliente de prueba',
    email: 'cliente@example.com',
    phone: '3000000000',
    address: null,
    isActive: 'ACTIVE',
    createdAt: order.openedAt,
    updatedAt: order.openedAt,
  };
  const equipment: Equipment = {
    id: order.equipment,
    client: order.client,
    name: 'Aire de prueba',
    description: null,
    status: 'ACTIVE',
    createdAt: order.openedAt,
    updatedAt: order.openedAt,
  };
  const technician: Technician = {
    id: order.technician,
    name: 'Técnico de prueba',
    description: null,
    status: 'ACTIVE',
    createdAt: order.openedAt,
    updatedAt: order.openedAt,
  };
  const diagnosis: Diagnosis = {
    id: 20,
    serviceOrder: order.id,
    technicianName: 'Técnico de prueba',
    name: 'Falla del compresor',
    description: 'Presión insuficiente.',
    status: 'ACTIVE',
    createdAt: order.openedAt,
    updatedAt: order.openedAt,
  };
  const consumption: SparePartConsumption = {
    id: 24,
    serviceOrder: order.id,
    sparePart: 12,
    technicianName: 'Técnico de prueba',
    quantity: 1,
    unitPrice: '125000.00',
    status: 'ACTIVE',
    createdAt: order.openedAt,
    updatedAt: order.openedAt,
  };
  const sparePart: SparePart = {
    id: consumption.sparePart,
    name: 'Compresor',
    description: 'Compresor de prueba',
    price: '125000.00',
    stock: 3,
    status: 'ACTIVE',
    createdAt: order.openedAt,
    updatedAt: order.openedAt,
  };
  const adminUser: UserProfile = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'ClimaTec',
    roles: ['ADMIN'],
    createdAt: order.openedAt,
  };

  beforeEach(async () => {
    currentUser.set(adminUser);
    apiService = {
      getServiceOrder: vi.fn(() => of(order)),
      getClients: vi.fn(() => of([client])),
      getEquipment: vi.fn(() => of([equipment])),
      getTechnicians: vi.fn(() => of([technician])),
      getDiagnoses: vi.fn(() => of([diagnosis])),
      getSparePartConsumptions: vi.fn(() => of([consumption])),
      getSpareParts: vi.fn(() => of([sparePart])),
      createDiagnosis: vi.fn(() => of(diagnosis)),
      updateDiagnosis: vi.fn(() => of(diagnosis)),
      createSparePartConsumption: vi.fn(() => of(consumption)),
      updateSparePartConsumption: vi.fn(() => of(consumption)),
    };
    await TestBed.configureTestingModule({
      imports: [ServiceOrderDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => String(order.id) } } },
        },
        { provide: ApiService, useValue: apiService },
        {
          provide: AuthService,
          useValue: {
            currentUser,
            hasPermission: () => currentUser()?.roles.includes('ADMIN') ?? false,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the selected order and only its related diagnosis and consumption', () => {
    apiService.getDiagnoses.mockReturnValue(
      of([diagnosis, { ...diagnosis, id: 21, serviceOrder: 99 }]),
    );
    apiService.getSpareParts.mockReturnValue(of([{ ...sparePart, stock: 0 }]));
    component.loadDetails();

    expect(component.order()).toEqual(order);
    expect(component.clientName(order.client)).toBe(client.name);
    expect(component.equipmentName(order.equipment)).toBe(equipment.name);
    expect(component.technicianName(order.technician)).toBe(technician.name);
    expect(component.diagnoses()).toEqual([diagnosis]);
    expect(component.consumptions()).toEqual([consumption]);
    expect(component.sparePartName(consumption.sparePart)).toBe(sparePart.name);
    expect(component.availableSpareParts()).toEqual([]);
    expect(component.consumptionSubtotal(consumption)).toBe(125000);
  });

  it('creates a normalized diagnosis for this order', () => {
    component.openDiagnosisForm();
    component.diagnosisForm = {
      name: '  Revisión eléctrica ',
      description: '  Se revisaron conexiones.  ',
    };

    component.saveDiagnosis();

    expect(apiService.createDiagnosis).toHaveBeenCalledWith({
      serviceOrder: order.id,
      name: 'Revisión eléctrica',
      description: 'Se revisaron conexiones.',
      status: 'ACTIVE',
    });
    expect(component.successMessage()).toBe('Diagnóstico registrado correctamente.');
    expect(apiService.getServiceOrder).toHaveBeenCalledTimes(2);
  });

  it('validates stock and records the current unit price for a consumption', () => {
    component.openConsumptionForm();
    component.consumptionForm = { sparePart: sparePart.id, quantity: 4 };
    component.saveConsumption();

    expect(apiService.createSparePartConsumption).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('dentro de sus existencias');

    component.consumptionForm.quantity = 2;
    component.saveConsumption();

    expect(apiService.createSparePartConsumption).toHaveBeenCalledWith({
      serviceOrder: order.id,
      sparePart: sparePart.id,
      quantity: 2,
      unitPrice: sparePart.price,
    });
    expect(component.successMessage()).toBe('Consumo de repuesto registrado correctamente.');
  });

  it('requires explicit confirmation and deactivates consumption through PATCH', () => {
    component.requestConsumptionStatusChange(consumption);

    expect(apiService.updateSparePartConsumption).not.toHaveBeenCalled();
    component.confirmConsumptionStatusChange(consumption);

    expect(apiService.updateSparePartConsumption).toHaveBeenCalledWith(consumption.id, {
      status: 'INACTIVE',
    });
    expect(component.successMessage()).toContain('inventario fue restaurado');
  });

  it('keeps details read-only and avoids admin inventory calls for clients', async () => {
    apiService.getSpareParts.mockClear();
    apiService.getTechnicians.mockClear();
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });

    const clientFixture = TestBed.createComponent(ServiceOrderDetailComponent);
    clientFixture.detectChanges();
    await clientFixture.whenStable();
    clientFixture.detectChanges();

    expect(apiService.getSpareParts).not.toHaveBeenCalled();
    expect(apiService.getTechnicians).not.toHaveBeenCalled();
    expect(clientFixture.nativeElement.textContent).not.toContain('Nuevo diagnóstico');
    expect(clientFixture.nativeElement.textContent).not.toContain('Nuevo consumo');
    clientFixture.destroy();
  });
});
