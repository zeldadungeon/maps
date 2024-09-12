import { LatLngTuple } from "leaflet";

export interface Category {
  name: string;
  link?: string;
  source: string;
  layers: Layer[];
}

export interface Layer {
  name?: string;
  link?: string;
  minZoom?: number;
  maxZoom?: number;
  icon?: { url: string; width: number; height: number };
  showLabelForZoomLevel?: number;
  markers: Marker[];
}

export interface Marker {
  coords: LatLngTuple;
  zoomAdjustedCoords?: { [zoom: number]: LatLngTuple };
  elv?: number;
  id: string;
  name: string;
  link: string;
  color: string;
  path?: LatLngTuple[];
  tags?: string[];
}

export interface ObjectCategory {
  name: string;
  markerCoords: LatLngTuple[];
}
