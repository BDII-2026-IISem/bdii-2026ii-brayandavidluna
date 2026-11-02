import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ButtonModule, MenuModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  readonly menuOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly navigationItems: MenuItem[];

  constructor(
    readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.navigationItems = [
      ...(this.canOpenDashboard(authService)
        ? [
            {
              label: 'Inicio',
              icon: 'pi pi-home',
              routerLink: '/',
              linkClass: 'climatec-shell-menu-link',
              routerLinkActiveOptions: { exact: true },
              command: () => this.closeMenu(),
            },
          ]
        : []),
      ...(authService.hasPermission('GET', '/api/v1/clients/')
        ? [
            {
              label: 'Clientes',
              icon: 'pi pi-users',
              routerLink: '/clients',
              linkClass: 'climatec-shell-menu-link',
              command: () => this.closeMenu(),
            },
          ]
        : []),
      ...(authService.hasPermission('GET', '/api/v1/equipment/')
        ? [
            {
              label: 'Equipos',
              icon: 'pi pi-desktop',
              routerLink: '/equipment',
              linkClass: 'climatec-shell-menu-link',
              command: () => this.closeMenu(),
            },
          ]
        : []),
      ...(authService.hasPermission('GET', '/api/v1/technicians/')
        ? [
            {
              label: 'Técnicos',
              icon: 'pi pi-wrench',
              routerLink: '/technicians',
              linkClass: 'climatec-shell-menu-link',
              command: () => this.closeMenu(),
            },
          ]
        : []),
      ...(authService.hasPermission('GET', '/api/v1/spare-parts/')
        ? [
            {
              label: 'Repuestos',
              icon: 'pi pi-box',
              routerLink: '/spare-parts',
              linkClass: 'climatec-shell-menu-link',
              command: () => this.closeMenu(),
            },
          ]
        : []),
      ...(this.canManageRbac(authService)
        ? [
            {
              label: 'Administración RBAC',
              icon: 'pi pi-shield',
              routerLink: '/admin/rbac',
              linkClass: 'climatec-shell-menu-link',
              command: () => this.closeMenu(),
            },
          ]
        : []),
      ...(authService.hasPermission('GET', '/api/v1/service-orders/')
        ? [
            {
              label: 'Órdenes de servicio',
              icon: 'pi pi-wrench',
              routerLink: '/service-orders',
              linkClass: 'climatec-shell-menu-link',
              command: () => this.closeMenu(),
            },
          ]
        : []),
    ];
  }

  private canOpenDashboard(authService: AuthService): boolean {
    return (
      authService.hasPermission('GET', '/api/v1/clients/') &&
      authService.hasPermission('GET', '/api/v1/equipment/') &&
      authService.hasPermission('GET', '/api/v1/service-orders/')
    );
  }

  private canManageRbac(authService: AuthService): boolean {
    return [
      '/api/v1/users/',
      '/api/v1/roles/',
      '/api/v1/resources/',
      '/api/v1/role-users/',
      '/api/v1/resource-roles/',
    ].every(
      (path) =>
        authService.hasPermission('GET', path) &&
        authService.hasPermission('POST', path) &&
        authService.hasPermission('PATCH', `${path}0/`) &&
        authService.hasPermission('DELETE', `${path}0/`),
    );
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onLogout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () =>
        this.router.navigate(['/login'], {
          queryParams: {
            authError:
              'La sesión local se cerró, pero Django no confirmó la invalidación del refresh token.',
          },
        }),
    });
  }
}
