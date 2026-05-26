import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'argo-caja-cerrada-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './caja-cerrada-banner.component.html',
  styleUrls: ['./caja-cerrada-banner.component.scss'],
})
export class CajaCerradaBannerComponent {
  private router = inject(Router);

  @Input() blink = false;

  irAbrirCaja(): void {
    void this.router.navigate(['/app/caja'], { queryParams: { abrir: 1 } });
  }
}
