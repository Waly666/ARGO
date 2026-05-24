import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'argo-caja-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './caja-layout.component.html',
  styleUrls: ['./caja-layout.component.scss'],
})
export class CajaLayoutComponent {
  private auth = inject(AuthService);
  isAdmin = signal(String(this.auth.user()?.rol || '').toLowerCase().includes('admin'));
}
