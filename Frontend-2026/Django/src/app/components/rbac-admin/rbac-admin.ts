import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { getCollectionItems } from '../../models/climatec';
import {
  AdminResource,
  AdminRole,
  AdminUser,
  EffectivePermission,
  ResourceRoleGrant,
  RoleUserAssignment,
} from '../../models/rbac';
import { ApiService } from '../../services/api';

type AdminSection = 'users' | 'roles' | 'resources' | 'role-users' | 'resource-roles';

type ResourceMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

@Component({
  selector: 'app-rbac-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TableModule],
  templateUrl: './rbac-admin.html',
})
export class RbacAdminComponent implements OnInit {
  readonly activeSection = signal<AdminSection>('users');
  readonly users = signal<AdminUser[]>([]);
  readonly roles = signal<AdminRole[]>([]);
  readonly resources = signal<AdminResource[]>([]);
  readonly roleUserAssignments = signal<RoleUserAssignment[]>([]);
  readonly resourceRoleGrants = signal<ResourceRoleGrant[]>([]);
  readonly effectivePermissions = signal<EffectivePermission[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly formVisible = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDeleteKey = signal('');
  readonly selectedPermissionUserId = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly resourceMethods: ResourceMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  userForm = this.emptyUserForm();
  roleForm = this.emptyRoleForm();
  resourceForm = this.emptyResourceForm();
  roleUserForm = this.emptyRoleUserForm();
  resourceRoleForm = this.emptyResourceRoleForm();

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    forkJoin({
      users: this.api.getAdminUsers(),
      roles: this.api.getAdminRoles(),
      resources: this.api.getResources(),
      roleUsers: this.api.getRoleUserAssignments(),
      resourceRoles: this.api.getResourceRoleGrants(),
    }).subscribe({
      next: ({ users, roles, resources, roleUsers, resourceRoles }) => {
        this.users.set(getCollectionItems(users));
        this.roles.set(getCollectionItems(roles));
        this.resources.set(getCollectionItems(resources));
        this.roleUserAssignments.set(getCollectionItems(roleUsers));
        this.resourceRoleGrants.set(getCollectionItems(resourceRoles));
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los datos de administración RBAC.');
        this.loading.set(false);
      },
    });
  }

  selectSection(section: AdminSection): void {
    this.activeSection.set(section);
    this.closeForm();
    this.pendingDeleteKey.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.userForm = this.emptyUserForm();
    this.roleForm = this.emptyRoleForm();
    this.resourceForm = this.emptyResourceForm();
    this.roleUserForm = this.emptyRoleUserForm();
    this.resourceRoleForm = this.emptyResourceRoleForm();
  }

  openUserEditForm(user: AdminUser): void {
    this.openEditForm(user.id);
    this.userForm = {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      password: '',
    };
  }

  openRoleEditForm(role: AdminRole): void {
    this.openEditForm(role.id);
    this.roleForm = { name: role.name, description: role.description ?? '' };
  }

  openResourceEditForm(resource: AdminResource): void {
    this.openEditForm(resource.id);
    this.resourceForm = {
      path: resource.path,
      method: resource.method as ResourceMethod,
      description: resource.description ?? '',
    };
  }

  openRoleUserEditForm(assignment: RoleUserAssignment): void {
    this.openEditForm(assignment.id);
    this.roleUserForm = { user: assignment.user, role: assignment.role };
  }

  openResourceRoleEditForm(grant: ResourceRoleGrant): void {
    this.openEditForm(grant.id);
    this.resourceRoleForm = {
      resource: grant.resource,
      role: grant.role,
    };
  }

  saveCurrent(): void {
    if (this.saving()) {
      return;
    }

    switch (this.activeSection()) {
      case 'users':
        this.saveUser();
        return;
      case 'roles':
        this.saveRole();
        return;
      case 'resources':
        this.saveResource();
        return;
      case 'role-users':
        this.saveRoleUser();
        return;
      case 'resource-roles':
        this.saveResourceRole();
    }
  }

  requestDelete(key: string): void {
    this.pendingDeleteKey.set(key);
    this.errorMessage.set('');
  }

