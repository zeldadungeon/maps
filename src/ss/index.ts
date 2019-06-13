import "common/style.scss";
import * as Schema from "common/JSONSchema";
import { Category } from "common/Category";
import { Map } from "common/Map";

window.onload = () => {
    const map = Map.create("ss", 500, 125, {
        center: [0, 0]
    });

    function addJson(categories: Schema.Category[]): void {
        categories.forEach(c => map.addCategory(Category.fromJSON(c)));
    }
};