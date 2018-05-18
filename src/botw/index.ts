import "./style.scss";
import * as $ from "jquery";
import * as Schema from "common/JSONSchema";
import { Category } from "common/Category";
import { Map } from "common/Map";
import { params } from "common/QueryParameters";

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

    $.getJSON("markers/pins.json", (categories: Schema.Category[]) => {
        categories.forEach(c => Category.fromJSON(c).addToMap(map));
    });

    $.getJSON("markers/treasures.json", (categories: Schema.Category[]) => {
        categories.forEach(c => Category.fromJSON(c).addToMap(map));
    });

    map.on("click", e => {
        console.log((<any>e).latlng);
        map.panTo((<any>e).latlng);
    });
};