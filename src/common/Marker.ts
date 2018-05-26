import * as L from "leaflet";
import * as Schema from "JSONSchema";
import { Layer } from "Layer";
import { MarkerContainer } from "MarkerContainer";
import { Popup } from "common/Popup";

export class Marker extends L.Marker {
    public id: string;
    public name: string;
    private layer: Layer;
    private tileContainers = <MarkerContainer[]>[];
    private containers = <MarkerContainer[]>[];
    private path: L.Polyline;

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
        const linkParts = json.link ? json.link.split("#") : [];
        const editLink = `${
            layer.infoSource === "summary" || layer.infoSource === "section" || !layer.infoSource ? linkParts[0] :
            layer.infoSource === "subpage" && linkParts[1] ? `${linkParts[0]}/Map/${linkParts[1]}` :
            layer.infoSource === "subpage" ? `${linkParts[0]}/Map` : linkParts[0]
        }`;

        if (layer.icon) {
            const popup = Popup.create({
                id: json.id,
                name: json.name,
                link: json.link,
                editLink: editLink,
                complete: () => {
                    console.log(`Completed ${json.name}`);
                },
                uncomplete: () => {
                    console.log(`Uncompleted ${json.name}`);
                }
            });
            marker.bindPopup(popup);
            marker.on("popupopen", () => {
                if (layer.infoSource === "summary") {
                    popup.loadContentFromSummary(linkParts[0]);
                } else if (layer.infoSource === "section") {
                    popup.loadContentFromSection(
                        linkParts[0],
                        json.id.match(/^Seed\d{3}$/) ? `${json.id}summary` : linkParts[1] || "summary");
                } else if (layer.infoSource === "subpage") {
                    popup.loadContentFromSubpage(linkParts[0], linkParts[1]);
                } else if (layer.infoSource) {
                    popup.loadContentFromPage(layer.infoSource);
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

    public updateVisibility(): void {
        if (this.layer && this.tileContainers.some(c => c.isVisible()) && this.containers.every(c => c.isVisible())) {
            this.addTo(this.layer);
            if (this.path) { this.path.addTo(this.layer); }
        } else if (this.layer) {
            this.layer.removeLayer(this); // removeFrom only takes Map for some reason?
            if (this.path) { this.layer.removeLayer(this.path); }
        }
    }

    public openPopupWhenLoaded(): void {
        const open = () => {
            this.openPopup();
            this.off("add", open);
        };
        if (this.layer.hasLayer(this)) {
            this.openPopup();
        } else {
            this.on("add", open);
        }
    }

    public getIconUrl(): string {
        return this.layer.getIconUrl();
    }

    public getIconWidth(): number {
        return this.layer.getIconWidth();
    }
}