import "common/style.scss";
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

    fetch("markers/locations.json").then(r => r.json()).then(addJson);
    fetch("markers/pins.json").then(r => r.json()).then(addJson);
    fetch("markers/seeds.json").then(r => r.json()).then((categories: Schema.Category[]) => {
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
    fetch("markers/treasures.json").then(r => r.json()).then(addJson);
    fetch("markers/wiki.json").then(r => r.json()).then(addJson);
};