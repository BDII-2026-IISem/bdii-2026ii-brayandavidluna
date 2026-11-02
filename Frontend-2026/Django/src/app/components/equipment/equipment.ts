import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import {
  ActiveStatus,
  Client,
  Equipment,
  EquipmentWritePayload,
  getCollectionItems,
} from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TableModule],
  templateUrl: './equipment.html',
})
export class EquipmentComponent implements OnInit {
  readonly equipmentList = signal<Equipment[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formVisible = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingEquipmentId = signal<number | null>(null);
  readonly pendingDeleteEquipmentId = signal<number | null>(null);
  equipmentForm: EquipmentWritePayload = this.emptyEquipmentForm();

  readonly activeStatuses: { value: ActiveStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ];

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  get canManageEquipment(): boolean {
    return (
      this.authService.hasPermission('POST', '/api/v1/equipment/') &&
      this.authService.hasPermission('PATCH', '/api/v1/equipment/0/') &&
      this.authService.hasPermission('DELETE', '/api/v1/equipment/0/')
    );
  }

  ngOnInit(): void {
    this.loadEquipment();
    this.loadClients();
  }

  loadEquipment(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.apiService.getEquipment().subscribe({
      next: (data) => {
        this.equipmentList.set(getCollectionItems(data));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los equipos del servidor.');
        this.loading.set(false);
      },
    });
  }

  loadClients(): void {
    this.apiService.getClients().subscribe({
      next: (data) => this.clients.set(getCollectionItems(data)),
      error: () =>
        this.errorMessage.set('No se pudieron cargar los clientes para asociar un equipo.'),
    });
  }

  clientName(clientId: number): string {
    return this.clients().find((client) => client.id === clientId)?.name ?? `Cliente #${clientId}`;
  }

  openCreateForm(): void {
    if (!this.canManageEquipment) {
      return;
    }

    this.editingEquipmentId.set(null);
    this.equipmentForm = {
      ...this.emptyEquipmentForm(),
      client: this.clients()[0]?.id ?? 0,
    };
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  openEditForm(equipment: Equipment): void {
    if (!this.canManageEquipment) {
      return;
    }

    this.editingEquipmentId.set(equipment.id);
    this.equipmentForm = {
      client: equipment.client,
      name: equipment.name,
      description: equipment.description,
      status: equipment.status,
    };
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.editingEquipmentId.set(null);
  }

  saveEquipment(): void {
    if (!this.canManageEquipment || this.saving()) {
      return;
    }

    const payload = {
      ...this.equipmentForm,
      name: this.equipmentForm.name.trim(),
      description: this.equipmentForm.description?.trim() || null,
    };
    if (!payload.name || !payload.client) {
      this.errorMessage.set('Selecciona un cliente y completa el nombre del equipo.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const editingEquipmentId = this.editingEquipmentId();
    const isEditing = editingEquipmentId !== null;
    const request = isEditing
      ? this.apiService.updateEquipment(editingEquipmentId, payload)
      : this.apiService.createEquipment(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.successMessage.set(
          isEditing ? 'Equipo actualizado correctamente.' : 'Equipo creado correctamente.',
        );
        this.loadEquipment();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          isEditing ? 'No se pudo actualizar el equipo.' : 'No se pudo crear el equipo.',
        );
      },
    });
  }

  requestDelete(equipment: Equipment): void {
    if (!this.canManageEquipment) {
      return;
    }

    this.pendingDeleteEquipmentId.set(equipment.id);
    this.errorMessage.set('');
  }

  cancelDelete(): void {
    this.pendingDeleteEquipmentId.set(null);
  }

  deleteEquipment(equipment: Equipment): void {
    if (
      !this.canManageEquipment ||
      this.deleting() ||
      this.pendingDeleteEquipmentId() !== equipment.id
    ) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.apiService.deleteEquipment(equipment.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDeleteEquipmentId.set(null);
        this.successMessage.set('Equipo eliminado correctamente.');
        this.loadEquipment();
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage.set(
          'No se pudo eliminar el equipo. Verifica si tiene órdenes de servicio asociadas.',
        );
      },
    });
  }

  private emptyEquipmentForm(): EquipmentWritePayload {
    return {
      client: 0,
      name: '',
      description: null,
      status: 'ACTIVE',
    };
  }
}
