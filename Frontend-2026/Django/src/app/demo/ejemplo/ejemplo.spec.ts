import { TestBed } from '@angular/core/testing';
import { Ejemplo } from './ejemplo';
import { appConfig } from '../../app.config';

describe('Ejemplo', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ejemplo],
      providers: appConfig.providers,
    }).compileComponents();
  });

  it('shows the initial ClimaTec service order', async () => {
    const fixture = TestBed.createComponent(Ejemplo);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('OS-2026-001');
    expect(text).toContain('María Gómez');
    expect(text).toContain('Aire acondicionado split');
    expect(text).toContain('180.000');
    expect(text).toContain('Abierta');
  });

  it('increases the demonstration estimate without replacing the order', async () => {
    const fixture = TestBed.createComponent(Ejemplo);
    await fixture.whenStable();
    fixture.detectChanges();

    const button = findButton(fixture.nativeElement, 'Aumentar estimado');
    button.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('181.000');
  });

  it('changes the order status between open and diagnosis', async () => {
    const fixture = TestBed.createComponent(Ejemplo);
    await fixture.whenStable();
    fixture.detectChanges();

    findButton(fixture.nativeElement, 'Cambiar estado').click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Diagnóstico');
  });

  it('updates the service description preview and resets the example', async () => {
    const fixture = TestBed.createComponent(Ejemplo);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input');
    expect(input).not.toBeNull();
    input!.value = 'Reparación de compresor';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Vista previa: Reparación de compresor');

    findButton(element, 'Reiniciar ejemplo').click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Vista previa: Mantenimiento preventivo');
    expect(element.textContent).toContain('180.000');
  });
});

function findButton(root: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(label),
  );
  if (!button) {
    throw new Error(`No se encontró el botón "${label}".`);
  }
  return button;
}
