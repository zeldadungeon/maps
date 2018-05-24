import "common/style.scss";
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

    function addJson(categories: Schema.Category[]): void {
        categories.forEach(c => map.addCategory(Category.fromJSON(c)));
    }

    $.getJSON("markers/locations.json", addJson);

    $.getJSON("markers/pins.json", addJson);

    $.getJSON("markers/seeds.json", (categories: Schema.Category[]) => {
        // took some shortcuts to reduce file size, gotta fix them
        const layer = categories[0].layers[0];
        layer.markers = layer.markers.map((m: any) => {
            return {
                coords: m.coords[0],
                id: m.id,
                name: categories[0].name,
                link: `${m.loc}#${m.id}`,
                path: m.coords
            };
        });
        addJson(categories);
    });

    $.getJSON("markers/treasures.json", addJson);

    $.getJSON("markers/wiki.json", addJson);

    map.on("click", e => {
        console.log((<any>e).latlng);
        map.panTo((<any>e).latlng);
    });
};