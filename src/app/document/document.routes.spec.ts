import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { DOCUMENT_ROUTES } from './document.routes';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
class TestHostComponent {}

/**
 * Regression test for PR #8 (NG0201 fix).
 *
 * The bug reproduces only when DOCUMENT_ROUTES is loaded in isolation,
 * without app.config.ts's root providers — which is exactly what the
 * shell does via loadRemoteModule('./routes').
 *
 * This test mounts a real RouterOutlet so the router instantiates
 * DocumentsPageComponent. Without that, the router would not resolve
 * the component's injected dependencies and the test would pass even
 * with the providers removed.
 *
 * Before the fix, this test would fail with:
 *   NG0201: No provider found for InjectionToken DOCUMENT_DATA_SOURCE
 * because DocumentsPageComponent injects the token during instantiation
 * and no route-level provider supplied it.
 */
describe('DOCUMENT_ROUTES (consumed in isolation, as the shell does)', () => {
  it('instantiates the page component through a RouterOutlet without NG0201', async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter(DOCUMENT_ROUTES)],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestHostComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    fixture.detectChanges();
    // Let the async loadComponent() promise resolve before asserting.
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/');
  });

  it('keeps the route-level providers when the route table is inspected', () => {
    const rootRoute = DOCUMENT_ROUTES[0];

    expect(rootRoute.providers).toBeDefined();
    expect(rootRoute.providers).not.toBeNull();
    expect(Array.isArray(rootRoute.providers)).toBe(true);
    expect(
      (rootRoute.providers as readonly unknown[]).length,
    ).toBeGreaterThan(0);
  });
});