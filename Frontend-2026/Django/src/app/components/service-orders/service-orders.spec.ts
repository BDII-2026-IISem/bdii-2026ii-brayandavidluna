import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Client, Equipment, ServiceOrder, Technician } from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService, UserProfile } from '../../services/auth';
import { ServiceOrdersComponent } from './service-orders';

describe('ServiceOrdersComponent', () => {
  registerLocaleData(localeEsCo);

  let component: ServiceOrdersComponent;
  let fixture: ComponentFixture<ServiceOrdersComponent>;
  let apiService: {
    getServiceOrders: ReturnType<typeof vi.fn>;
    getClients: ReturnType<typeof vi.fn>;
    getEquipment: ReturnType<typeof vi.fn>;
    getTechnicians: ReturnType<typeof vi.fn>;
    createServiceOrder: ReturnType<typeof vi.fn>;
  };
  const currentUser = signal<UserProfile | null>(null);
  const client: Client = {
    id: 1,
    documentType: 'CC',
    documentNumber: '123',
    name: 'Cliente de prueba',
    email: 'cliente@example.com',
    phone: '3000000000',
    address: null,
    isActive: 'ACTIVE',
    createdAt: '2026-11-02T10:00:00-05:00',
    updatedAt: '2026-11-02T10:00:00-05:00',
  };
  const equipment: Equipment = {
    id: 2,
    client: client.id,
    name: 'Aire de prueba',
    description: null,
    status: 'ACTIVE',
    createdAt: '2026-11-02T10:00:00-05:00',
    updatedAt: '2026-11-02T10:00:00-05:00',
  };
  const technician: Technician = {
    id: 3,
    name: 'Técnico de prueba',
    description: null,
    status: 'ACTIVE',
    createdAt: '2026-11-02T10:00:00-05:00',
    updatedAt: '2026-11-02T10:00:00-05:00',
  };
  const order: ServiceOrder = {
    id: 4,
    client: client.id,
    equipment: equipment.id,
    technician: technician.id,
    number: 'OS-2026-001',
    openedAt: '2026-11-02T10:00:00-05:00',
    closedAt: null,
    total: '0.00',
    status: 'ABIERTA',
    createdAt: '2026-11-02T10:00:00-05:00',
    updatedAt: '2026-11-02T10:00:00-05:00',
  };
  const adminUser: UserProfile = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'ClimaTec',
    roles: ['ADMIN'],
    createdAt: '2026-11-02T10:00:00-05:00',
  };

  beforeEach(async () => {
    currentUser.set(adminUser);
    apiService = {
      getServiceOrders: vi.fn(() => of([order])),
      getClients: vi.fn(() => of([client])),
      getEquipment: vi.fn(() => of([equipment])),
      getTechnicians: vi.fn(() => of([technician])),
      createServiceOrder: vi.fn(() => of(order)),
    };
    await TestBed.configureTestingModule({
      imports: [ServiceOrdersComponent],
      providers: [
        provideRouter([]),
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
    fixture = TestBed.createComponent(ServiceOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads orders and their related record names', () => {
    expect(component.orders()).toEqual([order]);
    expect(component.clientName(order.client)).toBe(client.name);
    expect(component.equipmentName(order.equipment)).toBe(equipment.name);
    expect(component.technicianName(order.technician)).toBe(technician.name);
    expect(fixture.nativeElement.textContent).toContain('OS-2026-001');
    expect(fixture.nativeElement.textContent).toContain('Cliente de prueba');
    expect(fixture.nativeElement.textContent).toContain('Aire de prueba');
    expect(fixture.nativeElement.textContent).toContain('Técnico de prueba');
    expect(fixture.nativeElement.querySelector('a[href="/service-orders/4"]')).toBeTruthy();
  });

  it('filters equipment to the selected client and resets the selection', () => {
    component.openCreateForm();
    component.orderForm.client = client.id;
    expect(component.availableEquipment).toEqual([equipment]);
    component.orderForm.equipment = equipment.id;
    component.onClientChange();
    expect(component.orderForm.equipment).toBeNull();
  });

  it('creates an order with related ids and a zoned opening timestamp', () => {
    component.openCreateForm();
    component.orderForm = {
      client: client.id,
      equipment: equipment.id,
      technician: technician.id,
      number: ' OS-2026-002 ',
    };

    component.saveServiceOrder();

    const [payload] = apiService.createServiceOrder.mock.calls[0];
    expect(payload).toEqual({
      client: client.id,
      equipment: equipment.id,
      technician: technician.id,
      number: 'OS-2026-002',
      openedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/),
    });
    expect(component.formVisible()).toBe(false);
    expect(component.successMessage()).toBe('Orden de servicio creada correctamente.');
    expect(apiService.getServiceOrders).toHaveBeenCalledTimes(2);
  });

  it('rejects a piece of equipment that is not active for the selected client', () => {
    component.openCreateForm();
    component.orderForm = {
      client: 99,
      equipment: equipment.id,
      technician: technician.id,
      number: 'OS-2026-002',
    };

    component.saveServiceOrder();

    expect(apiService.createServiceOrder).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('no pertenece al cliente indicado o está inactivo');
  });

  it('does not request technicians or show create actions to clients', async () => {
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });
    apiService.getTechnicians.mockClear();

    const clientFixture = TestBed.createComponent(ServiceOrdersComponent);
    clientFixture.detectChanges();
    await clientFixture.whenStable();
    clientFixture.detectChanges();

    expect(apiService.getTechnicians).not.toHaveBeenCalled();
    expect(clientFixture.nativeElement.textContent).not.toContain('Nueva orden');
    clientFixture.destroy();
  });
});
