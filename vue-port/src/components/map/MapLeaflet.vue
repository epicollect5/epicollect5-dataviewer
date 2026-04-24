<template>
  <div class="leaflet-map-shell">
    <div :ref="setMapElement" class="leaflet-map"></div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue';
import PARAMETERS from '@/core/config/parameters';
import mapUtils from '@/core/map/mapUtils';

const HEATMAP_OPTIONS = {
  radius: 10,
  minOpacity: 0.5,
  blur: 10
};

const CLUSTER_CONTROL_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAABPFJREFUeJztmFtoXFUUhs/Z5zIz5zKTi04mFxoKbZQYtSVaaSLtg00rxYdCFbxgrcUbiHh7EYqoWKX4pi9WxBdFUVDoSxX7IKXesFRFULFeQKIoGkFbCxIbU791ZiZJx3ObNJlTYX5YnJlz9l7rX3uvvfbaW9PaaKONNpJgWdYqpdROEdM01/T0VvSsOaVCqavDgPQDuq4fQ2aQU8gk7x7Og6z5xaLzvG5dGeoWIc7f0wuFd6dx4tFMCSbBMIxuiL4jZLUGBzQ9cGIyW4YJwIGVkPxGayQ/78RslvwSwWKNngHtfzADV22d0IhzWQOntAYneDfLt8cyppgMEo0tGQfCUxL3WpX8Sd7tZYa8rPmlhp3LbTNM4ytIb7dzdm/WfJqGzAKL+umseSwahM1rpmlta6lRtv8+Ru4+jL+IPKcM44b+gX6jWT2e53v0P5rPF7rStC9XypgyrqXPPrEtO7llWwNNGUXBRjr/KikwSIO1p67014nj85vRRfsNkDiUpi2D1kXbV+s25+zq+m94NZHKYKlUMujweT1raGemv78x8FAzDtD+LuSVlG3vx8Z0iF2Rr/2ibyYqIVsMxWw+Iu8PXzoSW00yg2OQeVbX1bu0/0n68H88yTbtDsXZhtsliQ5QgK3VlQrf/quKjhUcpz+avHkTVGZFx0KRcMCxnVH92DPK6P6CMI0bvLFEB1zPdWn4e9hIyA6KfIp8BKn3eL7AyO4iPi+27VwRgtfz7nhEX5ETtNmRy+V9niNKGXJGeB5dh0Unvz8RG/9xoNaXgfMTHRCg6EY6/FVbuHXjQfhIkeYXSxbPQdptJkwe5/2bPHFMsfDjZi+YiSkZBPrSR9+Dni0s9EHX83mYK3h3WJ9PGnW704TPranIC0qdwUFkFwo+rB1CjvN7PwaGw9qTPbrJ85sY0amoGJ6fBRVkFOkTpsswzQux9QZt/whsK2bGULd7Ra/pFN4UCIsyDkymcOAH1knPspJZDEyGlPD4ID6EgnA4YufyuSy5RoLQ2AHBP2MWsVSit2XLMgGExx3VM68RyFwa1YJ3Dw6vXX9u30iw0PulDGGkX5ZwqYnUNHsJr5dIt4WsOUai0jvAYKtnCKV75f/o+CZ1+ZUTSn6TwyWz7ZfbiItGRrIlGgVy+jpG+2PZ1MK/mxvkO7M01GpuibBgDbm3CJO7o9qsHrpAnNwu5TVJq9xKfokgjV5NeLzN8TG23M4XChZxxpow9rSKWyIIiY5aLXPN6GXrUrS3KrK4mYX1LaAXDtfzipDYDPmNhIWc3A54ftFK258+W+nzsxSPzN44zm8pOIWO5eQcwM7ZLsYeqVes9aILQruR1A709PUZ1DhSuJ1cUCyekCyWLyzTTu36vomB3Rj654wTW/Wuc5pv16XVJW2Di9+Fu7Y+d/H71LI4wAivYgF+H3HclB33APk+NIU2olqCRx5eZkkGodXqWQHFo7VDTdSN85fIYJIeansJtc8iK1d0cUJbs+QOMANyXv4xbAZEmPqDeafQmaTH8Ryd0TgYMwMzpmVWltwBcrjcdT4ZUW3OyGWu4zqpijUG4+Z6zDfokYHYt+Tk6yB3O8T6E7Xbhvo5+VuM3kncNnVqEifo+11tMYueX4Q8x4Xk65OzgeO5ivx/BQbvEeIcA4dXDK1clC70rJYzguhiPxhzfc9eYrpttNHGuYx/AZSPdMo2ZeDNAAAAAElFTkSuQmCC';
const BASE_LAYER_CONTROL_ICON =
  'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABGAAD/4QNxaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MDI4MDExNzQwNzIwNjgxMTgyMkFCOUVBNDcwNjdDN0EiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTYxNzExRkVGRjM1MTFFNkIwRTZENTk0MTZFMDhCMTMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTYxNzExRkRGRjM1MTFFNkIwRTZENTk0MTZFMDhCMTMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjAyODAxMTc0MDcyMDY4MTE4MjJBQjlFQTQ3MDY3QzdBIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjAyODAxMTc0MDcyMDY4MTE4MjJBQjlFQTQ3MDY3QzdBIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+4ADkFkb2JlAGTAAAAAAf/bAIQABAMDAwMDBAMDBAYEAwQGBwUEBAUHCAYGBwYGCAoICQkJCQgKCgwMDAwMCgwMDQ0MDBERERERFBQUFBQUFBQUFAEEBQUIBwgPCgoPFA4ODhQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAGAAYAwERAAIRAQMRAf/EAGYAAQAAAAAAAAAAAAAAAAAAAAgBAQAAAAAAAAAAAAAAAAAAAAAQAAAEBAIHCAMBAAAAAAAAAAERAgMSBAUGFAcAITEiExUXQWFxMmIlFhhCMwgZEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwBp5h5kWblZbcxdV71Num0tgBBsFDE/MOkYNMNhvOOK7Ep8RIDHQAJ/oXcnVv5JyVXTDgcu+OcUcVwuLxMZFFw8T2Q+SHcM9/QH3l5mRZuadty91WRU26lS3wAHASML8u6Ri0+2O824ntSrxAwIdANn9f2ZlDedXpFHvcanal0z6Fs0HMF1lxVutzMKRRJzjgrgSDpbQSkUkYqIwEA99Y84+oPTnkKuacPF80i9o5cZY3GFBwPV5vxhi3dAcP8AIFm5Q2bVqvR7HGp3XdEihDNezBaZdTbrszCoVykm4CwQoGj2ilQqOIFERAqrityg3bRpy3bmp7FUok+2LU3IzSAcaWke4dghtSoNYDrAT0A5/V67sR01+fVH64njPjcfuhxFyvGfswJbxH6SPf0BGW7blCtKjSdu2zT2KXRJBsGpSRlUA20hIdwbRHapQ6xHWInoH//Z';

