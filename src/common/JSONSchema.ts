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
  markers: Marker[];
}

export interface Marker {
  coords: LatLngTuple;
  elv?: number;
  id: string;
  name: string;
  link: string;
  path?: LatLngTuple[];
  tags?: string[];
}
