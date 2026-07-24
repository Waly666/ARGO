import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'argo-contabilidad-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `<main class="contab-main"><router-outlet /></main>`,
  styles: [
    `
      :host {
        display: block;
      }
      .contab-main {
        min-width: 0;
      }
    `,
  ],
})
export class ContabilidadLayoutComponent {}
