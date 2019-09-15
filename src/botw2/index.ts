import "common/style.scss";
import * as Schema from "common/JSONSchema";
import { Category } from "common/Category";
import { Map } from "common/Map";

window.onload = () => {

    const map = Map.create("botw2", 24000, 750, {
        center: [-3750, -1900]
    });

    function addJson(categories: Schema.Category[]): void {
        categories.forEach(c => map.addCategory(Category.fromJSON(c)));
    }
};