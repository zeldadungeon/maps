import * as L from "leaflet";
import * as ZDCRS from "common/ZDCRS";
import { Category } from "common/Category";
import { Control } from "common/Control";
import { Legend } from "common/Legend";
import { Marker } from "common/Marker";
import { MarkerContainer } from "common/MarkerContainer";
import { TileLayer } from "common/TileLayer";
import { params } from "common/QueryParameters";

interface Options extends L.MapOptions {
    tags?: string[];
}

export class Map extends L.Map {
    public taggedMarkers = <{[key: string]: MarkerContainer}>{};
    private legend: Legend;
    private tileLayer: TileLayer;

    private constructor(element: string | HTMLElement, options?: Options) {
        super(element, options);
    }

    // tslint:disable max-func-body-length TODO
    public static create(directory: string, mapSize: number, tileSize: number, options: Options = {}): Map {
        const maxZoom = Math.log(mapSize / tileSize) * Math.LOG2E;
        if (options.zoom == undefined) { options.zoom = maxZoom - 2; }

        let initLat = Number(params.x);
        if (isNaN(initLat)) { initLat = Number(params.lat); }
        let initLng = Number(params.y);
        if (isNaN(initLng)) { initLng = Number(params.lng); }
        if (!isNaN(initLat) && !isNaN(initLng)) { options.center = [initLat, initLng]; }

        const crs = ZDCRS.create(mapSize, tileSize);
        options.crs = crs;

        const bounds = L.latLngBounds(
            crs.pointToLatLng(L.point(0, mapSize), maxZoom),
            crs.pointToLatLng(L.point(mapSize, 0), maxZoom));
        options.maxBounds = bounds.pad(0.5);

        const tileLayer = TileLayer.create(
            `https://www.zeldadungeon.net/maps/${directory}/tiles/{z}/{x}_{y}.jpg`,
            tileSize,
            maxZoom,
            bounds);
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
                    L.DomEvent.addListener(result, "click", () => {
                        searchControl.close();
                        map.focusOn(m);
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

        if (!options.tags) { options.tags = []; }
        options.tags.push("Completed");

        const settingsContent = L.DomUtil.create("table", "zd-settings");
        options.tags.forEach(tag => {
            map.taggedMarkers[tag] = MarkerContainer.create();
            map.taggedMarkers[tag].show();

            const row = L.DomUtil.create("tr", "zd-settings__setting", settingsContent);
            const show = L.DomUtil.create("td", "zd-settings__button selectable selected", row);
            show.innerText = "Show";
            const hide = L.DomUtil.create("td", "zd-settings__button selectable", row);
            hide.innerText = "Hide";
            const label = L.DomUtil.create("th", "zd-settings__label", row);
            label.innerText = tag;

            L.DomEvent.addListener(show, "click", () => {
                if (!L.DomUtil.hasClass(show, "selected")) {
                    L.DomUtil.removeClass(hide, "selected");
                    L.DomUtil.addClass(show, "selected");
                    map.taggedMarkers[tag].show();
                }
            });
            L.DomEvent.addListener(hide, "click", () => {
                if (!L.DomUtil.hasClass(hide, "selected")) {
                    L.DomUtil.removeClass(show, "selected");
                    L.DomUtil.addClass(hide, "selected");
                    map.taggedMarkers[tag].hide();
                }
            });
        });
        const clearCompletionDataRow = L.DomUtil.create("tr", "zd-settings__setting", settingsContent);
        const clearCompletionData = L.DomUtil.create("td", "selectable", clearCompletionDataRow);
        clearCompletionData.setAttribute("colspan", "3");
        clearCompletionData.innerText = "Clear completion data";
        L.DomEvent.addListener(clearCompletionData, "click", () => {
            if (confirm("This will reset all pins that you've marked completed. Are you sure?")) {
                // TODO
                // clear marker container
                // clear localstorage
                // clear completed on any popup
              }
        });

        const settingsControl = Control.create({
            icon: "cog",
            content: settingsContent
        }).addTo(map);

        L.control.zoom({
            position: "topleft"
        }).addTo(map);

        searchControl.onOpen(() => {
            settingsControl.close();
            searchBox.focus();
        });
        settingsControl.onOpen(() => {
            searchControl.close();
            searchBox.blur();
        });

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

    public addMarker(marker: Marker): void {
        marker.addToMap(this);
        this.tileLayer.registerMarkerWithTiles(marker, this.project(marker.getLatLng(), 0));
        marker.tags.forEach(tag => {
            if (this.taggedMarkers[tag]) {
                this.taggedMarkers[tag].addMarker(marker);
            }
        });
        if (params.id === marker.id) {
            this.focusOn(marker);
        }
    }

    public navigatToMarkerById(id: string): void {
        const marker = this.tileLayer.getMarkerById(id);
        if (marker) {
            this.focusOn(marker);
        }
    }

    private focusOn(marker: Marker): void {
        this.legend.reset();
        this.setView(marker.getLatLng(), Math.max(marker.getMinZoom(), this.getZoom()));
        marker.openPopupWhenLoaded();
    }
}