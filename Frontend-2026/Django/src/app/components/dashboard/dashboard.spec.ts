import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Client, Equipment, ServiceOrder, SparePart } from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService, UserProfile } from '../../services/auth';
import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let apiService: {
    getClients: ReturnType<typeof vi.fn>;
    getEquipment: ReturnType<typeof vi.fn>;
    getServiceOrders: ReturnType<typeof vi.fn>;
    getAvailableSpareParts: ReturnType<typeof vi.fn>;
  };
  const currentUser = signal<UserProfile | null>(null);
  const adminUser: UserProfile = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'ClimaTec',
    roles: ['ADMIN'],
    createdAt: '2026-11-02T10:00:00-05:00',
  };
  const clients: Client[] = [
    {
      id: 1,
      documentType: 'CC',
      documentNumber: '123',
      name: 'Cliente activo',
      email: 'cliente@example.com',
      phone: '3000000000',
      address: null,
      isActive: 'ACTIVE',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    },
    {
      id: 2,
      documentType: 'CC',
      documentNumber: '456',
      name: 'Cliente inactivo',
      email: 'inactivo@example.com',
      phone: '3000000001',
      address: null,
      isActive: 'INACTIVE',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    },
  ];
  const equipment: Equipment[] = [
    {
      id: 1,
      client: 1,
      name: 'Equipo activo',
      description: null,
      status: 'ACTIVE',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    },
  ];
  const orders: ServiceOrder[] = [
    {
      id: 1,
      client: 1,
      equipment: 1,
      technician: 1,
      number: 'OS-001',
      openedAt: '2026-11-02T10:00:00-05:00',
      closedAt: null,
      total: '0.00',
      status: 'ABIERTA',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    },
    {
      id: 2,
      client: 1,
      equipment: 1,
      technician: 1,
      number: 'OS-002',
      openedAt: '2026-11-02T10:00:00-05:00',
      closedAt: null,
      total: '0.00',
      status: 'CERRADA',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    },
    {
      id: 3,
      client: 1,
      equipment: 1,
      technician: 1,
      number: 'OS-003',
      openedAt: '2026-11-02T10:00:00-05:00',
      closedAt: null,
      total: '0.00',
      status: 'CANCELADA',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    },
  ];
  const spareParts: SparePart[] = [
    {
      id: 1,
      name: 'Repuesto disponible',
      description: null,
      price: '100.00',
      stock: 3,
      status: 'ACTIVE',
      createdAt: '2026-11-02T10:00:00-05:00',
      updatedAt: '2026-11-02T10:00:00-05:00',
    },
  ];

  beforeEach(async () => {
    currentUser.set(adminUser);
    apiService = {
      getClients: vi.fn(() => of(clients)),
      getEquipment: vi.fn(() => of(equipment)),
      getServiceOrders: vi.fn(() => of(orders)),
      getAvailableSpareParts: vi.fn(() => of(spareParts)),
    };
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
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
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows operational metrics calculated from live API collections', () => {
    expect(fixture.componentInstance.metrics()).toEqual({
      activeClients: 1,
      activeEquipment: 1,
      openOrders: 1,
      availableSpareParts: 1,
    });
    expect(fixture.nativeElement.textContent).toContain('Órdenes abiertas');
    expect(fixture.nativeElement.textContent).toContain('Repuestos disponibles');
  });

  it('does not request admin inventory data or show its metric to clients', async () => {
    apiService.getAvailableSpareParts.mockClear();
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });

    const clientFixture = TestBed.createComponent(DashboardComponent);
    clientFixture.detectChanges();
    await clientFixture.whenStable();
    clientFixture.detectChanges();

    expect(apiService.getAvailableSpareParts).not.toHaveBeenCalled();
    expect(clientFixture.nativeElement.textContent).not.toContain('Repuestos disponibles');
    clientFixture.destroy();
  });
});
