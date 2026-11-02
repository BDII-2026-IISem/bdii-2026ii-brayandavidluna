import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth';
import {
  ApiCollection,
  Client,
  Equipment,
  getCollectionItems,
  ServiceOrder,
  SparePart,
} from '../../models/climatec';
import { ApiService } from '../../services/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly metrics = signal({
    activeClients: 0,
    activeEquipment: 0,
    openOrders: 0,
    availableSpareParts: 0,
  });

  constructor(
    readonly authService: AuthService,
    private readonly apiService: ApiService,
  ) {}

  get canViewInventory(): boolean {
    return this.authService.hasPermission('GET', '/api/v1/spare-parts/available/');
  }

  ngOnInit(): void {
    forkJoin({
      clients: this.apiService.getClients(),
      equipment: this.apiService.getEquipment(),
      orders: this.apiService.getServiceOrders(),
      spareParts: this.canViewInventory
        ? this.apiService.getAvailableSpareParts()
        : of<ApiCollection<SparePart>>([]),
    }).subscribe({
      next: ({ clients, equipment, orders, spareParts }) => {
        this.metrics.set({
          activeClients: getCollectionItems(clients).filter(
            (client: Client) => client.isActive === 'ACTIVE',
          ).length,
          activeEquipment: getCollectionItems(equipment).filter(
            (item: Equipment) => item.status === 'ACTIVE',
          ).length,
          openOrders: getCollectionItems(orders).filter(
            (order: ServiceOrder) => order.status !== 'CERRADA' && order.status !== 'CANCELADA',
          ).length,
          availableSpareParts: getCollectionItems(spareParts).length,
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los indicadores desde ClimaTec.');
        this.loading.set(false);
      },
    });
  }
}
