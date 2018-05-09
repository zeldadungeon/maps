import { LatLngTuple } from "leaflet";

export interface Category {
    name: string;
    minZoom?: number;
    maxZoom?: number;
    source: string;
    markers: Marker[];
}

export interface Marker {
    coords: LatLngTuple;
    id: string;
    name: string;
    link: string;
}