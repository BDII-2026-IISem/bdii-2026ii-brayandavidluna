import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import localeEsCo from '@angular/common/locales/es-CO';
import { SparePart } from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService, UserProfile } from '../../services/auth';
import { SparePartsComponent } from './spare-parts';

describe('SparePartsComponent', () => {
  registerLocaleData(localeEsCo);

  let component: SparePartsComponent;
  let fixture: ComponentFixture<SparePartsComponent>;
  let apiService: {
    getSpareParts: ReturnType<typeof vi.fn>;
    getAvailableSpareParts: ReturnType<typeof vi.fn>;
    createSparePart: ReturnType<typeof vi.fn>;
    updateSparePart: ReturnType<typeof vi.fn>;
  };
  const currentUser = signal<UserProfile | null>(null);
  const sparePart: SparePart = {
    id: 12,
    name: 'Compresor',
    description: 'Compresor de prueba',
    price: '125000.00',
    stock: 3,
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
      getSpareParts: vi.fn(() => of([sparePart])),
      getAvailableSpareParts: vi.fn(() => of([sparePart])),
      createSparePart: vi.fn(() => of(sparePart)),
      updateSparePart: vi.fn(() => of(sparePart)),
    };
    await TestBed.configureTestingModule({
      imports: [SparePartsComponent],
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
    fixture = TestBed.createComponent(SparePartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the inventory and identifies active spare parts with no stock', () => {
    expect(apiService.getSpareParts).toHaveBeenCalledOnce();
    expect(component.spareParts()).toEqual([sparePart]);
    expect(component.outOfStockCount()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Compresor');
  });

  it('creates a spare part with a two-decimal price and normalized description', () => {
    component.openCreateForm();
    component.sparePartForm = {
      name: ' Repuesto nuevo ',
      description: ' ',
      price: '12.5',
      stock: 0,
      status: 'ACTIVE',
    };

    component.saveSparePart();

    expect(apiService.createSparePart).toHaveBeenCalledWith({
      name: 'Repuesto nuevo',
      description: null,
      price: '12.50',
      stock: 0,
      status: 'ACTIVE',
    });
    expect(component.successMessage()).toBe('Repuesto creado correctamente.');
  });

  it('validates stock and price before creating a spare part', () => {
    component.openCreateForm();
    component.sparePartForm.name = 'Repuesto';
    component.sparePartForm.price = '0';
    component.saveSparePart();
    expect(apiService.createSparePart).not.toHaveBeenCalled();

    component.sparePartForm.price = '5.00';
    component.sparePartForm.stock = -1;
    component.saveSparePart();
    expect(apiService.createSparePart).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('entero igual o mayor que cero');
  });

  it('uses the available endpoint when the availability filter is selected', () => {
    component.toggleAvailabilityFilter();

    expect(apiService.getAvailableSpareParts).toHaveBeenCalledOnce();
    expect(component.onlyAvailable()).toBe(true);
  });

  it('confirms deactivation and uses PATCH instead of deleting a referenced spare part', () => {
    component.toggleSparePartStatus(sparePart);

    expect(apiService.updateSparePart).not.toHaveBeenCalled();
    expect(component.pendingStatusSparePartId()).toBe(sparePart.id);
    component.confirmStatusChange(sparePart);

    expect(apiService.updateSparePart).toHaveBeenCalledWith(sparePart.id, {
      status: 'INACTIVE',
    });
    expect(component.successMessage()).toBe('Repuesto desactivado correctamente.');
  });

  it('does not request inventory for a user without the admin role', () => {
    apiService.getSpareParts.mockClear();
    currentUser.set({ ...adminUser, roles: ['CLIENT'] });

    const restrictedFixture = TestBed.createComponent(SparePartsComponent);
    restrictedFixture.detectChanges();

    expect(apiService.getSpareParts).not.toHaveBeenCalled();
    expect(restrictedFixture.nativeElement.textContent).toContain(
      'Tu cuenta no tiene permiso para consultar el inventario.',
    );
    restrictedFixture.destroy();
  });
});
