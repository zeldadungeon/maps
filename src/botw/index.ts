import "common/style.scss";
import * as Schema from "common/JSONSchema";
import { Category } from "common/Category";
import { LocalStorage } from "common/LocalStorage";
import { Map } from "common/Map";

window.onload = () => {
    // migrate settings
    const settingsStore = LocalStorage.getStore("botw", "settings");
    function migrateSetting(oldKey: string, newKey: string): void {
        const val = LocalStorage.getLegacyItem(oldKey);
        if (val != undefined) {
            localStorage.removeItem(oldKey);
            if (val) {
                settingsStore.setItem(newKey, false);
            }
        }
    }
    migrateSetting("hideCompleted", "show-Completed");
    migrateSetting("hideDLC", "show-DLC");
    migrateSetting("hideMasterMode", "show-Master Mode");
    if (LocalStorage.getLegacyItem("fixedTreasures") != undefined) {
        localStorage.removeItem("fixedTreasures");
    }

    const map = Map.create("botw", 24000, 750, {
        center: [-3750, -1900],
        tags: ["Master Mode", "DLC"]
    });

    function addJson(categories: Schema.Category[]): void {
        categories.forEach(c => map.addCategory(Category.fromJSON(c)));
    }

    function getMarkers(): void {
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
    }

    // migrate completion
    const completion = LocalStorage.getLegacyItem("completion");
    if (completion != undefined) {
        fetch("markers/migrate.json").then(r => r.json()).then(migrate => {
            const completionStore = LocalStorage.getStore("botw", "completion");
            Object.keys(completion).forEach(key => {
                if (completion[key]) {
                    completionStore.setItem(migrate[key] || key, true);
                }
            });
            localStorage.removeItem("completion");
            getMarkers();
        });
    } else {
        getMarkers();
    }
};