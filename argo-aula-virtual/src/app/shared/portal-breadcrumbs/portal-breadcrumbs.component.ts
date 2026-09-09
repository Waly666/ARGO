import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PortalBreadcrumbItem {
  label: string;
  path?: string;
}

@Component({
  selector: 'av-portal-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="portal-crumbs-bar" role="presentation">
      <div class="container portal-crumbs-bar__inner">
        <nav class="portal-crumbs" aria-label="Migas de pan">
          <ol class="portal-crumbs__list">
            @for (item of items; track $index; let last = $last) {
              <li class="portal-crumbs__item">
                @if (!last && item.path) {
                  <a class="portal-crumbs__link" [routerLink]="item.path">{{ item.label }}</a>
                } @else {
                  <span class="portal-crumbs__current" aria-current="page">{{ item.label }}</span>
                }
              </li>
            }
          </ol>
        </nav>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .portal-crumbs-bar {
      background: var(--av-inst-bar-bg, var(--servial-red, #dc2626));
      color: var(--av-inst-bar-text, #fff);
      font-size: 0.78rem;
      letter-spacing: 0.04em;
    }

    .portal-crumbs-bar__inner {
      display: flex;
      align-items: center;
      min-height: 2rem;
      padding: 0.45rem 0;
    }

    .portal-crumbs {
      margin: 0;
      width: 100%;
    }

    .portal-crumbs__list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem 0.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
      color: color-mix(in srgb, var(--av-inst-bar-text, #fff) 88%, transparent);
    }

    .portal-crumbs__item:not(:last-child)::after {
      content: '/';
      margin-left: 0.5rem;
      color: color-mix(in srgb, var(--av-inst-bar-text, #fff) 65%, transparent);
    }

    .portal-crumbs__link {
      color: var(--av-inst-bar-text, #fff);
      text-decoration: none;
      font-weight: 700;
    }

    .portal-crumbs__link:hover {
      text-decoration: underline;
      opacity: 0.92;
    }

    .portal-crumbs__current {
      color: var(--av-inst-bar-text, #fff);
      font-weight: 800;
    }
  `,
})
export class PortalBreadcrumbsComponent {
  @Input({ required: true }) items: PortalBreadcrumbItem[] = [];
}
