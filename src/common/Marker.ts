import * as L from "leaflet";
import * as Schema from "JSONSchema";
import { Layer } from "Layer";
import { Map } from "Map";
import { MarkerContainer } from "MarkerContainer";
import { Popup } from "common/Popup";

export class Marker extends L.Marker {
    public id: string;
    public name: string;
    public tags: string[];
    private map: Map;
    private layer: Layer;
    private tileContainers = <MarkerContainer[]>[];
    private path: L.Polyline;
    private popup: Popup;

    private constructor(id: string, name: string, coords: L.LatLngExpression, icon: L.Icon) {
        super(coords, {
            title: name,
            icon: icon
        });
        this.id = id;
        this.name = name;
    }

    public static fromJSON(json: Schema.Marker, layer: Layer): Marker {
        const icon = layer.icon || L.divIcon({
            className: "zd-void-icon"
        });
        const marker = new Marker(json.id, json.name, json.coords, icon);
        marker.layer = layer;
        marker.tags = json.tags || [];
        const linkParts = json.link ? json.link.split("#") : [];
        const editLink = `${
            layer.infoSource === "summary" || layer.infoSource === "section" || !layer.infoSource ? linkParts[0] :
            layer.infoSource === "subpage" && linkParts[1] ? `${linkParts[0]}/Map/${linkParts[1]}` :
            layer.infoSource === "subpage" ? `${linkParts[0]}/Map` : linkParts[0]
        }`;

        if (layer.icon) {
            marker.popup = Popup.create({
                id: json.id,
                name: json.name,
                link: json.link,
                editLink: editLink,
                getWikiConnector: () => marker.map.wiki,
                complete: () => {
                    marker.map.wiki.complete(marker.id);
                    marker.complete();
                },
                uncomplete: () => {
                    marker.map.wiki.uncomplete(marker.id);
                    marker.map.taggedMarkers.Completed.removeMarker(marker);
                    const tag = marker.tags.indexOf("Completed");
                    if (tag > -1) {
                        marker.tags.splice(tag, 1);
                    }
                    marker.updateVisibility();
                },
                linkClicked: target => {
                    marker.map.navigateToMarkerById(target);
                }
            });
            marker.bindPopup(marker.popup);
            marker.on("popupopen", () => {
                if (layer.infoSource === "summary") {
                    marker.popup.loadContentFromSummary(linkParts[0]);
                } else if (layer.infoSource === "section") {
                    marker.popup.loadContentFromSection(
                        linkParts[0],
                        json.id.match(/^Seed\d{3}$/) ? `${json.id}summary` : linkParts[1] || "summary");
                } else if (layer.infoSource === "subpage") {
                    marker.popup.loadContentFromSubpage(linkParts[0], linkParts[1]);
                } else if (layer.infoSource) {
                    marker.popup.loadContentFromPage(layer.infoSource);
                }
            });
        } else {
            marker.bindTooltip(json.name, {
                permanent: true,
                direction: "center",
                className: "zd-location-label"
            }).openTooltip();
        }

        if (json.path) {
            marker.path = L.polyline(json.path, {
                color: "#ffffff"
            });
        }

        return marker;
    }

    public addToTileContainer(container: MarkerContainer): void {
        this.tileContainers.push(container);
        this.updateVisibility();
    }

    public addToMap(map: Map): void {
        this.map = map;
        this.updateVisibility();
    }

    public complete(): void {
        this.map.taggedMarkers.Completed.addMarker(this);
        this.tags.push("Completed");
        this.popup.markCompleted();
        this.updateVisibility();
    }

    public clearCompletion(): void {
        const tag = this.tags.indexOf("Completed");
        if (tag > -1) {
            this.tags.splice(tag, 1);
        }
        this.popup.markUncompleted();
        this.updateVisibility();
    }

    public updateVisibility(): void {
        if (this.layer && this.tileContainers.some(c => c.isVisible()) && this.tags.every(tag =>
            !this.map.taggedMarkers[tag] || this.map.taggedMarkers[tag].isVisible())) {
            this.addTo(this.layer);
            if (this.path) { this.path.addTo(this.layer); }
        } else if (this.layer) {
            this.layer.removeLayer(this); // removeFrom only takes Map for some reason?
            if (this.path) { this.layer.removeLayer(this.path); }
        }
    }

    public openPopupWhenLoaded(): void {
        if (this.layer.hasLayer(this) && this.layer.isVisible()) {
            this.openPopup();
        } else {
            const func = () => {
                this.off("add", func);
                this.layer.off("add", func);
                if (!this.layer.hasLayer(this)) {
                    this.on("add", func);
                } else if (!this.layer.isVisible()) {
                    this.layer.on("add", func);
                } else {
                    this.openPopup();
                }
            };
            func();
        }
    }

    public getIconUrl(): string {
        return this.layer.getIconUrl();
    }

    public getIconWidth(): number {
        return this.layer.getIconWidth();
    }

    public getMinZoom(): number {
        return this.layer.getMinZoom();
    }
}