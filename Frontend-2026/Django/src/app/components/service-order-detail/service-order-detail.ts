import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import {
  ActiveStatus,
  ApiCollection,
  Client,
  Diagnosis,
  DiagnosisWritePayload,
  Equipment,
  getCollectionItems,
  ServiceOrder,
  SparePart,
  SparePartConsumption,
  SparePartConsumptionWritePayload,
  Technician,
} from '../../models/climatec';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

interface DiagnosisFormState {
  name: string;
  description: string;
}

interface ConsumptionFormState {
  sparePart: number | null;
  quantity: number;
}

@Component({
  selector: 'app-service-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, CardModule, TableModule],
  templateUrl: './service-order-detail.html',
})
export class ServiceOrderDetailComponent implements OnInit {
  readonly order = signal<ServiceOrder | null>(null);
  readonly clients = signal<Client[]>([]);
  readonly equipmentList = signal<Equipment[]>([]);
  readonly technicians = signal<Technician[]>([]);
  readonly diagnoses = signal<Diagnosis[]>([]);
  readonly consumptions = signal<SparePartConsumption[]>([]);
  readonly sparePartCatalog = signal<SparePart[]>([]);
  readonly availableSpareParts = signal<SparePart[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly diagnosisFormVisible = signal(false);
  readonly consumptionFormVisible = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly pendingDiagnosisStatusId = signal<number | null>(null);
  readonly pendingConsumptionStatusId = signal<number | null>(null);
  diagnosisForm: DiagnosisFormState = this.emptyDiagnosisForm();
  consumptionForm: ConsumptionFormState = this.emptyConsumptionForm();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  get canManageDetails(): boolean {
    return (
      this.authService.hasPermission('POST', '/api/v1/diagnoses/') &&
      this.authService.hasPermission('PATCH', '/api/v1/diagnoses/0/') &&
      this.authService.hasPermission('POST', '/api/v1/spare-part-consumptions/') &&
      this.authService.hasPermission('PATCH', '/api/v1/spare-part-consumptions/0/')
    );
  }

  get selectedSparePart(): SparePart | undefined {
    const selectedId = this.consumptionForm.sparePart;
    return this.availableSpareParts().find((part) => part.id === selectedId);
  }

  ngOnInit(): void {
    this.loadDetails();
  }

  loadDetails(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(orderId) || orderId <= 0) {
      this.errorMessage.set('El identificador de la orden no es válido.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    forkJoin({
      order: this.apiService.getServiceOrder(orderId),
      clients: this.apiService.getClients(),
      equipment: this.apiService.getEquipment(),
      technicians: this.canManageDetails
        ? this.apiService.getTechnicians()
        : of<ApiCollection<Technician>>([]),
      diagnoses: this.apiService.getDiagnoses(),
      consumptions: this.apiService.getSparePartConsumptions(),
      spareParts: this.canManageDetails
        ? this.apiService.getSpareParts()
        : of<ApiCollection<SparePart>>([]),
    }).subscribe({
      next: ({ order, clients, equipment, technicians, diagnoses, consumptions, spareParts }) => {
        this.order.set(order);
        this.clients.set(getCollectionItems(clients));
        this.equipmentList.set(getCollectionItems(equipment));
        this.technicians.set(getCollectionItems(technicians));
        this.diagnoses.set(
          getCollectionItems(diagnoses).filter((diagnosis) => diagnosis.serviceOrder === order.id),
        );
        this.consumptions.set(
          getCollectionItems(consumptions).filter(
            (consumption) => consumption.serviceOrder === order.id,
          ),
        );
        const catalog = getCollectionItems(spareParts);
        this.sparePartCatalog.set(catalog);
        this.availableSpareParts.set(
          catalog.filter((part) => part.status === 'ACTIVE' && part.stock > 0),
        );
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'No se pudo cargar la orden o sus detalles. Verifica el acceso y vuelve a intentarlo.',
        );
        this.loading.set(false);
      },
    });
  }

  sparePartName(id: number): string {
    return this.sparePartCatalog().find((part) => part.id === id)?.name ?? `Repuesto #${id}`;
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

  consumptionSubtotal(consumption: SparePartConsumption): number {
    return consumption.quantity * Number(consumption.unitPrice);
  }

  openDiagnosisForm(): void {
    if (!this.canManageDetails) {
      return;
    }
    this.diagnosisForm = this.emptyDiagnosisForm();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.diagnosisFormVisible.set(true);
  }

  closeDiagnosisForm(): void {
    this.diagnosisFormVisible.set(false);
  }

  saveDiagnosis(): void {
    const order = this.order();
    const name = this.diagnosisForm.name.trim();
    const description = this.diagnosisForm.description.trim();
    if (!this.canManageDetails || !order || this.saving()) {
      return;
    }
    if (!name || !description) {
      this.errorMessage.set('Ingresa el nombre y la descripción del diagnóstico.');
      return;
    }

    const payload: DiagnosisWritePayload = {
      serviceOrder: order.id,
      name,
      description,
      status: 'ACTIVE',
    };
    this.saving.set(true);
    this.errorMessage.set('');
    this.apiService.createDiagnosis(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDiagnosisForm();
        this.successMessage.set('Diagnóstico registrado correctamente.');
        this.loadDetails();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('No se pudo registrar el diagnóstico.');
      },
    });
  }

  requestDiagnosisStatusChange(diagnosis: Diagnosis): void {
    if (!this.canManageDetails) {
      return;
    }
    this.pendingDiagnosisStatusId.set(diagnosis.id);
  }

  cancelDiagnosisStatusChange(): void {
    this.pendingDiagnosisStatusId.set(null);
  }

  confirmDiagnosisStatusChange(diagnosis: Diagnosis): void {
    if (
      !this.canManageDetails ||
      this.saving() ||
      this.pendingDiagnosisStatusId() !== diagnosis.id
    ) {
      return;
    }
    this.updateDiagnosisStatus(diagnosis.id, diagnosis.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
  }

  openConsumptionForm(): void {
    if (!this.canManageDetails || this.availableSpareParts().length === 0) {
      return;
    }
    this.consumptionForm = this.emptyConsumptionForm();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.consumptionFormVisible.set(true);
  }

  closeConsumptionForm(): void {
    this.consumptionFormVisible.set(false);
  }

  saveConsumption(): void {
    const order = this.order();
    const sparePart = this.selectedSparePart;
    const quantity = Number(this.consumptionForm.quantity);
    if (!this.canManageDetails || !order || this.saving()) {
      return;
    }
    if (!sparePart || !Number.isInteger(quantity) || quantity <= 0 || quantity > sparePart.stock) {
      this.errorMessage.set(
        'Selecciona un repuesto disponible e ingresa una cantidad entera dentro de sus existencias.',
      );
      return;
    }

    const payload: SparePartConsumptionWritePayload = {
      serviceOrder: order.id,
      sparePart: sparePart.id,
      quantity,
      unitPrice: sparePart.price,
    };
    this.saving.set(true);
    this.errorMessage.set('');
    this.apiService.createSparePartConsumption(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeConsumptionForm();
        this.successMessage.set('Consumo de repuesto registrado correctamente.');
        this.loadDetails();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          'No se pudo registrar el consumo. Verifica las existencias actuales del repuesto.',
        );
      },
    });
  }

  requestConsumptionStatusChange(consumption: SparePartConsumption): void {
    if (!this.canManageDetails) {
      return;
    }
    this.pendingConsumptionStatusId.set(consumption.id);
  }

  cancelConsumptionStatusChange(): void {
    this.pendingConsumptionStatusId.set(null);
  }

  confirmConsumptionStatusChange(consumption: SparePartConsumption): void {
    if (
      !this.canManageDetails ||
      this.saving() ||
      this.pendingConsumptionStatusId() !== consumption.id
    ) {
      return;
    }

    const nextStatus: ActiveStatus = consumption.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.saving.set(true);
    this.errorMessage.set('');
    this.apiService.updateSparePartConsumption(consumption.id, { status: nextStatus }).subscribe({
      next: () => {
        this.saving.set(false);
        this.pendingConsumptionStatusId.set(null);
        this.successMessage.set(
          nextStatus === 'ACTIVE'
            ? 'Consumo reactivado; el inventario se actualizó.'
            : 'Consumo anulado; el inventario fue restaurado.',
        );
        this.loadDetails();
      },
      error: () => {
        this.saving.set(false);
        this.pendingConsumptionStatusId.set(null);
        this.errorMessage.set(
          'No se pudo cambiar el consumo. Verifica que el repuesto tenga existencias suficientes.',
        );
      },
    });
  }

  private updateDiagnosisStatus(id: number, status: ActiveStatus): void {
    this.saving.set(true);
    this.errorMessage.set('');
    this.apiService.updateDiagnosis(id, { status }).subscribe({
      next: () => {
        this.saving.set(false);
        this.pendingDiagnosisStatusId.set(null);
        this.successMessage.set(
          status === 'ACTIVE'
            ? 'Diagnóstico reactivado correctamente.'
            : 'Diagnóstico desactivado correctamente.',
        );
        this.loadDetails();
      },
      error: () => {
        this.saving.set(false);
        this.pendingDiagnosisStatusId.set(null);
        this.errorMessage.set('No se pudo cambiar el estado del diagnóstico.');
      },
    });
  }

  private emptyDiagnosisForm(): DiagnosisFormState {
    return { name: '', description: '' };
  }

  private emptyConsumptionForm(): ConsumptionFormState {
    return { sparePart: null, quantity: 1 };
  }
}
