import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <p-card
        header="Acceso denegado"
        subheader="Tu cuenta no tiene permisos para consultar este recurso."
        styleClass="w-full max-w-lg text-center shadow-sm"
      >
        <p class="mb-6 text-sm leading-6 text-slate-600">
          Si necesitas acceso, comunícate con la persona administradora de ClimaTec.
        </p>
        <p-button label="Volver al inicio" icon="pi pi-home" routerLink="/" />
      </p-card>
    </main>
  `,
})
export class ForbiddenComponent {}
