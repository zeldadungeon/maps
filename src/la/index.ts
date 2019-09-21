import "common/style.scss";
import * as Schema from "common/JSONSchema";
import { Category } from "common/Category";
import { Map } from "common/Map";

window.onload = async () => {

    const map = Map.create("la", 1000, 125, {
        center: [0, 0],
        zoom: 2
    });

    function addJson(categories: Schema.Category[]): void {
        categories.forEach(c => map.addCategory(Category.fromJSON(c)));
    }

    const pins = await fetch("/la/markers/pins.json");
    addJson(await pins.json());

    await map.initializeWikiConnector();
};