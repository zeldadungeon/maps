import { LatLngTuple } from "leaflet";

export interface Category {
    name: string;
    source: string;
    markers: Marker[];
}

export interface Marker {
    coords: LatLngTuple;
    id: string;
    name: string;
    link: string;
}