  deleteCurrent(id: number, key: string): void {
    if (this.deleting() || this.pendingDeleteKey() !== key) {
      return;
    }

    let request: Observable<void>;
    switch (this.activeSection()) {
      case 'users':
        request = this.api.deleteAdminUser(id);
        break;
      case 'roles':
        request = this.api.deleteAdminRole(id);
        break;
      case 'resources':
        request = this.api.deleteResource(id);
        break;
      case 'role-users':
        request = this.api.deleteRoleUserAssignment(id);
        break;
      case 'resource-roles':
        request = this.api.deleteResourceRoleGrant(id);
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    request.subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDeleteKey.set('');
        this.successMessage.set('Registro eliminado correctamente.');
        this.loadAll();
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage.set('No se pudo eliminar el registro. Revisa las relaciones asociadas.');
      },
    });
  }

  loadEffectivePermissions(userId: number | null): void {
    this.selectedPermissionUserId.set(userId);
    this.effectivePermissions.set([]);
    this.errorMessage.set('');
    if (userId === null) {
      return;
    }

    this.api.getUserPermissions(userId).subscribe({
      next: (response) => this.effectivePermissions.set(response.permissions),
      error: () =>
        this.errorMessage.set('No se pudieron consultar los permisos efectivos del usuario.'),
    });
  }

  roleName(id: number): string {
    return this.roles().find((role) => role.id === id)?.name ?? `Rol #${id}`;
  }

  username(id: number): string {
    return this.users().find((user) => user.id === id)?.username ?? `Usuario #${id}`;
  }

  resourceLabel(id: number): string {
    const resource = this.resources().find((item) => item.id === id);
    return resource ? `${resource.method} ${resource.path}` : `Recurso #${id}`;
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.editingId.set(null);
  }

  private saveUser(): void {
    const payload = {
      username: this.userForm.username.trim(),
      email: this.userForm.email.trim(),
      firstName: this.userForm.firstName.trim(),
      lastName: this.userForm.lastName.trim(),
      isActive: this.userForm.isActive,
    };
    const id = this.editingId();
    if (id === null && this.userForm.password.length < 8) {
      this.errorMessage.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    this.runSave(
      id === null
        ? this.api.createAdminUser({ ...payload, password: this.userForm.password })
        : this.api.updateAdminUser(id, payload),
      id === null ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.',
    );
  }

  private saveRole(): void {
    const payload = {
      name: this.roleForm.name.trim(),
      description: this.roleForm.description.trim() || null,
    };
    const id = this.editingId();
    this.runSave(
      id === null ? this.api.createAdminRole(payload) : this.api.updateAdminRole(id, payload),
      id === null ? 'Rol creado correctamente.' : 'Rol actualizado correctamente.',
    );
  }

  private saveResource(): void {
    const payload = {
      path: this.resourceForm.path.trim(),
      method: this.resourceForm.method,
      description: this.resourceForm.description.trim() || null,
    };
    const id = this.editingId();
    this.runSave(
      id === null ? this.api.createResource(payload) : this.api.updateResource(id, payload),
      id === null ? 'Recurso creado correctamente.' : 'Recurso actualizado correctamente.',
    );
  }

  private saveRoleUser(): void {
    const payload = { ...this.roleUserForm };
    if (payload.user <= 0 || payload.role <= 0) {
      this.errorMessage.set('Selecciona un usuario y un rol.');
      return;
    }
    const id = this.editingId();
    this.runSave(
      id === null
        ? this.api.createRoleUserAssignment(payload)
        : this.api.updateRoleUserAssignment(id, payload),
      id === null
        ? 'Asignación usuario-rol creada correctamente.'
        : 'Asignación usuario-rol actualizada correctamente.',
    );
  }

  private saveResourceRole(): void {
    const payload = { ...this.resourceRoleForm };
    if (payload.resource <= 0 || payload.role <= 0) {
      this.errorMessage.set('Selecciona un recurso y un rol.');
      return;
    }
    const id = this.editingId();
    this.runSave(
      id === null
        ? this.api.createResourceRoleGrant(payload)
        : this.api.updateResourceRoleGrant(id, payload),
      id === null
        ? 'Concesión rol-recurso creada correctamente.'
        : 'Concesión rol-recurso actualizada correctamente.',
    );
  }

  private runSave(request: Observable<unknown>, message: string): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.successMessage.set(message);
        this.loadAll();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          'No se pudo guardar el registro. Verifica los datos y las restricciones únicas.',
        );
      },
    });
  }

  private openEditForm(id: number): void {
    this.editingId.set(id);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private emptyUserForm(): {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    password: string;
  } {
    return {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      isActive: true,
      password: '',
    };
  }

  private emptyRoleForm(): { name: string; description: string } {
    return { name: '', description: '' };
  }

  private emptyResourceForm(): {
    path: string;
    method: ResourceMethod;
    description: string;
  } {
    return { path: '', method: 'GET', description: '' };
  }

  private emptyRoleUserForm(): { user: number; role: number } {
    return { user: 0, role: 0 };
  }

  private emptyResourceRoleForm(): { resource: number; role: number } {
    return { resource: 0, role: 0 };
  }
}
