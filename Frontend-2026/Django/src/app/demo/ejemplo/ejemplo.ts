import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

type EstadoOrden = 'ABIERTA' | 'DIAGNOSTICO';

interface OrdenServicioDemo {
  number: string;
  clientName: string;
  equipmentName: string;
  estimate: number;
  status: EstadoOrden;
}

const ORDEN_INICIAL: OrdenServicioDemo = {
  number: 'OS-2026-001',
  clientName: 'María Gómez',
  equipmentName: 'Aire acondicionado split',
  estimate: 180000,
  status: 'ABIERTA',
};

@Component({
  selector: 'app-ejemplo',
  imports: [ButtonModule, CardModule, CurrencyPipe, TagModule],
  templateUrl: './ejemplo.html',
  styleUrl: './ejemplo.css',
  host: { class: 'block' },
})
export class Ejemplo {
  protected readonly orden = signal<OrdenServicioDemo>({ ...ORDEN_INICIAL });
  protected readonly descripcion = signal('Mantenimiento preventivo');
  protected readonly totalEstimado = computed(() => this.orden().estimate);
  protected readonly estadoTexto = computed(() =>
    this.orden().status === 'ABIERTA' ? 'Abierta' : 'Diagnóstico',
  );
  protected readonly estadoSeverity = computed(() =>
    this.orden().status === 'ABIERTA' ? 'info' : 'warn',
  );

  constructor() {
    effect(() => {
      const current = this.orden();
      console.log(
        `[demo-orden] ${current.number} · ${current.estimate} · ${current.status}`,
      );
    });
  }

  protected incrementarEstimado(): void {
    this.orden.update((actual) => ({
      ...actual,
      estimate: actual.estimate + 1000,
    }));
  }

  protected cambiarEstado(): void {
    this.orden.update((actual) => ({
      ...actual,
      status: actual.status === 'ABIERTA' ? 'DIAGNOSTICO' : 'ABIERTA',
    }));
  }

  protected actualizarDescripcion(value: string): void {
    this.descripcion.set(value);
  }

  protected reiniciar(): void {
    this.orden.set({ ...ORDEN_INICIAL });
    this.descripcion.set('Mantenimiento preventivo');
  }
}
