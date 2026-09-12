import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { PORTAL_ICON_CATEGORIES } from '../../core/constants/portal-icon-catalog.types';
import { PortalIconCatalogItem, PortalIconografiaConfig } from '../../core/constants/portal-icon-catalog.types';
import { portalIconPreviewGlyph } from '../../core/constants/portal-icon-builtin.data';
import { portalIconPickerItems } from '../../core/utils/portal-icon-catalog.util';
import { PortalIconPreviewComponent } from './portal-icon-preview.component';

@Component({
  selector: 'argo-portal-icon-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconPreviewComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PortalIconPickerComponent),
      multi: true,
    },
  ],
  templateUrl: './portal-icon-picker.component.html',
  styleUrl: './portal-icon-picker.component.scss',
})
export class PortalIconPickerComponent implements ControlValueAccessor {
  @Input() iconografia: Partial<PortalIconografiaConfig> | null = null;
  @Input() mode: 'vector' | 'emoji' | 'any' = 'any';
  @Input() placeholder = 'Elegir icono…';
  @Input() allowManual = true;
  @Output() picked = new EventEmitter<string>();

  value = '';
  disabled = false;
  galleryOpen = signal(false);
  search = signal('');
  category = signal('');

  readonly categories = PORTAL_ICON_CATEGORIES;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  filteredItems(): PortalIconCatalogItem[] {
    const q = this.search().trim().toLowerCase();
    const cat = this.category();
    return portalIconPickerItems(this.iconografia, this.mode).filter((item) => {
      if (cat && item.category !== cat) return false;
      if (!q) return true;
      return (
        item.slug.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
      );
    });
  }

  writeValue(value: string | null): void {
    this.value = String(value ?? '').trim();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  openGallery(): void {
    if (this.disabled) return;
    this.galleryOpen.set(true);
    this.onTouched();
  }

  closeGallery(): void {
    this.galleryOpen.set(false);
    this.search.set('');
    this.category.set('');
  }

  selectItem(item: PortalIconCatalogItem): void {
    this.applyValue(item.slug);
    this.closeGallery();
  }

  onManualInput(value: string): void {
    this.applyValue(value);
  }

  clearValue(): void {
    this.applyValue('');
  }

  previewGlyph(slug: string, item?: PortalIconCatalogItem): string {
    if (item) return portalIconPreviewGlyph(item.slug, item.kind, item.value);
    return portalIconPreviewGlyph(slug);
  }

  private applyValue(next: string): void {
    this.value = String(next ?? '').trim();
    this.onChange(this.value);
    this.picked.emit(this.value);
  }
}
