import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, UserProfile } from '../../services/auth';
import { ApiService } from '../../services/api';
import { Client } from '../../models/climatec';
import { ClientsComponent } from './clients';

describe('ClientsComponent', () => {
  let component: ClientsComponent;
  let fixture: ComponentFixture<ClientsComponent>;
  let apiService: {
    getClients: ReturnType<typeof vi.fn>;
    createClient: ReturnType<typeof vi.fn>;
    updateClient: ReturnType<typeof vi.fn>;
    deleteClient: ReturnType<typeof vi.fn>;
  };
  const currentUser = signal<UserProfile | null>(null);

  const client: Client = {
    id: 4,
    documentType: 'CC',
    documentNumber: '123456',
    name: 'Cliente de prueba',
    email: 'cliente@example.com',
    phone: '3000000000',
    address: null,
    isActive: 'ACTIVE',
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
      getClients: vi.fn(() => of([client])),
      createClient: vi.fn(() => of(client)),
      updateClient: vi.fn(() => of(client)),
      deleteClient: vi.fn(() => of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
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

    fixture = TestBed.createComponent(ClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the ClimaTec client list and exposes management actions to admins', () => {
    expect(component.clients()).toEqual([client]);
    expect(fixture.nativeElement.textContent).toContain('Cliente de prueba');
    expect(fixture.nativeElement.textContent).toContain('Nuevo cliente');
    expect(fixture.nativeElement.textContent).toContain('Editar');
    expect(fixture.nativeElement.textContent).toContain('Eliminar');
  });

  it('creates a client with normalized form data', () => {
    component.openCreateForm();
    component.clientForm = {
      documentType: 'CC',
      documentNumber: ' 123456 ',
      name: ' Nuevo cliente ',
      email: ' nuevo@example.com ',
      phone: ' 3000000000 ',
      address: ' ',
      isActive: 'ACTIVE',
    };

    component.saveClient();

    expect(apiService.createClient).toHaveBeenCalledWith({
      documentType: 'CC',
      documentNumber: '123456',
      name: 'Nuevo cliente',
      email: 'nuevo@example.com',
      phone: '3000000000',
      address: null,
      isActive: 'ACTIVE',
    });
    expect(component.formVisible()).toBe(false);
    expect(component.successMessage()).toBe('Cliente creado correctamente.');
  });

  it('updates the selected client and asks for confirmation before deleting', () => {
    component.openEditForm(client);
    component.clientForm.name = 'Cliente actualizado';
    component.saveClient();

    expect(apiService.updateClient).toHaveBeenCalledWith(
      client.id,
      expect.objectContaining({ name: 'Cliente actualizado' }),
    );

    component.requestDelete(client);
    expect(apiService.deleteClient).not.toHaveBeenCalled();
    component.cancelDelete();
    expect(component.pendingDeleteClientId()).toBeNull();

    component.requestDelete(client);
    component.deleteClient(client);
    expect(apiService.deleteClient).toHaveBeenCalledWith(client.id);
    expect(component.pendingDeleteClientId()).toBeNull();
    expect(component.successMessage()).toBe('Cliente eliminado correctamente.');
  });

  it('does not expose client write actions to a read-only client role', () => {
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });
    fixture.detectChanges();

    component.openCreateForm();
    component.requestDelete(client);
    component.saveClient();
    component.deleteClient(client);

    expect(component.canManageClients).toBe(false);
    expect(component.formVisible()).toBe(false);
    expect(component.pendingDeleteClientId()).toBeNull();
    expect(apiService.createClient).not.toHaveBeenCalled();
    expect(apiService.deleteClient).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Nuevo cliente');
    expect(fixture.nativeElement.textContent).not.toContain('Editar');
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar');
  });
});
