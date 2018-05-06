import "./style.scss";
import * as $ from "jquery";
import * as L from "leaflet";
import * as Schema from "common/JSONSchema";
import * as ZDCRS from "common/ZDCRS";
import { params } from "common/QueryParameters";

const MAP_SIZE = 24000;
const TILE_SIZE = 750;
const MIN_ZOOM = 0;
const MAX_ZOOM = Math.log(MAP_SIZE / TILE_SIZE) * Math.LOG2E;

// lets webpack serve the marker icon
delete (<any>L.Icon.Default.prototype)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"), // tslint:disable-line no-require-imports no-submodule-imports
    iconUrl: require("leaflet/dist/images/marker-icon.png"), // tslint:disable-line no-require-imports no-submodule-imports
    shadowUrl: require("leaflet/dist/images/marker-shadow.png") // tslint:disable-line no-require-imports no-submodule-imports
});

window.onload = () => {
    let initLat = Number(params.x);
    if (isNaN(initLat)) { initLat = Number(params.lat); }
    if (isNaN(initLat)) { initLat = -4580; }
    let initLng = Number(params.y);
    if (isNaN(initLng)) { initLng = Number(params.lng); }
    if (isNaN(initLng)) { initLng = -2000; }

    const map = L.map("map", {
        crs: ZDCRS.create(MAP_SIZE, TILE_SIZE),
        center: [initLat, initLng],
        zoom: MAX_ZOOM - 1,
        maxBounds: L.latLngBounds(
            L.latLng(-MAP_SIZE, -MAP_SIZE),
            L.latLng(MAP_SIZE, MAP_SIZE))
    });

    L.tileLayer("https://www.zeldadungeon.net/Zelda16/Map/{z}j/{x}-{y}.jpg", {
        tileSize: TILE_SIZE,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        bounds: L.latLngBounds(
            map.unproject([0, MAP_SIZE], MAX_ZOOM),
            map.unproject([MAP_SIZE, 0], MAX_ZOOM)),
        noWrap: true
    }).addTo(map);

    $.getJSON("treasures.json", (categories: Schema.Category[]) => {
        categories.forEach(c => {
            const markers = <L.Marker[]>[];
            c.markers.forEach(m => {
                markers.push(L.marker(m.coords));
            });
            L.layerGroup(markers).addTo(map);
        });
    });

/*
    L.marker([0, 0]).addTo(map)
        .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
        .openPopup();
*/

    map.on("click", e => {
        console.log((<any>e).latlng);
        map.panTo((<any>e).latlng);
    });
};