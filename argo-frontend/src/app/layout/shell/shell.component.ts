import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'argo-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  collapsed = signal(false);

  user = computed(() => this.auth.user());
  userLabel = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    const name = `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim();
    return name || u.nickName || u.username;
  });

  menu: MenuItem[] = [
    { label: 'Dashboard',             icon: '◆', path: '/app/dashboard' },
    { label: 'Alumnos',               icon: '◉', path: '/app/alumnos' },
    { label: 'Programación de Clases', icon: '▤', path: '/app/clases' },
    { label: 'Facturación',           icon: '$',  path: '/app/facturacion' },
    { label: 'Instructores',          icon: '◈', path: '/app/instructores' },
    { label: 'Flujo de Caja',         icon: '⇅', path: '/app/caja' },
    { label: 'Vehículos',             icon: '◐', path: '/app/vehiculos' },
    { label: 'Config. Recibos',       icon: '⚙', path: '/app/config/recibos' },
    { label: 'Config. Certificados',  icon: '▣', path: '/app/config/certificados' },
  ];

  toggle() { this.collapsed.update((v) => !v); }
  logout() { this.auth.logout(); this.router.navigateByUrl('/login'); }
}
