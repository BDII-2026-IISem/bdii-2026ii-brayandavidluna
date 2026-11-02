import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import {
  ActiveStatus,
  getCollectionItems,
  Technician,
  TechnicianWritePayload,
} from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-technicians',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TableModule],
  templateUrl: './technicians.html',
})
export class TechniciansComponent implements OnInit {
  readonly technicians = signal<Technician[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formVisible = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingTechnicianId = signal<number | null>(null);
  readonly pendingDeleteTechnicianId = signal<number | null>(null);
  technicianForm: TechnicianWritePayload = this.emptyTechnicianForm();

  readonly activeStatuses: { value: ActiveStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ];

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  get canManageTechnicians(): boolean {
    return (
      this.authService.hasPermission('POST', '/api/v1/technicians/') &&
      this.authService.hasPermission('PATCH', '/api/v1/technicians/0/') &&
      this.authService.hasPermission('DELETE', '/api/v1/technicians/0/')
    );
  }

  get canViewTechnicians(): boolean {
    return this.authService.hasPermission('GET', '/api/v1/technicians/');
  }

  ngOnInit(): void {
    if (!this.canViewTechnicians) {
      this.errorMessage.set('Tu cuenta no tiene permiso para consultar técnicos.');
      this.loading.set(false);
      return;
    }

    this.loadTechnicians();
  }

  loadTechnicians(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.apiService.getTechnicians().subscribe({
      next: (data) => {
        this.technicians.set(getCollectionItems(data));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los técnicos del servidor.');
        this.loading.set(false);
      },
    });
  }

  openCreateForm(): void {
    if (!this.canManageTechnicians) {
      return;
    }

    this.editingTechnicianId.set(null);
    this.technicianForm = this.emptyTechnicianForm();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  openEditForm(technician: Technician): void {
    if (!this.canManageTechnicians) {
      return;
    }

    this.editingTechnicianId.set(technician.id);
    this.technicianForm = {
      name: technician.name,
      description: technician.description,
      status: technician.status,
    };
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.editingTechnicianId.set(null);
  }

  saveTechnician(): void {
    if (!this.canManageTechnicians || this.saving()) {
      return;
    }

    const payload = {
      ...this.technicianForm,
      name: this.technicianForm.name.trim(),
      description: this.technicianForm.description?.trim() || null,
    };
    if (!payload.name) {
      this.errorMessage.set('El nombre del técnico es obligatorio.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const editingTechnicianId = this.editingTechnicianId();
    const isEditing = editingTechnicianId !== null;
    const request = isEditing
      ? this.apiService.updateTechnician(editingTechnicianId, payload)
      : this.apiService.createTechnician(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.successMessage.set(
          isEditing ? 'Técnico actualizado correctamente.' : 'Técnico creado correctamente.',
        );
        this.loadTechnicians();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          isEditing ? 'No se pudo actualizar el técnico.' : 'No se pudo crear el técnico.',
        );
      },
    });
  }

  requestDelete(technician: Technician): void {
    if (!this.canManageTechnicians) {
      return;
    }

    this.pendingDeleteTechnicianId.set(technician.id);
    this.errorMessage.set('');
  }

  cancelDelete(): void {
    this.pendingDeleteTechnicianId.set(null);
  }

  deleteTechnician(technician: Technician): void {
    if (
      !this.canManageTechnicians ||
      this.deleting() ||
      this.pendingDeleteTechnicianId() !== technician.id
    ) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.apiService.deleteTechnician(technician.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDeleteTechnicianId.set(null);
        this.successMessage.set('Técnico eliminado correctamente.');
        this.loadTechnicians();
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage.set(
          'No se pudo eliminar el técnico. Verifica si tiene órdenes de servicio asociadas.',
        );
      },
    });
  }

  private emptyTechnicianForm(): TechnicianWritePayload {
    return {
      name: '',
      description: null,
      status: 'ACTIVE',
    };
  }
}
