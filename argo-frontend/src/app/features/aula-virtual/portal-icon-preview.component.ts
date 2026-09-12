import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { portalIconPreviewGlyph } from '../../core/constants/portal-icon-builtin.data';
import {
  PortalIconCatalogItem,
  PortalIconografiaConfig,
} from '../../core/constants/portal-icon-catalog.types';
import { findPortalIconCatalogItem } from '../../core/utils/portal-icon-catalog.util';
import { resolveUploadAssetUrl } from '../../core/utils/upload-asset-url.util';

@Component({
  selector: 'argo-portal-icon-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="pip" [class.pip--image]="kind === 'image'">
      @if (kind === 'image' && imageUrl) {
        <img [src]="imageUrl" [alt]="label" />
      } @else {
        <span class="pip__glyph" aria-hidden="true">{{ glyph }}</span>
      }
    </span>
  `,
  styles: [
    `
      .pip {
        display: inline-grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 10px;
        border: 1px solid var(--line, rgba(120, 170, 255, 0.18));
        background: rgba(6, 16, 41, 0.55);
        flex-shrink: 0;
      }
      .pip--image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: inherit;
      }
      .pip__glyph {
        font-size: 1.35rem;
        line-height: 1;
      }
    `,
  ],
})
export class PortalIconPreviewComponent implements OnInit, OnChanges {
  @Input() slug = '';
  @Input() iconografia: Partial<PortalIconografiaConfig> | null = null;

  item: PortalIconCatalogItem | null = null;
  kind = '';
  glyph = '◆';
  label = '';
  imageUrl = '';

  ngOnChanges(): void {
    this.refresh();
  }

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    const slug = String(this.slug ?? '').trim();
    this.item = findPortalIconCatalogItem(slug, this.iconografia);
    if (this.item) {
      this.kind = this.item.kind;
      this.label = this.item.label;
      if (this.item.kind === 'image') {
        this.imageUrl = resolveUploadAssetUrl(this.item.value) || this.item.value;
        this.glyph = '🖼️';
      } else {
        this.glyph = portalIconPreviewGlyph(this.item.slug, this.item.kind, this.item.value);
      }
      return;
    }
    this.kind = '';
    this.label = slug;
    this.imageUrl = '';
    this.glyph = portalIconPreviewGlyph(slug);
  }
}
