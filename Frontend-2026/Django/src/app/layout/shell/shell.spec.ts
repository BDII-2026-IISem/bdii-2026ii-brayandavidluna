import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, UserProfile } from '../../services/auth';
import { ShellComponent } from './shell';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  let router: Router;
  let logout: ReturnType<typeof vi.fn>;
  const user: UserProfile = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Ana',
    lastName: 'Técnica',
    roles: ['ADMIN'],
    createdAt: '2026-11-02T10:00:00Z',
  };
  const currentUser = signal<UserProfile | null>(user);

  beforeEach(async () => {
    currentUser.set(user);
    logout = vi.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser,
            logout,
            hasPermission: () => currentUser()?.roles.includes('ADMIN') ?? false,
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders the ClimaTec shell and only implemented destinations', () => {
    const element = fixture.nativeElement as HTMLElement;

    const menuButton = element.querySelector(
      'button[aria-label="Abrir menú de navegación"]',
    ) as HTMLButtonElement;
    const sidebar = element.querySelector('aside') as HTMLElement;

    expect(element.querySelector('header')?.textContent).toContain('ClimaTec');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Navegación principal');
    expect(element.querySelector('footer')?.textContent).toContain('Gestión de servicio técnico');
    expect(menuButton.getAttribute('aria-controls')).toBe('primary-navigation');
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    expect(sidebar.classList).toContain('-translate-x-full');
    expect(sidebar.getAttribute('aria-hidden')).toBe('true');
    expect(sidebar.hasAttribute('inert')).toBe(true);
    expect(element.querySelectorAll('nav a')).toHaveLength(7);
    expect(
      Array.from(element.querySelectorAll('nav a')).map((link) => link.getAttribute('href')),
    ).toEqual([
      '/',
      '/clients',
      '/equipment',
      '/technicians',
      '/spare-parts',
      '/admin/rbac',
      '/service-orders',
    ]);
    expect(
      Array.from(element.querySelectorAll('nav a')).every((link) =>
        link.classList.contains('climatec-shell-menu-link'),
      ),
    ).toBe(true);
    expect(element.textContent).toContain('admin');
    expect(element.textContent).toContain('ADMIN');
  });

  it('uses PrimeNG menu items and closes the mobile menu after selection', () => {
    const menuButton = fixture.nativeElement.querySelector(
      'button[aria-label="Abrir menú de navegación"]',
    ) as HTMLButtonElement;
    menuButton.click();
    fixture.detectChanges();

    expect(component.menuOpen()).toBe(true);
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');

    component.menuOpen.set(true);

    const clientsItem = component.navigationItems[1];
    clientsItem.command?.({
      item: clientsItem,
      originalEvent: new MouseEvent('click'),
    });

    expect(clientsItem.routerLink).toBe('/clients');
    expect(component.navigationItems[0].routerLinkActiveOptions).toEqual({
      exact: true,
    });
    expect(component.menuOpen()).toBe(false);
  });

  it('only shows technician management to admins', () => {
    currentUser.set({ ...user, roles: ['CLIENT'] });

    const restrictedFixture = TestBed.createComponent(ShellComponent);
    restrictedFixture.detectChanges();

    const links = Array.from(
      restrictedFixture.nativeElement.querySelectorAll('nav a'),
    ) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).not.toContain('/technicians');
    expect(links.map((link) => link.getAttribute('href'))).not.toContain('/spare-parts');
    restrictedFixture.destroy();
  });

  it('closes the mobile menu when its backdrop is selected', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(
      'button[aria-label="Cerrar menú de navegación"]',
    ) as HTMLButtonElement;
    backdrop.click();

    expect(component.menuOpen()).toBe(false);
  });

  it('invalidates the backend session and redirects to login', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onLogout();

    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
