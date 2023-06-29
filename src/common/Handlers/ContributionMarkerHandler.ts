import { LatLng, LeafletMouseEvent, Marker } from "leaflet";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { ZDMap, ZDMapOptions } from "common/ZDMap";
import { ZDHandler } from "./ZDHandler";

export class ContributionMarkerHandler extends ZDHandler {
  name = "Contribution Marker";
  private contributionMarker = new Marker([0, 0], {
    draggable: true,
  }).bindPopup("");
  constructor(protected map: ZDMap, private zdMapOptions: ZDMapOptions) {
    super();
    if (import.meta.env.PROD) {
      // Fix Vite not resolving icon url from node_modules/leaflet/dist
      this.contributionMarker.getIcon().options.iconUrl = markerIconUrl;
      this.contributionMarker.getIcon().options.iconRetinaUrl =
        markerIconRetinaUrl;
      this.contributionMarker.getIcon().options.shadowUrl = markerShadowUrl;
    }
  }
  addHooks(): void {
    this.map.on("click", this.displayMarker, this);
    this.contributionMarker.on("drag", this.dragMarker, this);
    this.contributionMarker.on("click", this.removeMarker, this);
  }
  removeHooks(): void {
    this.map.off("click", this.displayMarker, this);
    this.contributionMarker.off("drag", this.dragMarker, this);
    this.contributionMarker.off("click", this.removeMarker, this);
    this.removeMarker();
  }

  private setPopupContent(latlng: LatLng) {
    const wikiContributeLink = `<a target="_blank" href="https://zeldadungeon.net/wiki/Zelda Dungeon:${this.zdMapOptions.gameTitle} Map">Contribute Marker</a>`;
    this.contributionMarker.setPopupContent(
      `{{Pin|${Math.round(latlng.lng)}|${Math.round(
        latlng.lat
      )}||&lt;name&gt;}}<br />${wikiContributeLink}<br /><br />Contribution Marker can be<br />disabled in the Settings`
    );
  }

  private displayMarker(e: LeafletMouseEvent) {
    this.setPopupContent(e.latlng);
    this.contributionMarker.setLatLng(e.latlng).addTo(this.map).openPopup();
  }

  private dragMarker() {
    const latlng = this.contributionMarker.getLatLng();
    this.setPopupContent(latlng);
    this.contributionMarker.openPopup();
  }

  private removeMarker() {
    this.contributionMarker.removeFrom(this.map);
  }
}
