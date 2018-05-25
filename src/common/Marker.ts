import * as $ from "jquery";
import * as L from "leaflet";
import * as Schema from "JSONSchema";
import { Layer } from "Layer";
import { MarkerContainer } from "MarkerContainer";

export class Marker extends L.Marker {
    public id: string;
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
    }

    public static fromJSON(json: Schema.Marker, layer: Layer): Marker {
        const icon = layer.icon || L.divIcon({
            className: "zd-void-icon"
        });
        const marker = new Marker(json.id, json.name, json.coords, icon);
        marker.layer = layer;
        const linkParts = json.link ? json.link.split("#") : [];

        if (layer.icon) {
            const container = L.DomUtil.create("div", "zd-popup");
            const popup = L.popup({
                autoPan: true,
                maxWidth: 300
            }).setContent(container);
            marker.bindPopup(popup);

            const title = L.DomUtil.create("h3", "zd-popup__title", container);
            if (json.link) {
                const link = L.DomUtil.create("a", "", title);
                link.setAttribute("target", "_blank");
                link.setAttribute("href", `/wiki/${encodeURIComponent(json.link)}`);
                link.innerText = json.name;
            } else {
                title.innerText = json.name;
            }

            const body = L.DomUtil.create("div", "zd-popup__body", container);
            if (layer.infoSource) {
                const loading = L.DomUtil.create("div", "", body);
                loading.style.textAlign = "center";
                L.DomUtil.create("i", "fa fa-circle-o-notch fa-spin fa-3x fa-fw", loading);

                marker.on("popupopen", () => {
                    const contentPromise =
                        layer.infoSource === "summary" ? Marker.getContentFromSummary(linkParts[0]) :
                        layer.infoSource === "section" ? Marker.getContentFromSection(
                            linkParts[0],
                            json.id.match(/^Seed\d{3}$/) ? `${json.id}summary` : linkParts[1] || "summary") :
                        layer.infoSource === "subpage" ? Marker.getContentFromSubpage(linkParts[0], linkParts[1]) :
                        Marker.getContentFromPage(layer.infoSource);
                    contentPromise.then(content => {
                        body.innerHTML = content;
                        // TODO wire up internal links
                        // $('.internal-link').click(function(event) {
                        //     center({
                        //       target: $(event.target).data('target'),
                        //       lat: $(event.target).data('lat'),
                        //       lng: $(event.target).data('lng')
                        //     });
                        //   });
                        popup.setContent(container); // force it to resize and recenter
                    });
                });
            }

            const controls = L.DomUtil.create("div", "zd-popup__controls", container);
            const completeButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--complete", controls);
            L.DomUtil.create("i", "fa fa-check", completeButton).title = "Mark completed";
            const uncompleteButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--uncomplete", controls);
            L.DomUtil.create("i", "fa fa-undo", uncompleteButton).title = "Mark not completed";
            const editButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--edit", controls);
            editButton.setAttribute("target", "_blank");
            editButton.setAttribute("href", `/wiki/index.php?action=edit&title=${encodeURIComponent(
                layer.infoSource === "summary" || layer.infoSource === "section" || !layer.infoSource ? linkParts[0] :
                layer.infoSource === "subpage" && linkParts[1] ? `${linkParts[0]}/Map/${linkParts[1]}` :
                layer.infoSource === "subpage" ? `${linkParts[0]}/Map` : linkParts[0]
            )}`);
            L.DomUtil.create("i", "fa fa-edit", editButton).title = "Edit";
            const linkButton = L.DomUtil.create("a", "zd-popup__control zd-popup__control--permalink", controls);
            linkButton.setAttribute("href", `?id=${json.id}`);
            L.DomUtil.create("i", "fa fa-link", linkButton).title = "Permalink";

            // TODO
            L.DomEvent.addListener(completeButton, "click", () => {
                console.log(`Completed ${json.name}`);
            });
            L.DomEvent.addListener(uncompleteButton, "click", () => {
                console.log(`Uncompleted ${json.name}`);
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

    private static getContentFromSummary(pageTitle: string) {
        return $.getJSON(`https://www.zeldadungeon.net/wiki/api.php?format=json&action=query&prop=pageprops&titles=${encodeURIComponent(pageTitle)}&callback=?`)
            .then(result => {
                const pageId = Object.keys(result.query.pages)[0];

                return pageId === "-1" ? "" : `<p>${result.query.pages[pageId].pageprops.description}</p>`;
                // const description = L.DomUtil.create("p");
                // const pageId = Object.keys(result.query.pages)[0];
                // if (pageId !== "-1") {
                //     description.innerText = result.query.pages[pageId].pageprops.description;
                // }

                // return description;
            });
    }

    private static getContentFromSection(pageTitle: string, sectionName: string) {
        return $.getJSON(`https://www.zeldadungeon.net/wiki/api.php?format=json&action=parse&prop=text&contentmodel=wikitext&text=%7b%7b%23lst:${encodeURIComponent(pageTitle)}|${encodeURIComponent(sectionName)}}}&callback=?`)
            .then(result => {
                let text = result.parse.text["*"];
                text = text.replace(/\s*<!--[\s\S]*-->\s*/g, "");
                if (text.match(/page does not exist/)) {
                    text = text.replace(`>${name}</a>`, ">Create this article</a>");
                }

                return text;
            });
    }

    private static getContentFromSubpage(pageTitle: string, subsubpage: string) {
        const subpage = subsubpage ? `Map/${subsubpage}` : "Map";

        return Marker.getContentFromPage(`${pageTitle}/${subpage}`);
    }

    private static getContentFromPage(pageTitle: string) {
        return $.getJSON(`https://www.zeldadungeon.net/wiki/api.php?format=json&action=parse&page=${encodeURIComponent(pageTitle)}&callback=?`)
            .then(result => {
                return result.parse && result.parse.text["*"] || "";
            });
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
}