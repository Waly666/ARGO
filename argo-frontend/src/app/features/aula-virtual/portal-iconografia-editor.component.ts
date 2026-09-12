import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PORTAL_BUILTIN_ICON_CATALOG } from '../../core/constants/portal-icon-builtin.data';
import {
  PortalIconCatalogItem,
  PortalIconKind,
  PortalIconografiaConfig,
  PORTAL_ICON_CATEGORIES,
} from '../../core/constants/portal-icon-catalog.types';
import { createCustomPortalIcon } from '../../core/utils/portal-icon-catalog.util';
import { portalIconPreviewGlyph } from '../../core/constants/portal-icon-builtin.data';
import { PortalIconPreviewComponent } from './portal-icon-preview.component';

@Component({
  selector: 'argo-portal-iconografia-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconPreviewComponent],
  templateUrl: './portal-iconografia-editor.component.html',
  styleUrl: './portal-iconografia-editor.component.scss',
})
export class PortalIconografiaEditorComponent {
  @Input({ required: true }) iconografia!: PortalIconografiaConfig;

  readonly categories = PORTAL_ICON_CATEGORIES;
  readonly builtinIcons = PORTAL_BUILTIN_ICON_CATALOG;

  search = signal('');
  showForm = signal(false);

  draft = {
    label: '',
    slug: '',
    category: 'general',
    kind: 'emoji' as PortalIconKind,
    value: '',
    aliasTarget: 'shield-check',
  };

  filteredBuiltin = computed(() => {
    const q = this.search().trim().toLowerCase();
    const hidden = new Set(this.iconografia.hiddenBuiltin || []);
    return this.builtinIcons.filter((item) => {
      if (hidden.has(item.slug)) return false;
      if (!q) return true;
      return item.slug.includes(q) || item.label.toLowerCase().includes(q);
    });
  });

  previewGlyph(item: PortalIconCatalogItem): string {
    return portalIconPreviewGlyph(item.slug, item.kind, item.value);
  }

  isHidden(slug: string): boolean {
    return (this.iconografia.hiddenBuiltin || []).includes(slug);
  }

  toggleBuiltin(slug: string): void {
    const hidden = new Set(this.iconografia.hiddenBuiltin || []);
    if (hidden.has(slug)) hidden.delete(slug);
    else hidden.add(slug);
    this.iconografia.hiddenBuiltin = [...hidden];
  }

  openCreate(): void {
    this.draft = {
      label: '',
      slug: '',
      category: 'general',
      kind: 'emoji',
      value: '',
      aliasTarget: 'shield-check',
    };
    this.showForm.set(true);
  }

  cancelCreate(): void {
    this.showForm.set(false);
  }

  saveCustom(): void {
    const value =
      this.draft.kind === 'alias' ? this.draft.aliasTarget.trim() : this.draft.value.trim();
    if (!value) return;
    const item = createCustomPortalIcon({
      slug: this.draft.slug,
      label: this.draft.label,
      category: this.draft.category,
      kind: this.draft.kind,
      value,
    });
    if (!this.iconografia.custom) this.iconografia.custom = [];
    const idx = this.iconografia.custom.findIndex((x) => x.slug === item.slug);
    if (idx >= 0) this.iconografia.custom[idx] = item;
    else this.iconografia.custom.push(item);
    this.showForm.set(false);
  }

  removeCustom(index: number): void {
    this.iconografia.custom.splice(index, 1);
  }

  setCustomActive(index: number, active: boolean): void {
    const item = this.iconografia.custom[index];
    if (item) item.activo = active;
  }
}
