import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../services/api';
import { AdminUser } from '../../models/rbac';
import { RbacAdminComponent } from './rbac-admin';

describe('RbacAdminComponent', () => {
  let fixture: ComponentFixture<RbacAdminComponent>;
  let component: RbacAdminComponent;
  let api: {
    getAdminUsers: ReturnType<typeof vi.fn>;
    getAdminRoles: ReturnType<typeof vi.fn>;
    getResources: ReturnType<typeof vi.fn>;
    getRoleUserAssignments: ReturnType<typeof vi.fn>;
    getResourceRoleGrants: ReturnType<typeof vi.fn>;
    getUserPermissions: ReturnType<typeof vi.fn>;
    createAdminUser: ReturnType<typeof vi.fn>;
    updateAdminUser: ReturnType<typeof vi.fn>;
  };

  const user: AdminUser = {
    id: 7,
    username: 'rbac-user',
    email: 'rbac@example.com',
    firstName: 'RBAC',
    lastName: 'User',
    isActive: true,
    createdAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
  };

  beforeEach(async () => {
    api = {
      getAdminUsers: vi.fn(() => of([user])),
      getAdminRoles: vi.fn(() => of([{ id: 3, name: 'ADMIN', description: null }])),
      getResources: vi.fn(() => of([])),
      getRoleUserAssignments: vi.fn(() => of([])),
      getResourceRoleGrants: vi.fn(() => of([])),
      getUserPermissions: vi.fn(() => of({ permissions: [] })),
      createAdminUser: vi.fn(() => of(user)),
      updateAdminUser: vi.fn(() => of(user)),
    };

    await TestBed.configureTestingModule({
      imports: [RbacAdminComponent],
      providers: [provideRouter([]), { provide: ApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(RbacAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the five administration collections', () => {
    expect(api.getAdminUsers).toHaveBeenCalledOnce();
    expect(api.getAdminRoles).toHaveBeenCalledOnce();
    expect(api.getResources).toHaveBeenCalledOnce();
    expect(api.getRoleUserAssignments).toHaveBeenCalledOnce();
    expect(api.getResourceRoleGrants).toHaveBeenCalledOnce();
    expect(component.users()).toEqual([user]);
  });

  it('sends a password only when creating a user', () => {
    component.openCreateForm();
    component.userForm = {
      username: 'new-user',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      isActive: true,
      password: 'secure-password-123',
    };
    component.saveCurrent();

    expect(api.createAdminUser).toHaveBeenCalledWith({
      username: 'new-user',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      isActive: true,
      password: 'secure-password-123',
    });

    component.openUserEditForm(user);
    component.userForm.firstName = 'Updated';
    component.saveCurrent();

    expect(api.updateAdminUser).toHaveBeenCalledWith(7, {
      username: 'rbac-user',
      email: 'rbac@example.com',
      firstName: 'Updated',
      lastName: 'User',
      isActive: true,
    });
    expect(api.updateAdminUser.mock.calls[0][1]).not.toHaveProperty('password');
  });

  it('loads effective permissions for the selected user', () => {
    const permissions = [
      {
        method: 'GET',
        path: '/api/v1/clients/',
        roleId: 3,
        roleName: 'ADMIN',
      },
    ];
    api.getUserPermissions.mockReturnValue(of({ permissions }));

    component.loadEffectivePermissions(7);

    expect(api.getUserPermissions).toHaveBeenCalledWith(7);
    expect(component.effectivePermissions()).toEqual(permissions);
  });
});
