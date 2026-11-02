import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Client, Equipment } from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService, UserProfile } from '../../services/auth';
import { EquipmentComponent } from './equipment';

describe('EquipmentComponent', () => {
  let component: EquipmentComponent;
  let fixture: ComponentFixture<EquipmentComponent>;
  let apiService: {
    getEquipment: ReturnType<typeof vi.fn>;
    getClients: ReturnType<typeof vi.fn>;
    createEquipment: ReturnType<typeof vi.fn>;
    updateEquipment: ReturnType<typeof vi.fn>;
    deleteEquipment: ReturnType<typeof vi.fn>;
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
    id: 3,
    client: client.id,
    name: 'Aire acondicionado',
    description: 'Unidad de prueba',
    status: 'ACTIVE',
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
      getEquipment: vi.fn(() => of([equipment])),
      getClients: vi.fn(() => of([client])),
      createEquipment: vi.fn(() => of(equipment)),
      updateEquipment: vi.fn(() => of(equipment)),
      deleteEquipment: vi.fn(() => of(void 0)),
    };
    await TestBed.configureTestingModule({
      imports: [EquipmentComponent],
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
    fixture = TestBed.createComponent(EquipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads equipment and associates its client by name', () => {
    expect(component.equipmentList()).toEqual([equipment]);
    expect(component.clientName(client.id)).toBe(client.name);
    expect(fixture.nativeElement.textContent).toContain('Aire acondicionado');
    expect(fixture.nativeElement.textContent).toContain('Cliente de prueba');
    expect(fixture.nativeElement.textContent).toContain('Nuevo equipo');
  });

  it('creates an equipment with the selected client and normalized values', () => {
    component.openCreateForm();
    component.equipmentForm = {
      client: client.id,
      name: ' Aire nuevo ',
      description: ' ',
      status: 'ACTIVE',
    };

    component.saveEquipment();

    expect(apiService.createEquipment).toHaveBeenCalledWith({
      client: client.id,
      name: 'Aire nuevo',
      description: null,
      status: 'ACTIVE',
    });
    expect(component.successMessage()).toBe('Equipo creado correctamente.');
  });

  it('updates and confirms equipment deletion', () => {
    component.openEditForm(equipment);
    component.equipmentForm.name = 'Aire actualizado';
    component.saveEquipment();
    expect(apiService.updateEquipment).toHaveBeenCalledWith(
      equipment.id,
      expect.objectContaining({ name: 'Aire actualizado' }),
    );

    component.requestDelete(equipment);
    expect(apiService.deleteEquipment).not.toHaveBeenCalled();
    component.deleteEquipment(equipment);
    expect(apiService.deleteEquipment).toHaveBeenCalledWith(equipment.id);
    expect(component.successMessage()).toBe('Equipo eliminado correctamente.');
  });

  it('does not expose write actions to a read-only role', () => {
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });
    fixture.detectChanges();
    component.openCreateForm();
    component.requestDelete(equipment);
    component.saveEquipment();

    expect(component.canManageEquipment).toBe(false);
    expect(component.formVisible()).toBe(false);
    expect(component.pendingDeleteEquipmentId()).toBeNull();
    expect(apiService.createEquipment).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Nuevo equipo');
  });
});
