import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'argo-contabilidad-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contabilidad-hub.component.html',
  styleUrls: ['./contabilidad-hub.component.scss'],
})
export class ContabilidadHubComponent {}
