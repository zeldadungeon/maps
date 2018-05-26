import * as L from "leaflet";
import * as ZDCRS from "common/ZDCRS";
import { Category } from "common/Category";
import { Control } from "common/Control";
import { Legend } from "common/Legend";
import { Marker } from "common/Marker";
import { TileLayer } from "common/TileLayer";

export class Map extends L.Map {
    private legend: Legend;
    private tileLayer: TileLayer;

    private constructor(element: string | HTMLElement, options?: L.MapOptions) {
        super(element, options);
    }

    public static create(directory: string, mapSize: number, tileSize: number, options: L.MapOptions = {}): Map {
        const maxZoom = Math.log(mapSize / tileSize) * Math.LOG2E;
        const crs = ZDCRS.create(mapSize, tileSize);
        const bounds = L.latLngBounds(
            crs.pointToLatLng(L.point(0, mapSize), maxZoom),
            crs.pointToLatLng(L.point(mapSize, 0), maxZoom));
        const tileLayer = TileLayer.create(
            `https://www.zeldadungeon.net/maps/${directory}/tiles/{z}/{x}_{y}.jpg`,
            tileSize,
            maxZoom,
            bounds);

        if (options.zoom == undefined) { options.zoom = maxZoom - 2; }
        options.crs = crs;
        options.maxBounds = bounds.pad(0.5);
        options.layers = [tileLayer];
        options.zoomControl = false; // adding it later, below our own controls

        const map = new Map("map", options);
        map.tileLayer = tileLayer;

        const searchContent = L.DomUtil.create("div", "zd-search");
        const searchBox = <HTMLInputElement>L.DomUtil.create("input", "zd-search__searchbox", searchContent);
        searchBox.setAttribute("type", "text");
        searchBox.setAttribute("placeholder", "Search");
        const results = L.DomUtil.create("ul", "zd-search__results", searchContent);
        let searchVal = "";
        L.DomEvent.addListener(searchBox, "input", e => {
            L.DomUtil.empty(results);
            const searchStr = searchBox.value;
            // length > 2 and either value changed or on focus
            if (searchStr && searchStr.length > 2 && (searchVal !== searchStr || e.type === "focus")) {
                // regex (escape regex chars)
                const searchRegex = new RegExp(searchStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
                tileLayer.findMarkers(searchRegex).forEach(m => {
                    const result = L.DomUtil.create("li", "zd-search__result", results);
                    result.innerText = m.name;
                    result.style.backgroundImage = `url(${m.getIconUrl()})`;
                    result.style.backgroundPosition = `${(50 - m.getIconWidth()) / 2}px center`;
                    L.DomEvent.addListener(result, "click", evt => {
                        searchControl.close();
                        map.panTo(m.getLatLng());
                        m.openPopupWhenLoaded();
                    });
                });
            }
            // save current value
            searchVal = searchStr || "";
        });

        const searchControl = Control.create({
            icon: "search",
            content: searchContent
        }).addTo(map);

        const settingsContent = L.DomUtil.create("div");
        settingsContent.innerText = "TODO"; // TODO
        const settingsControl = Control.create({
            icon: "cog",
            content: settingsContent
        }).addTo(map);

        L.control.zoom({
            position: "topleft"
        }).addTo(map);

        searchControl.onOpen(() => settingsControl.close());
        settingsControl.onOpen(() => searchControl.close());

        map.legend = Legend.create({});
        map.legend.addTo(map);

        return map;
    }

    public addCategory(category: Category): void {
        category.addToMap(this);
        if (category.displayOrderLarge != undefined) {
            this.legend.addCategory(category, category.displayOrderLarge);
        }
    }

    public registerMarkerWithTiles(marker: Marker): void {
        this.tileLayer.registerMarkerWithTiles(marker, this.project(marker.getLatLng(), 0));
    }
}