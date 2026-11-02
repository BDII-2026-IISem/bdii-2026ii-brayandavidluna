import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import {
  ActiveStatus,
  getCollectionItems,
  SparePart,
  SparePartWritePayload,
} from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-spare-parts',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TableModule],
  templateUrl: './spare-parts.html',
})
export class SparePartsComponent implements OnInit {
  readonly spareParts = signal<SparePart[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formVisible = signal(false);
  readonly onlyAvailable = signal(false);
  readonly searchTerm = signal('');
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingSparePartId = signal<number | null>(null);
  readonly pendingStatusSparePartId = signal<number | null>(null);

  readonly filteredSpareParts = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    return this.spareParts().filter(
      (part) =>
        !term ||
        part.name.toLocaleLowerCase().includes(term) ||
        part.description?.toLocaleLowerCase().includes(term),
    );
  });
  readonly outOfStockCount = computed(
    () => this.spareParts().filter((part) => part.stock === 0).length,
  );

  readonly activeStatuses: { value: ActiveStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ];

  sparePartForm: SparePartWritePayload = this.emptySparePartForm();

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  get canManageSpareParts(): boolean {
    return (
      this.authService.hasPermission('POST', '/api/v1/spare-parts/') &&
      this.authService.hasPermission('PATCH', '/api/v1/spare-parts/0/')
    );
  }

  get canViewSpareParts(): boolean {
    return this.authService.hasPermission('GET', '/api/v1/spare-parts/');
  }

  ngOnInit(): void {
    if (!this.canViewSpareParts) {
      this.errorMessage.set('Tu cuenta no tiene permiso para consultar el inventario.');
      this.loading.set(false);
      return;
    }

    this.loadSpareParts();
  }

  loadSpareParts(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const request = this.onlyAvailable()
      ? this.apiService.getAvailableSpareParts()
      : this.apiService.getSpareParts();
    request.subscribe({
      next: (data) => {
        this.spareParts.set(getCollectionItems(data));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los repuestos del servidor.');
        this.loading.set(false);
      },
    });
  }

  toggleAvailabilityFilter(): void {
    this.onlyAvailable.update((value) => !value);
    this.loadSpareParts();
  }

  openCreateForm(): void {
    if (!this.canManageSpareParts) {
      return;
    }

    this.editingSparePartId.set(null);
    this.sparePartForm = this.emptySparePartForm();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  openEditForm(sparePart: SparePart): void {
    if (!this.canManageSpareParts) {
      return;
    }

    this.editingSparePartId.set(sparePart.id);
    this.sparePartForm = {
      name: sparePart.name,
      description: sparePart.description,
      price: sparePart.price,
      stock: sparePart.stock,
      status: sparePart.status,
    };
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.editingSparePartId.set(null);
  }

  saveSparePart(): void {
    if (!this.canManageSpareParts || this.saving()) {
      return;
    }

    const price = Number(this.sparePartForm.price);
    const stock = Number(this.sparePartForm.stock);
    const name = this.sparePartForm.name.trim();
    if (!name || !Number.isFinite(price) || price <= 0) {
      this.errorMessage.set('Ingresa un nombre y un precio mayor que cero para el repuesto.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      this.errorMessage.set('Las existencias deben ser un entero igual o mayor que cero.');
      return;
    }

    const payload: SparePartWritePayload = {
      ...this.sparePartForm,
      name,
      description: this.sparePartForm.description?.trim() || null,
      price: price.toFixed(2),
      stock,
    };
    this.saving.set(true);
    this.errorMessage.set('');
    const editingSparePartId = this.editingSparePartId();
    const isEditing = editingSparePartId !== null;
    const request = isEditing
      ? this.apiService.updateSparePart(editingSparePartId, payload)
      : this.apiService.createSparePart(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.successMessage.set(
          isEditing ? 'Repuesto actualizado correctamente.' : 'Repuesto creado correctamente.',
        );
        this.loadSpareParts();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          isEditing ? 'No se pudo actualizar el repuesto.' : 'No se pudo crear el repuesto.',
        );
      },
    });
  }

  toggleSparePartStatus(sparePart: SparePart): void {
    if (!this.canManageSpareParts) {
      return;
    }

    this.pendingStatusSparePartId.set(sparePart.id);
    this.errorMessage.set('');
  }

  cancelStatusChange(): void {
    this.pendingStatusSparePartId.set(null);
  }

  confirmStatusChange(sparePart: SparePart): void {
    if (!this.canManageSpareParts || this.saving()) {
      return;
    }
    if (this.pendingStatusSparePartId() !== sparePart.id) {
      return;
    }

    const nextStatus: ActiveStatus = sparePart.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.saving.set(true);
    this.errorMessage.set('');
    this.apiService.updateSparePart(sparePart.id, { status: nextStatus }).subscribe({
      next: () => {
        this.saving.set(false);
        this.pendingStatusSparePartId.set(null);
        this.successMessage.set(
          nextStatus === 'ACTIVE'
            ? 'Repuesto reactivado correctamente.'
            : 'Repuesto desactivado correctamente.',
        );
        this.loadSpareParts();
      },
      error: () => {
        this.saving.set(false);
        this.pendingStatusSparePartId.set(null);
        this.errorMessage.set('No se pudo cambiar el estado del repuesto.');
      },
    });
  }

  private emptySparePartForm(): SparePartWritePayload {
    return {
      name: '',
      description: null,
      price: '0.00',
      stock: 0,
      status: 'ACTIVE',
    };
  }
}
