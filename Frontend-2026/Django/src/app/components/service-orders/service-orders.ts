import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import {
  Client,
  Equipment,
  ApiCollection,
  getCollectionItems,
  ServiceOrder,
  Technician,
} from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

interface ServiceOrderFormState {
  client: number | null;
  equipment: number | null;
  technician: number | null;
  number: string;
}

@Component({
  selector: 'app-service-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TableModule, ButtonModule, CardModule],
  templateUrl: './service-orders.html',
})
export class ServiceOrdersComponent implements OnInit {
  readonly orders = signal<ServiceOrder[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly equipmentList = signal<Equipment[]>([]);
  readonly technicians = signal<Technician[]>([]);
  readonly loading = signal(true);
  readonly loadingLookups = signal(false);
  readonly saving = signal(false);
  readonly formVisible = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  orderForm: ServiceOrderFormState = this.emptyOrderForm();

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  get canManageServiceOrders(): boolean {
    return this.authService.hasPermission('POST', '/api/v1/service-orders/');
  }

  get availableEquipment(): Equipment[] {
    const clientId = this.orderForm.client;
    if (clientId === null) {
      return [];
    }

    return this.equipmentList().filter(
      (item) => item.client === clientId && item.status === 'ACTIVE',
    );
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadFormOptions();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.apiService.getServiceOrders().subscribe({
      next: (data) => {
        this.orders.set(getCollectionItems(data));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar las órdenes de servicio del servidor.');
        this.loading.set(false);
      },
    });
  }

  loadFormOptions(): void {
    this.loadingLookups.set(true);
    forkJoin({
      clients: this.apiService.getClients(),
      equipment: this.apiService.getEquipment(),
      technicians: this.canManageServiceOrders
        ? this.apiService.getTechnicians()
        : of<ApiCollection<Technician>>([]),
    }).subscribe({
      next: ({ clients, equipment, technicians }) => {
        this.clients.set(
          getCollectionItems(clients).filter((client) => client.isActive === 'ACTIVE'),
        );
        this.equipmentList.set(getCollectionItems(equipment));
        this.technicians.set(
          getCollectionItems(technicians).filter((technician) => technician.status === 'ACTIVE'),
        );
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.errorMessage.set(
          'No se pudieron cargar clientes, equipos y técnicos para crear la orden.',
        );
      },
    });
  }

  clientName(id: number): string {
    return this.clients().find((client) => client.id === id)?.name ?? `Cliente #${id}`;
  }

  equipmentName(id: number): string {
    return this.equipmentList().find((equipment) => equipment.id === id)?.name ?? `Equipo #${id}`;
  }

  technicianName(id: number): string {
    return this.technicians().find((technician) => technician.id === id)?.name ?? `Técnico #${id}`;
  }

  onClientChange(): void {
    this.orderForm.equipment = null;
  }

  openCreateForm(): void {
    if (!this.canManageServiceOrders) {
      return;
    }

    this.orderForm = this.emptyOrderForm();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
  }

  saveServiceOrder(): void {
    if (!this.canManageServiceOrders || this.saving()) {
      return;
    }

    const { client, equipment, technician, number } = this.orderForm;
    const normalizedNumber = number.trim();
    if (client === null || equipment === null || technician === null || !normalizedNumber) {
      this.errorMessage.set(
        'Selecciona cliente, equipo y técnico; también ingresa el número de la orden.',
      );
      return;
    }
    if (!this.availableEquipment.some((item) => item.id === equipment)) {
      this.errorMessage.set(
        'El equipo seleccionado no pertenece al cliente indicado o está inactivo.',
      );
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.apiService
      .createServiceOrder({
        client,
        equipment,
        technician,
        number: normalizedNumber,
        openedAt: this.currentLocalDateTimeWithOffset(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.successMessage.set('Orden de servicio creada correctamente.');
          this.loadOrders();
        },
        error: () => {
          this.saving.set(false);
          this.errorMessage.set(
            'No se pudo crear la orden. Verifica el número y los registros relacionados.',
          );
        },
      });
  }

  private emptyOrderForm(): ServiceOrderFormState {
    return {
      client: null,
      equipment: null,
      technician: null,
      number: '',
    };
  }

  private currentLocalDateTimeWithOffset(): string {
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 19);
    return `${localDateTime}${sign}${hours}:${minutes}`;
  }
}
