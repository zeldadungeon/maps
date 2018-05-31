import { LatLngTuple } from "leaflet";

export interface Category {
    name: string;
    source: string;
    displayOrder?: number;
    layers: Layer[];
}

export interface Layer {
    minZoom?: number;
    maxZoom?: number;
    icon?: { url: string; width: number; height: number };
    markers: Marker[];
}

export interface Marker {
    coords: LatLngTuple;
    id: string;
    name: string;
    link: string;
    path?: LatLngTuple[];
    tags?: string[];
}