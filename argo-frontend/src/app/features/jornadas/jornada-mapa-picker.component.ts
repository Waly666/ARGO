import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { CoordsGeorefEvent, DeteGeorefe } from './jornada-georefe.util';

const DEFAULT_CENTER: L.LatLngExpression = [4.6097, -74.0817];
const DEFAULT_ZOOM = 6;
const DETAIL_ZOOM = 16;

@Component({
  selector: 'argo-jornada-mapa-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mapa-picker">
      <div class="map-toolbar">
        <button type="button" class="ghost mini" (click)="usarMiUbicacion()" [disabled]="geoLoading">
          {{ geoLoading ? 'Obteniendo GPS…' : 'Usar mi ubicación' }}
        </button>
        <span class="hint">Clic en el mapa o arrastre el marcador para fijar coordenadas.</span>
      </div>
      <div #mapHost class="map-host"></div>
    </div>
  `,
  styles: [
    `
      .mapa-picker {
        margin: 0.75rem 0;
      }
      .map-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }
      .map-toolbar .hint {
        font-size: 0.85rem;
        color: var(--text-dim, #9fb3e0);
      }
      .map-host {
        height: 280px;
        width: 100%;
        border-radius: var(--radius, 10px);
        border: 1px solid var(--line, rgba(120, 170, 255, 0.18));
        overflow: hidden;
        z-index: 0;
      }
      :host ::ng-deep .leaflet-container {
        background: #0a1628;
        font-family: inherit;
      }
    `,
  ],
})
export class JornadaMapaPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  @Input() lat: number | null = null;
  @Input() lng: number | null = null;

  @Output() coordsChange = new EventEmitter<CoordsGeorefEvent>();

  geoLoading = false;

  private map?: L.Map;
  private marker?: L.Marker;
  private ready = false;
  private readonly markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initMap();
    this.ready = true;
    this.syncFromInputs(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready || (!changes['lat'] && !changes['lng'])) return;
    this.syncFromInputs(false);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
  }

  usarMiUbicacion(): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) return;
    this.geoLoading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.geoLoading = false;
        this.emitCoords(pos.coords.latitude, pos.coords.longitude, 'DISPOSITIVO_MOVIL');
      },
      () => {
        this.geoLoading = false;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  private initMap(): void {
    this.map = L.map(this.mapHost.nativeElement, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.emitCoords(e.latlng.lat, e.latlng.lng, 'MAPA');
    });

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  private syncFromInputs(fly: boolean): void {
    if (this.lat != null && this.lng != null && Number.isFinite(this.lat) && Number.isFinite(this.lng)) {
      this.placeMarker(this.lat, this.lng, fly);
    }
  }

  private placeMarker(lat: number, lng: number, fly: boolean): void {
    if (!this.map) return;
    const ll: L.LatLngExpression = [lat, lng];
    if (!this.marker) {
      this.marker = L.marker(ll, { draggable: true, icon: this.markerIcon }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker?.getLatLng();
        if (!pos) return;
        this.emitCoords(pos.lat, pos.lng, 'MAPA', false);
      });
    } else {
      this.marker.setLatLng(ll);
    }
    if (fly) {
      this.map.setView(ll, DETAIL_ZOOM, { animate: true });
    }
  }

  private emitCoords(lat: number, lng: number, deteGeorefe: DeteGeorefe, fly = true): void {
    this.placeMarker(lat, lng, fly);
    this.coordsChange.emit({ lat, lng, deteGeorefe });
  }
}
