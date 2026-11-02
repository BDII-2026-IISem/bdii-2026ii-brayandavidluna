import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ForbiddenComponent } from './components/forbidden/forbidden';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { permissionGuard } from './guards/permission.guard';
import { ShellComponent } from './layout/shell/shell';

const rbacCollectionPaths = [
  '/api/v1/users/',
  '/api/v1/roles/',
  '/api/v1/resources/',
  '/api/v1/role-users/',
  '/api/v1/resource-roles/',
];

const rbacAdministrationPermissions = rbacCollectionPaths.flatMap((path) => [
  { method: 'GET', path },
  { method: 'POST', path },
  { method: 'PATCH', path: `${path}0/` },
  { method: 'DELETE', path: `${path}0/` },
]);

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'forbidden', component: ForbiddenComponent },
  {
    path: 'demo',
    loadComponent: () => import('./demo/ejemplo/ejemplo').then((m) => m.Ejemplo),
  },
  {
    path: '',
    canActivate: [authGuard],
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/dashboard/dashboard').then((m) => m.DashboardComponent),
        canActivate: [permissionGuard],
        data: {
          permissions: [
            { method: 'GET', path: '/api/v1/clients/' },
            { method: 'GET', path: '/api/v1/equipment/' },
            { method: 'GET', path: '/api/v1/service-orders/' },
          ],
        },
      },
      {
        path: 'service-orders',
        loadComponent: () =>
          import('./components/service-orders/service-orders').then(
            (m) => m.ServiceOrdersComponent,
          ),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ method: 'GET', path: '/api/v1/service-orders/' }],
        },
      },
      {
        path: 'service-orders/:id',
        loadComponent: () =>
          import('./components/service-order-detail/service-order-detail').then(
            (m) => m.ServiceOrderDetailComponent,
          ),
        canActivate: [permissionGuard],
        data: {
          permissions: [
            { method: 'GET', path: '/api/v1/service-orders/<int:pk>/' },
            { method: 'GET', path: '/api/v1/diagnoses/' },
            { method: 'GET', path: '/api/v1/spare-part-consumptions/' },
          ],
        },
      },
      {
        path: 'clients',
        loadComponent: () => import('./components/clients/clients').then((m) => m.ClientsComponent),
        canActivate: [permissionGuard],
        data: { permissions: [{ method: 'GET', path: '/api/v1/clients/' }] },
      },
      {
        path: 'equipment',
        loadComponent: () =>
          import('./components/equipment/equipment').then((m) => m.EquipmentComponent),
        canActivate: [permissionGuard],
        data: { permissions: [{ method: 'GET', path: '/api/v1/equipment/' }] },
      },
      {
        path: 'technicians',
        loadComponent: () =>
          import('./components/technicians/technicians').then((m) => m.TechniciansComponent),
        canActivate: [permissionGuard],
        data: { permissions: [{ method: 'GET', path: '/api/v1/technicians/' }] },
      },
      {
        path: 'spare-parts',
        loadComponent: () =>
          import('./components/spare-parts/spare-parts').then((m) => m.SparePartsComponent),
        canActivate: [permissionGuard],
        data: { permissions: [{ method: 'GET', path: '/api/v1/spare-parts/' }] },
      },
      {
        path: 'admin/rbac',
        loadComponent: () =>
          import('./components/rbac-admin/rbac-admin').then((m) => m.RbacAdminComponent),
        canActivate: [permissionGuard],
        data: { permissions: rbacAdministrationPermissions },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