export default {
  name: 'MapLeaflet',
  props: {
    markers: {
      type: Array,
      default: () => []
    },
    locations: {
      type: Array,
      default: () => []
    },
    totalMarkers: {
      type: Number,
      default: 0
    },
    clustersEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['marker-click'],
  setup(props, { emit }) {
    const state = reactive({
      mapElement: null,
      map: null,
      baseLayers: {},
      activeBaseLayer: PARAMETERS.MAP_BASE_LAYERS.CARTO,
      baseLayerControl: null,
      layerControl: null,
      baseLayerControlButton: null,
      baseLayerControlPanel: null,
      baseLayerControlGroup: null,
      layerControlButton: null,
      layerControlPanel: null,
      layerControlGroup: null,
      clustersLayer: null,
      heatmapLayer: null,
      markersLayer: null,
      activeOverlay: props.clustersEnabled ? PARAMETERS.MAP_OVERLAYS.CLUSTERS : PARAMETERS.MAP_OVERLAYS.MARKERS,
      hasInvalidatedInitialSize: false
    });

    const methods = {
      setMapElement(element) {
        state.mapElement = element;
      },
      createBaseLayers() {
        return {
          [PARAMETERS.MAP_BASE_LAYERS.SATELLITE]: L.tileLayer(PARAMETERS.ESRI_TILES_PROVIDER_SATELLITE, {
            attribution: PARAMETERS.ESRI_TILES_PROVIDER_ATTRIBUTION,
            maxNativeZoom: 17
          }),
          [PARAMETERS.MAP_BASE_LAYERS.TERRAIN]: L.tileLayer(PARAMETERS.OPENTOPO_TILES_PROVIDER, {
            attribution: PARAMETERS.OPENTOPO_TILES_ATTRIBUTION,
            maxNativeZoom: 17
          }),
          [PARAMETERS.MAP_BASE_LAYERS.CARTO]: L.tileLayer(PARAMETERS.CARTO_LIGHT_TILES_PROVIDER, {
            attribution: PARAMETERS.CARTO_TILES_ATTRIBUTION,
            maxNativeZoom: 20
          }),
          [PARAMETERS.MAP_BASE_LAYERS.CARTO_DARK]: L.tileLayer(PARAMETERS.CARTO_DARK_TILES_PROVIDER, {
            attribution: PARAMETERS.CARTO_DARK_TILES_ATTRIBUTION,
            maxNativeZoom: 20
          }),
          [PARAMETERS.MAP_BASE_LAYERS.OPEN_STREET_MAP]: L.tileLayer(PARAMETERS.OSM_TILES_PROVIDER, {
            attribution: PARAMETERS.OSM_TILES_ATTRIBUTION,
            maxNativeZoom: 20
          })
        };
      },
      syncActiveBaseLayer() {
        if (!state.map) {
          return;
        }

        Object.entries(state.baseLayers).forEach(([layerName, layer]) => {
          if (!layer) {
            return;
          }

          if (layerName === state.activeBaseLayer) {
            if (!state.map.hasLayer(layer)) {
              layer.addTo(state.map);
            }
            return;
          }

          if (state.map.hasLayer(layer)) {
            state.map.removeLayer(layer);
          }
        });

        methods.syncBaseLayerControl();
      },
      getMarkerColors() {
        if (typeof window === 'undefined') {
          return {
            border: '#76509b',
            fill: '#7044ff'
          };
        }

        const styles = window.getComputedStyle(document.documentElement);

        return {
          border: styles.getPropertyValue('--ion-color-primary-tint').trim() || '#76509b',
          fill: styles.getPropertyValue('--ion-color-tertiary').trim() || '#7044ff'
        };
      },
      getClusteredMarkers() {
        if (props.markers.length > 0 || props.locations.length === 0) {
          return props.markers;
        }

        return mapUtils.buildMarkerItems(props.locations, true).markers;
      },
      getUnclusteredMarkers() {
        if (props.locations.length === 0) {
          return props.markers;
        }

        return mapUtils.buildMarkerItems(props.locations, false).markers;
      },
      getHeatPoints() {
        return props.locations
          .map((entry) => {
            const coordinates = entry?.geometry?.coordinates || [];
            const longitude = Number(coordinates[0]);
            const latitude = Number(coordinates[1]);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            return [latitude, longitude];
          })
          .filter(Boolean);
      },
      canShowMarkersOverlay() {
        return props.totalMarkers < PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING;
      },
      buildLeafletMarker(marker) {
        const colors = methods.getMarkerColors();
        const radius = Math.min(24, 8 + marker.count * 2);
        const leafletMarker = L.circleMarker([marker.latitude, marker.longitude], {
          radius,
          weight: 2,
          color: colors.border,
          fillColor: colors.fill,
          fillOpacity: 1
        });

        leafletMarker.bindPopup(marker.popupHtml);
        leafletMarker.on('click', () => {
          methods.handleMarkerClick(marker);
        });

        return leafletMarker;
      },
      handleMarkerClick(marker) {
        emit('marker-click', marker);
      },
      invalidateMapSize() {
        window.setTimeout(() => {
          state.map?.invalidateSize();
        }, 0);
      },
      ensureInitialMapSize() {
        if (state.hasInvalidatedInitialSize) {
          return;
        }

        state.hasInvalidatedInitialSize = true;
        methods.invalidateMapSize();
      },
      closeActivePopup() {
        state.map?.closePopup();
      },
      removeRenderedLayers() {
        if (!state.map) {
          return;
        }

        [state.clustersLayer, state.heatmapLayer, state.markersLayer].forEach((layer) => {
          if (layer) {
            state.map.removeLayer(layer);
          }
        });
      },
      syncActiveOverlay() {
        if (!state.map) {
          return;
        }

        if (state.activeOverlay === PARAMETERS.MAP_OVERLAYS.MARKERS && !methods.canShowMarkersOverlay()) {
          state.activeOverlay = PARAMETERS.MAP_OVERLAYS.CLUSTERS;
        }

        methods.removeRenderedLayers();

        switch (state.activeOverlay) {
          case PARAMETERS.MAP_OVERLAYS.HEATMAP:
            if (state.heatmapLayer) {
              state.heatmapLayer.addTo(state.map);
            }
            break;
          case PARAMETERS.MAP_OVERLAYS.MARKERS:
            if (state.markersLayer && methods.canShowMarkersOverlay()) {
              state.markersLayer.addTo(state.map);
            }
            break;
          case PARAMETERS.MAP_OVERLAYS.CLUSTERS:
          default:
            if (state.clustersLayer) {
              state.clustersLayer.addTo(state.map);
            }
            break;
        }

        methods.syncOverlayControl();
      },
      getBaseLayerOptions() {
        return [
          {
            value: PARAMETERS.MAP_BASE_LAYERS.SATELLITE,
            label: PARAMETERS.MAP_BASE_LAYERS.SATELLITE
          },
          {
            value: PARAMETERS.MAP_BASE_LAYERS.TERRAIN,
            label: PARAMETERS.MAP_BASE_LAYERS.TERRAIN
          },
          {
            value: PARAMETERS.MAP_BASE_LAYERS.CARTO,
            label: PARAMETERS.MAP_BASE_LAYERS.CARTO
          },
          {
            value: PARAMETERS.MAP_BASE_LAYERS.CARTO_DARK,
            label: PARAMETERS.MAP_BASE_LAYERS.CARTO_DARK
          },
          {
            value: PARAMETERS.MAP_BASE_LAYERS.OPEN_STREET_MAP,
            label: PARAMETERS.MAP_BASE_LAYERS.OPEN_STREET_MAP
          }
        ];
      },
      getOverlayOptions() {
        const options = [
          {
            value: PARAMETERS.MAP_OVERLAYS.CLUSTERS,
            label: PARAMETERS.MAP_OVERLAYS.CLUSTERS
          },
          {
            value: PARAMETERS.MAP_OVERLAYS.HEATMAP,
            label: PARAMETERS.MAP_OVERLAYS.HEATMAP
          }
        ];

        if (methods.canShowMarkersOverlay()) {
          options.push({
            value: PARAMETERS.MAP_OVERLAYS.MARKERS,
            label: PARAMETERS.MAP_OVERLAYS.MARKERS
          });
        }

        return options;
      },
      expandLayerControl() {
        state.layerControl?.getContainer()?.classList.add('leaflet-control-layers-expanded');
      },
      collapseLayerControl() {
        state.layerControl?.getContainer()?.classList.remove('leaflet-control-layers-expanded');
      },
      expandBaseLayerControl() {
        state.baseLayerControl?.getContainer()?.classList.add('leaflet-control-layers-expanded');
      },
      collapseBaseLayerControl() {
        state.baseLayerControl?.getContainer()?.classList.remove('leaflet-control-layers-expanded');
      },
      syncOverlayControl() {
        if (!state.layerControlGroup) {
          return;
        }

        Array.from(state.layerControlGroup.querySelectorAll('input[type="radio"]')).forEach((input) => {
          input.checked = input.value === state.activeOverlay;
        });
      },
      syncBaseLayerControl() {
        if (!state.baseLayerControlGroup) {
          return;
        }

        Array.from(state.baseLayerControlGroup.querySelectorAll('input[type="radio"]')).forEach((input) => {
          input.checked = input.value === state.activeBaseLayer;
        });
      },
      createToggleControl({ options, onExpand, onCollapse, onChange, syncControlState, stateKeys, title, controlClassName, iconDataUri, iconSize = '30px 30px' }) {
        const { buttonKey, panelKey, groupKey } = stateKeys;

        return L.Control.extend({
          options: {
            position: 'topright'
          },
          onAdd() {
            const container = L.DomUtil.create('div', `leaflet-control-layers leaflet-control custom-map-layer-control ${controlClassName || ''}`.trim());
            container.setAttribute('aria-haspopup', 'true');

            const button = L.DomUtil.create('a', 'leaflet-control-layers-toggle', container);
            button.href = '#';
            button.title = title;
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', title);
            if (iconDataUri) {
              button.style.backgroundImage = `url("${iconDataUri}")`;
              button.style.backgroundRepeat = 'no-repeat';
              button.style.backgroundPosition = 'center';
              button.style.backgroundSize = iconSize;
            }

            const panel = L.DomUtil.create('section', 'leaflet-control-layers-list', container);
            const group = L.DomUtil.create('div', 'leaflet-control-layers-base custom-map-layer-control__group', panel);
            const radioName = `map-control-${L.Util.stamp(container)}`;

            options().forEach((option, index) => {
              const label = L.DomUtil.create('label', 'custom-map-layer-control__option', group);
              const row = L.DomUtil.create('div', 'custom-map-layer-control__row', label);
              const input = L.DomUtil.create('input', 'leaflet-control-layers-selector', row);
              input.type = 'radio';
              input.name = radioName;
              input.value = option.value;
              input.checked = Boolean(option.checked) || index === 0;
              input.disabled = Boolean(option.disabled);

              const bullet = L.DomUtil.create('span', 'custom-map-layer-control__bullet', row);
              bullet.setAttribute('aria-hidden', 'true');

              const text = L.DomUtil.create('span', 'custom-map-layer-control__label', row);
              text.textContent = option.label;
            });

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            container.addEventListener('mouseenter', onExpand);
            container.addEventListener('mouseleave', onCollapse);
            button.addEventListener('click', (event) => {
              event.preventDefault();
              container.classList.toggle('leaflet-control-layers-expanded');
            });
            button.addEventListener('focus', onExpand);
            group.addEventListener('change', onChange);

            state[buttonKey] = button;
            state[panelKey] = panel;
            state[groupKey] = group;

            window.setTimeout(() => {
              syncControlState();
            }, 0);

            return container;
          },
          onRemove() {
            state[buttonKey] = null;
            state[panelKey] = null;
            state[groupKey] = null;
          }
        });
      },
      rebuildBaseLayerControl() {
        if (!state.map) {
          return;
        }

        if (state.baseLayerControl) {
          state.map.removeControl(state.baseLayerControl);
        }

        const BaseLayerControl = methods.createToggleControl({
          options: methods.getBaseLayerOptions,
          onExpand: methods.expandBaseLayerControl,
          onCollapse: methods.collapseBaseLayerControl,
          onChange: (event) => {
            const nextValue = event.target?.value;

            if (!nextValue || nextValue === state.activeBaseLayer) {
              return;
            }

            state.activeBaseLayer = nextValue;
            methods.syncActiveBaseLayer();
          },
          syncControlState: methods.syncBaseLayerControl,
          stateKeys: {
            buttonKey: 'baseLayerControlButton',
            panelKey: 'baseLayerControlPanel',
            groupKey: 'baseLayerControlGroup'
          },
          title: 'Map layers',
          controlClassName: 'custom-map-base-layer-control',
          iconDataUri: BASE_LAYER_CONTROL_ICON,
          iconSize: '26px 26px'
        });

        state.baseLayerControl = new BaseLayerControl();
        state.baseLayerControl.addTo(state.map);
        methods.syncBaseLayerControl();
      },
      rebuildLayerControl() {
        if (!state.map) {
          return;
        }

        if (state.layerControl) {
          state.map.removeControl(state.layerControl);
        }

        const LayerControl = methods.createToggleControl({
          options: methods.getOverlayOptions,
          onExpand: methods.expandLayerControl,
          onCollapse: methods.collapseLayerControl,
          onChange: (event) => {
            const nextValue = event.target?.value;

            if (!nextValue || nextValue === state.activeOverlay) {
              return;
            }

            state.activeOverlay = nextValue;
            methods.syncActiveOverlay();
          },
          syncControlState: methods.syncOverlayControl,
          stateKeys: {
            buttonKey: 'layerControlButton',
            panelKey: 'layerControlPanel',
            groupKey: 'layerControlGroup'
          },
          title: 'Marker options',
          controlClassName: 'custom-map-overlay-control',
          iconDataUri: CLUSTER_CONTROL_ICON
        });

        state.layerControl = new LayerControl();
        state.layerControl.addTo(state.map);
        methods.syncOverlayControl();
      },
      fitMapToData(heatPoints) {
        if (!state.map) {
          return;
        }

        if (heatPoints.length === 0) {
          state.map.setView([0, 0], 2);
          return;
        }

        if (heatPoints.length === 1) {
          state.map.setView(heatPoints[0], 13);
          return;
        }

        state.map.fitBounds(heatPoints, {
          padding: [28, 28]
        });
      },
      renderLayers() {
        if (!state.map) {
          return;
        }

        methods.removeRenderedLayers();

        const clusteredMarkers = methods.getClusteredMarkers();
        const unclusteredMarkers = methods.getUnclusteredMarkers();
        const heatPoints = methods.getHeatPoints();

        state.clustersLayer = L.markerClusterGroup();
        clusteredMarkers.forEach((marker) => {
          state.clustersLayer.addLayer(methods.buildLeafletMarker(marker));
        });

        state.markersLayer = L.layerGroup();
        unclusteredMarkers.forEach((marker) => {
          state.markersLayer.addLayer(methods.buildLeafletMarker(marker));
        });

        state.heatmapLayer = L.heatLayer(heatPoints, HEATMAP_OPTIONS);

        methods.rebuildBaseLayerControl();
        methods.rebuildLayerControl();
        methods.syncActiveOverlay();
        methods.fitMapToData(heatPoints);
      }
    };

    onMounted(() => {
      if (!methods.canShowMarkersOverlay() && state.activeOverlay === PARAMETERS.MAP_OVERLAYS.MARKERS) {
        state.activeOverlay = PARAMETERS.MAP_OVERLAYS.CLUSTERS;
      }

      state.map = L.map(state.mapElement, {
        zoomControl: false
      }).setView([0, 0], 2);

      L.control.zoom({
        position: 'topright'
      }).addTo(state.map);

      state.baseLayers = methods.createBaseLayers();
      methods.syncActiveBaseLayer();

      methods.renderLayers();
      methods.ensureInitialMapSize();
    });

    watch(
      () => [props.markers, props.locations, props.totalMarkers],
      () => {
        methods.renderLayers();
      },
      {
        deep: true
      }
    );

    watch(
      () => props.clustersEnabled,
      (enabled) => {
        if (!enabled && methods.canShowMarkersOverlay()) {
          state.activeOverlay = PARAMETERS.MAP_OVERLAYS.MARKERS;
        } else if (enabled) {
          state.activeOverlay = PARAMETERS.MAP_OVERLAYS.CLUSTERS;
        }

        methods.syncActiveOverlay();
      }
    );

    onBeforeUnmount(() => {
      if (state.map) {
        state.map.remove();
        state.map = null;
      }
    });

    return {
      state,
      ...methods
    };
  }
};
</script>
<style src="@/theme/map/MapLeaflet.scss" lang="scss"></style>
