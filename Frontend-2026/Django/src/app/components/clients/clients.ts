import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import {
  ActiveStatus,
  Client,
  ClientDocumentType,
  ClientWritePayload,
  getCollectionItems,
} from '../../models/climatec';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, CardModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class ClientsComponent implements OnInit {
  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formVisible = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingClientId = signal<number | null>(null);
  readonly pendingDeleteClientId = signal<number | null>(null);
  clientForm: ClientWritePayload = this.emptyClientForm();

  readonly documentTypes: { value: ClientDocumentType; label: string }[] = [
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'CE', label: 'Cédula de extranjería' },
    { value: 'NIT', label: 'NIT' },
    { value: 'PP', label: 'Pasaporte' },
  ];
  readonly activeStatuses: { value: ActiveStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ];

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  get canManageClients(): boolean {
    return (
      this.authService.hasPermission('POST', '/api/v1/clients/') &&
      this.authService.hasPermission('PATCH', '/api/v1/clients/0/') &&
      this.authService.hasPermission('DELETE', '/api/v1/clients/0/')
    );
  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients.set(getCollectionItems(data));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los clientes del servidor.');
        this.loading.set(false);
      },
    });
  }

  openCreateForm(): void {
    if (!this.canManageClients) {
      return;
    }

    this.editingClientId.set(null);
    this.clientForm = this.emptyClientForm();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  openEditForm(client: Client): void {
    if (!this.canManageClients) {
      return;
    }

    this.editingClientId.set(client.id);
    this.clientForm = {
      documentType: client.documentType,
      documentNumber: client.documentNumber,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      isActive: client.isActive,
    };
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.editingClientId.set(null);
  }

  saveClient(): void {
    if (!this.canManageClients || this.saving()) {
      return;
    }

    const payload = this.normalizeClientForm();
    if (!payload.documentNumber || !payload.name || !payload.email || !payload.phone) {
      this.errorMessage.set('Completa los campos obligatorios del cliente.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const editingClientId = this.editingClientId();
    const isEditing = editingClientId !== null;
    const request = isEditing
      ? this.apiService.updateClient(editingClientId, payload)
      : this.apiService.createClient(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.successMessage.set(
          isEditing ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.',
        );
        this.loadClients();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          isEditing ? 'No se pudo actualizar el cliente.' : 'No se pudo crear el cliente.',
        );
      },
    });
  }

  requestDelete(client: Client): void {
    if (!this.canManageClients) {
      return;
    }

    this.pendingDeleteClientId.set(client.id);
    this.errorMessage.set('');
  }

  cancelDelete(): void {
    this.pendingDeleteClientId.set(null);
  }

  deleteClient(client: Client): void {
    if (!this.canManageClients || this.deleting() || this.pendingDeleteClientId() !== client.id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.apiService.deleteClient(client.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDeleteClientId.set(null);
        this.successMessage.set('Cliente eliminado correctamente.');
        this.loadClients();
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage.set(
          'No se pudo eliminar el cliente. Verifica si tiene equipos u órdenes asociados.',
        );
      },
    });
  }

  private emptyClientForm(): ClientWritePayload {
    return {
      documentType: 'CC',
      documentNumber: '',
      name: '',
      email: '',
      phone: '',
      address: null,
      isActive: 'ACTIVE',
    };
  }

  private normalizeClientForm(): ClientWritePayload {
    return {
      ...this.clientForm,
      documentNumber: this.clientForm.documentNumber.trim(),
      name: this.clientForm.name.trim(),
      email: this.clientForm.email.trim(),
      phone: this.clientForm.phone.trim(),
      address: this.clientForm.address?.trim() || null,
    };
  }
}
