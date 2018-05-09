import { LatLngTuple } from "leaflet";

export interface Category {
    name: string;
    minZoom?: number;
    maxZoom?: number;
    source: string;
    icons: { url: string; width: number; height: number }[];
    markers: Marker[];
}

export interface Marker {
    coords: LatLngTuple;
    id: string;
    name: string;
    link: string;
    icon?: number;
}