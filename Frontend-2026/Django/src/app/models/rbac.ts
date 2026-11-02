export interface EffectivePermission {
  method: string;
  path: string;
  roleId: number;
  roleName: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminUserCreatePayload = Pick<
  AdminUser,
  'username' | 'email' | 'firstName' | 'lastName' | 'isActive'
> & { password: string };

export type AdminUserUpdatePayload = Partial<
  Pick<AdminUser, 'username' | 'email' | 'firstName' | 'lastName' | 'isActive'>
>;

export interface AdminRole {
  id: number;
  name: string;
  description: string | null;
}

export type RoleWritePayload = Pick<AdminRole, 'name' | 'description'>;

export interface AdminResource {
  id: number;
  path: string;
  method: string;
  description: string | null;
}

export type ResourceWritePayload = Pick<AdminResource, 'path' | 'method' | 'description'>;

export interface RoleUserAssignment {
  id: number;
  user: number;
  role: number;
}

export type RoleUserWritePayload = Pick<RoleUserAssignment, 'user' | 'role'>;

export interface ResourceRoleGrant {
  id: number;
  resource: number;
  role: number;
}

export type ResourceRoleWritePayload = Pick<ResourceRoleGrant, 'resource' | 'role'>;
