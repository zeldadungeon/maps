import "./style.scss";
import * as $ from "jquery";
import * as L from "leaflet";
import * as Schema from "common/JSONSchema";
import { Category } from "common/Category";
import { Map } from "common/Map";
import { Marker } from "common/Marker";
import { params } from "common/QueryParameters";

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
if (isNaN(initLat)) { initLat = -3750; }
let initLng = Number(params.y);
if (isNaN(initLng)) { initLng = Number(params.lng); }
if (isNaN(initLng)) { initLng = -1900; }

const map = Map.create("botw", 24000, 750, {
        center: [initLat, initLng]
    });

$.getJSON("markers/treasures.json", (categories: Schema.Category[]) => {
        categories.forEach(c => {
            const category = Category.fromJSON(c).addTo(map);
            c.markers.map(Marker.fromJSON).forEach(m => {
                m.addToCategory(category);
                map.registerMarkerWithTiles(m);
            });
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