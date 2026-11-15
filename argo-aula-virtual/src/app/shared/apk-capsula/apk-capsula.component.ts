import { Component, input } from '@angular/core';

@Component({
  selector: 'av-apk-capsula',
  standalone: true,
  templateUrl: './apk-capsula.component.html',
  styleUrl: './apk-capsula.component.scss',
})
export class ApkCapsulaComponent {
  tieneApk = input(false);
  alineada = input(false);
}
