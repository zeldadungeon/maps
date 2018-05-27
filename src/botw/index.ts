import "common/style.scss";
import * as $ from "jquery";
import * as Schema from "common/JSONSchema";
import { Category } from "common/Category";
import { Map } from "common/Map";

window.onload = () => {
    const map = Map.create("botw", 24000, 750, {
        center: [-3750, -1900],
        tags: ["Master Mode", "DLC"]
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
                path: m.coords.length > 1 ? m.coords : undefined
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