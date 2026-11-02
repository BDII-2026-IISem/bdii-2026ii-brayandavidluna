import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, UserProfile } from '../../services/auth';
import { ApiService } from '../../services/api';
import { Technician } from '../../models/climatec';
import { TechniciansComponent } from './technicians';

describe('TechniciansComponent', () => {
  let component: TechniciansComponent;
  let fixture: ComponentFixture<TechniciansComponent>;
  let apiService: {
    getTechnicians: ReturnType<typeof vi.fn>;
    createTechnician: ReturnType<typeof vi.fn>;
    updateTechnician: ReturnType<typeof vi.fn>;
    deleteTechnician: ReturnType<typeof vi.fn>;
  };
  const currentUser = signal<UserProfile | null>(null);
  const technician: Technician = {
    id: 2,
    name: 'Técnico de prueba',
    description: 'Mantenimiento',
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
      getTechnicians: vi.fn(() => of([technician])),
      createTechnician: vi.fn(() => of(technician)),
      updateTechnician: vi.fn(() => of(technician)),
      deleteTechnician: vi.fn(() => of(void 0)),
    };
    await TestBed.configureTestingModule({
      imports: [TechniciansComponent],
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
    fixture = TestBed.createComponent(TechniciansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads technicians and exposes management actions to admins', () => {
    expect(component.technicians()).toEqual([technician]);
    expect(fixture.nativeElement.textContent).toContain('Técnico de prueba');
    expect(fixture.nativeElement.textContent).toContain('Nuevo técnico');
    expect(fixture.nativeElement.textContent).toContain('Editar');
    expect(fixture.nativeElement.textContent).toContain('Eliminar');
  });

  it('creates a technician with normalized form data', () => {
    component.openCreateForm();
    component.technicianForm = {
      name: ' Técnico nuevo ',
      description: ' ',
      status: 'ACTIVE',
    };

    component.saveTechnician();

    expect(apiService.createTechnician).toHaveBeenCalledWith({
      name: 'Técnico nuevo',
      description: null,
      status: 'ACTIVE',
    });
    expect(component.successMessage()).toBe('Técnico creado correctamente.');
  });

  it('updates and confirms technician deletion', () => {
    component.openEditForm(technician);
    component.technicianForm.name = 'Técnico actualizado';
    component.saveTechnician();
    expect(apiService.updateTechnician).toHaveBeenCalledWith(
      technician.id,
      expect.objectContaining({ name: 'Técnico actualizado' }),
    );

    component.requestDelete(technician);
    expect(apiService.deleteTechnician).not.toHaveBeenCalled();
    component.deleteTechnician(technician);
    expect(apiService.deleteTechnician).toHaveBeenCalledWith(technician.id);
    expect(component.successMessage()).toBe('Técnico eliminado correctamente.');
  });

  it('does not expose write actions to a read-only role', () => {
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });
    fixture.detectChanges();
    component.openCreateForm();
    component.requestDelete(technician);
    component.saveTechnician();

    expect(component.canManageTechnicians).toBe(false);
    expect(component.formVisible()).toBe(false);
    expect(component.pendingDeleteTechnicianId()).toBeNull();
    expect(apiService.createTechnician).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Nuevo técnico');
    expect(fixture.nativeElement.textContent).not.toContain('Editar');
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar');
  });

  it('does not request technicians for a read-only role', async () => {
    apiService.getTechnicians.mockClear();
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });

    const restrictedFixture = TestBed.createComponent(TechniciansComponent);
    restrictedFixture.detectChanges();
    await restrictedFixture.whenStable();
    restrictedFixture.detectChanges();

    expect(apiService.getTechnicians).not.toHaveBeenCalled();
    expect(restrictedFixture.nativeElement.textContent).toContain(
      'Tu cuenta no tiene permiso para consultar técnicos.',
    );
    restrictedFixture.destroy();
  });
});
