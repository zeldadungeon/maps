import { DomEvent, DomUtil } from "leaflet";
import { ControlPane } from "./ControlPane";
import { ZDMarker } from "../ZDMarker";
import { MapLayer } from "../MapLayer";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faSearch);

export interface LayerSearchResults {
  layer: MapLayer;
  matches: ZDMarker[];
}

/**
 * Search control
 */
export class SearchControl extends ControlPane {
  public constructor(
    layers: MapLayer[],
    resultSelected: (selection: ZDMarker, layer: MapLayer) => void
  ) {
    super({
      icon: "fa-search",
      title: "Search",
    });

    const searchBox = <HTMLInputElement>(
      DomUtil.create("input", "zd-search__searchbox", this.container)
    );
    searchBox.setAttribute("type", "text");
    searchBox.setAttribute("placeholder", "Search");
    const results = DomUtil.create("ul", "zd-search__results", this.container);

    let searchVal = "";
    DomEvent.addListener(searchBox, "input", (e) => {
      DomUtil.empty(results);
      const searchStr = searchBox.value;
      // length > 2 and either value changed or on focus
      if (
        searchStr &&
        searchStr.length > 2 &&
        (searchVal !== searchStr || e.type === "focus")
      ) {
        // regex (escape regex chars)
        const searchRegex = new RegExp(
          searchStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          "i"
        );

        for (const layer of layers) {
          const matches = layer.findMarkers(searchRegex);
          if (matches.length > 0) {
            const layerResultsItem = DomUtil.create(
              "li",
              "zd-legend-group",
              results
            );

            if (layers.length > 1) {
              const layerHeader = DomUtil.create(
                "div",
                "zd-legend-group__header",
                layerResultsItem
              );
              DomUtil.create(
                "div",
                "zd-legend-group__title",
                layerHeader
              ).innerText = layer.layerName;
            }

            const layerResultsList = DomUtil.create(
              "ul",
              "zd-legend-group__body visible",
              layerResultsItem
            );
            for (const marker of matches) {
              const result = DomUtil.create(
                "li",
                "zd-legend__category-div",
                layerResultsList
              );

              const icon = DomUtil.create("img", "", result);
              icon.src = marker.getIconUrl();
              //Check if URL ends in .png or .svg
              if (icon.src.endsWith(".svg")) {
                DomUtil.addClass(icon, "zd-legend__icon__svg");
              } else {
                DomUtil.addClass(icon, "zd-legend__icon");
              }
              //Set size of image container, make sure they all share the same centre
              const iconSize = 35;
              icon.style.width = iconSize + "px";
              icon.style.height = iconSize + "px";
              //Scale image using transform scale to get proper size without changing border size
              icon.style.transform = `scale(${
                marker.getIconWidth() / iconSize
              }, ${marker.getIconHeight() / iconSize})`;

              DomUtil.create(
                "div",
                "zd-legend__category selectable",
                result
              ).innerText = marker.name;

              DomEvent.addListener(result, "click", () => {
                resultSelected(marker, layer);
              });
            }
          }
        }
      }
      // save current value
      searchVal = searchStr || "";
    });
  }
}
