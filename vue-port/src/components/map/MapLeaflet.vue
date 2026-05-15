<template>
  <div class="leaflet-map-shell" :class="{ 'leaflet-map-shell--hidden': isHidden }">
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
import { markRaw, onBeforeUnmount, onMounted, reactive, toRaw, watch } from 'vue';
import PARAMETERS from '@/core/config/parameters';
import { CLUSTER_CONTROL_ICON, BASE_LAYER_CONTROL_ICON } from '@/core/map/controlIcons';
import mapUtils from '@/core/map/mapUtils';
import { getClusterPieIconHtml, getClusterPieIconModel } from '@/services/map/pieCharts';

const HEATMAP_OPTIONS = {
  radius: 10,
  minOpacity: 0.5,
  blur: 10
};
const INITIAL_FIT_DELAY_MS = 1000;
const STATIC_LAYER_CACHE = new Map();
let ACTIVE_MAP_CONTEXT_KEY = null;


export default {
  name: 'MapLeaflet',
  props: {
    locations: {
      type: Array,
      default: () => []
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    locationCacheKey: {
      type: String,
      default: ''
    },
    startDate: {
      type: String,
      default: ''
    },
    endDate: {
      type: String,
      default: ''
    },
    totalMarkers: {
      type: Number,
      default: 0
    },
    clustersEnabled: {
      type: Boolean,
      default: true
    },
    pieChartLegend: {
      type: Array,
      default: () => []
    }
  },
  emits: ['marker-click', 'progress', 'ready', 'render-start'],
  setup(props, { emit }) {
    let cachedMarkerColors = null;
    const mapContext = {
      mapElement: null,
      map: null,
      baseLayers: {},
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
      activeMarkerLayer: null,
      heatPoints: [],
      cachedMarkers: [],
      // requestAnimationFrame is a scheduling/debouncing mechanism,
      // and pendingRenderFrame is how the component cancels
      // the older scheduled render.
      pendingRenderFrame: null,
      fitBoundsTimeout: null,
      conicGradientSupported: null
    };

    const state = reactive({
      activeBaseLayer: PARAMETERS.MAP_BASE_LAYERS.CARTO,
      activeOverlay: props.clustersEnabled ? PARAMETERS.MAP_OVERLAYS.CLUSTERS : PARAMETERS.MAP_OVERLAYS.MARKERS,
      hasInvalidatedInitialSize: false,
      clusterRenderStartedAt: 0,
      lastCanShowMarkersOverlay: null,
      activeRenderToken: 0
    });

    const methods = {
      setMapElement(element) {
        mapContext.mapElement = element;
      },
      createBaseLayers() {
        return markRaw({
          [PARAMETERS.MAP_BASE_LAYERS.SATELLITE]: markRaw(L.tileLayer(PARAMETERS.ESRI_TILES_PROVIDER_SATELLITE, {
            attribution: PARAMETERS.ESRI_TILES_PROVIDER_ATTRIBUTION,
            maxNativeZoom: 17
          })),
          [PARAMETERS.MAP_BASE_LAYERS.TERRAIN]: markRaw(L.tileLayer(PARAMETERS.OPENTOPO_TILES_PROVIDER, {
            attribution: PARAMETERS.OPENTOPO_TILES_ATTRIBUTION,
            maxNativeZoom: 17
          })),
          [PARAMETERS.MAP_BASE_LAYERS.CARTO]: markRaw(L.tileLayer(PARAMETERS.CARTO_LIGHT_TILES_PROVIDER, {
            attribution: PARAMETERS.CARTO_TILES_ATTRIBUTION,
            maxNativeZoom: 20
          })),
          [PARAMETERS.MAP_BASE_LAYERS.CARTO_DARK]: markRaw(L.tileLayer(PARAMETERS.CARTO_DARK_TILES_PROVIDER, {
            attribution: PARAMETERS.CARTO_DARK_TILES_ATTRIBUTION,
            maxNativeZoom: 20
          })),
          [PARAMETERS.MAP_BASE_LAYERS.OPEN_STREET_MAP]: markRaw(L.tileLayer(PARAMETERS.OSM_TILES_PROVIDER, {
            attribution: PARAMETERS.OSM_TILES_ATTRIBUTION,
            maxNativeZoom: 20
          }))
        });
      },
      syncActiveBaseLayer() {
        if (!mapContext.map) {
          return;
        }

        Object.entries(mapContext.baseLayers).forEach(([layerName, layer]) => {
          if (!layer) {
            return;
          }

          if (layerName === state.activeBaseLayer) {
            if (!mapContext.map.hasLayer(layer)) {
              layer.addTo(mapContext.map);
            }
            return;
          }

          if (mapContext.map.hasLayer(layer)) {
            mapContext.map.removeLayer(layer);
          }
        });

        methods.syncBaseLayerControl();
      },
      getMarkerColors() {
        if (cachedMarkerColors) {
          return cachedMarkerColors;
        }

        if (typeof window === 'undefined') {
          cachedMarkerColors = {
            border: '#76509b',
            fill: '#7044ff'
          };

          return cachedMarkerColors;
        }

        const styles = window.getComputedStyle(document.documentElement);

        cachedMarkerColors = {
          border: styles.getPropertyValue('--ion-color-primary-tint').trim() || '#76509b',
          fill: styles.getPropertyValue('--ion-color-tertiary').trim() || '#7044ff'
        };

        return cachedMarkerColors;
      },
      canShowMarkersOverlay() {
        return props.totalMarkers < PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING;
      },
      buildLeafletMarker(entry, colors) {
        const coordinates = entry?.geometry?.coordinates || [];
        const longitude = Number(coordinates[0]);
        const latitude = Number(coordinates[1]);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }

        return L.circleMarker([latitude, longitude], {
          radius: 10,
          weight: 2,
          color: colors.border,
          fillColor: colors.fill,
          fillOpacity: 1,
          entryUuid: entry?.properties?.uuid || null,
          title: entry?.properties?.title || '',
          popupHtml: entry?.properties?.title || '',
          possibleAnswers: entry?.properties?.possible_answers || {}
        });
      },
      buildMapArtifacts() {
        const markers = [];
        const heatPoints = [];
        const colors = methods.getMarkerColors();
        const rawLocations = methods.getRenderableLocations();
        const totalLocations = rawLocations.length;

        for (let index = 0; index < totalLocations; index += 1) {
          const entry = toRaw(rawLocations[index]);
          const coordinates = entry?.geometry?.coordinates || [];
          const longitude = Number(coordinates[0]);
          const latitude = Number(coordinates[1]);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            continue;
          }

          heatPoints.push([latitude, longitude]);
          const marker = methods.buildLeafletMarker(entry, colors);

          if (marker) {
            markers.push(marker);
          }
        }

        mapContext.cachedMarkers = markers;
        mapContext.heatPoints = heatPoints;
      },
      createMarkersLayer() {
        const colors = methods.getMarkerColors();
        const rawLocations = methods.getRenderableLocations();
        const markers = [];

        for (let index = 0; index < rawLocations.length; index += 1) {
          const marker = methods.buildLeafletMarker(rawLocations[index], colors);

          if (marker) {
            markers.push(marker);
          }
        }

        return markRaw(L.featureGroup(markers));
      },
      getCurrentMapContextKey() {
        const cacheParts = methods.getCurrentLayerCacheKey().split('|');

        return cacheParts.slice(0, 2).join('|') || '__default__';
      },
      getCurrentLayerCacheKey() {
        return props.locationCacheKey || '__default__';
      },
      shouldCacheCurrentLayers() {
        return !props.startDate && !props.endDate;
      },
      disposeLayerBundle(bundle) {
        if (!bundle) {
          return;
        }

        [bundle.clustersLayer, bundle.heatmapLayer, bundle.markersLayer].forEach((layer) => {
          if (!layer) {
            return;
          }

          layer.off?.();
          layer.clearLayers?.();

          if (mapContext.map?.hasLayer(layer)) {
            mapContext.map.removeLayer(layer);
          }
        });

        bundle.clustersLayer = null;
        bundle.heatmapLayer = null;
        bundle.markersLayer = null;
        bundle.cachedMarkers = [];
        bundle.heatPoints = [];
      },
      clearMemoryCache() {
        STATIC_LAYER_CACHE.forEach((bundle) => {
          methods.disposeLayerBundle(bundle);
        });
        STATIC_LAYER_CACHE.clear();
      },
      getCurrentLayerCache() {
        if (!methods.shouldCacheCurrentLayers()) {
          return null;
        }

        return STATIC_LAYER_CACHE.get(methods.getCurrentLayerCacheKey()) || null;
      },
      setCurrentLayerCache(bundle) {
        if (!methods.shouldCacheCurrentLayers()) {
          return;
        }

        STATIC_LAYER_CACHE.set(methods.getCurrentLayerCacheKey(), bundle);
      },
      getRenderableLocations() {
        return toRaw(props.locations);
      },
      supportsConicGradient() {
        if (mapContext.conicGradientSupported !== null) {
          return mapContext.conicGradientSupported;
        }

        mapContext.conicGradientSupported =
          typeof window !== 'undefined' &&
          typeof window.CSS?.supports === 'function' &&
          window.CSS.supports('background', 'conic-gradient(red, blue)');

        return mapContext.conicGradientSupported;
      },
      canRenderPieClusters() {
        return props.pieChartLegend.length > 0 && methods.supportsConicGradient();
      },
      createPieClusterIcon(cluster) {
        const model = getClusterPieIconModel({
          markers: cluster.getAllChildMarkers(),
          legend: props.pieChartLegend
        });

        return new L.DivIcon({
          html: getClusterPieIconHtml(model),
          className: 'marker-cluster-pie',
          iconSize: new L.Point(model.size, model.size)
        });
      },
      createClusterIcon(cluster) {
        const childCount = cluster.getChildCount();
        const pointSize = childCount > 999 ? 50 : 40;
        let sizeClass = 'small';

        if (childCount >= 100) {
          sizeClass = 'large';
        } else if (childCount >= 10) {
          sizeClass = 'medium';
        }

        return new L.DivIcon({
          html: `<div><span>${childCount}</span></div>`,
          className: `marker-cluster marker-cluster-${sizeClass}`,
          iconSize: new L.Point(pointSize, pointSize)
        });
      },
      handleMarkerClick(layer) {
        if (!layer?.options?.entryUuid) {
          return;
        }

        mapContext.activeMarkerLayer = layer;

        if (typeof layer.bindPopup === 'function' && !layer.getPopup?.()) {
          layer.bindPopup(layer.options.popupHtml || 'Loading...');
        }

        layer.openPopup?.();

        emit('marker-click', {
          entryUuid: layer.options.entryUuid
        });
      },
      setActiveMarkerPopupTitle(title) {
        if (!mapContext.activeMarkerLayer || !title) {
          return;
        }

        mapContext.activeMarkerLayer.setPopupContent?.(title);
        mapContext.activeMarkerLayer.options.title = title;
        mapContext.activeMarkerLayer.options.popupHtml = title;
      },
      emitProgress(processed, total) {
        const safeTotal = total || 0;
        const percentage = safeTotal > 0 ? Math.round((processed / safeTotal) * 100) : 0;

        emit('progress', {
          isVisible: processed < safeTotal,
          processed,
          total: safeTotal,
          percentage
        });
      },
      invalidateMapSize() {
        window.setTimeout(() => {
          mapContext.map?.invalidateSize();
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
        mapContext.map?.closePopup();
      },
      applyInitialFit(renderToken = state.activeRenderToken) {
        if (renderToken !== state.activeRenderToken || !mapContext.map) {
          return;
        }

        const heatPoints = mapContext.heatPoints;

        mapContext.map.invalidateSize();

        if (heatPoints.length === 0) {
          mapContext.map.setView([0, 0], 2);
          return;
        }

        if (heatPoints.length === 1) {
          mapContext.map.setView(heatPoints[0], 13);
          return;
        }

        const bounds = L.latLngBounds(heatPoints);

        mapContext.map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 18
        });
      },
      scheduleInitialFit(renderToken) {
        if (mapContext.fitBoundsTimeout !== null) {
          window.clearTimeout(mapContext.fitBoundsTimeout);
        }

        mapContext.fitBoundsTimeout = window.setTimeout(() => {
          mapContext.fitBoundsTimeout = null;
          methods.applyInitialFit(renderToken);
        }, INITIAL_FIT_DELAY_MS);
      },
      notifyReady(renderToken) {
        window.requestAnimationFrame(() => {
          if (renderToken !== state.activeRenderToken) {
            return;
          }

          emit('ready');
        });
      },
      queueRenderLayers() {
        if (!mapContext.map) {
          return;
        }

        // Schedule rendering for the next paint and collapse rapid prop changes into
        // one render. The saved frame id lets cleanup cancel stale work before it runs.
        if (mapContext.pendingRenderFrame !== null) {
          window.cancelAnimationFrame(mapContext.pendingRenderFrame);
        }

        emit('render-start');
        /**
         * renderLayers() builds markers, heat points, clusters, controls, and fits bounds.
         * Running it immediately during a Vue watcher can compete with Vue DOM updates.
         * requestAnimationFrame() lets Vue/browser layout settle first.
         */
        mapContext.pendingRenderFrame = window.requestAnimationFrame(() => {
          mapContext.pendingRenderFrame = null;
          void methods.renderLayers();
        });
      },
      createClusterLayer(markers, renderToken) {
        const totalMarkers = markers.length;
        const shouldRenderPieClusters = methods.canRenderPieClusters();
        state.clusterRenderStartedAt = Date.now();
        const clusterLayer = markRaw(L.markerClusterGroup({
          chunkedLoading: true,
          chunkInterval: 200,
          chunkDelay: 50,
          maxClusterRadius: mapUtils.getMaxRadius(props.locations),
          singleMarkerMode: shouldRenderPieClusters,
          iconCreateFunction: shouldRenderPieClusters ? methods.createPieClusterIcon : methods.createClusterIcon,
          spiderfyDistanceMultiplier: 4,
          disableClusteringAtZoom: props.totalMarkers > PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING ? 15 : null,
          animate: props.totalMarkers <= PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING,
          chunkProgress: (processed, total) => {
            if (renderToken !== state.activeRenderToken) {
              return;
            }

            methods.emitProgress(processed, total);

            if (processed === total) {
              methods.notifyReady(renderToken);
            }
          }
        }));

        if (totalMarkers > 0) {
          clusterLayer.addLayers(markers);
        } else {
          if (renderToken === state.activeRenderToken) {
            methods.emitProgress(0, 0);
          }
        }

        return clusterLayer;
      },
      createHeatmapLayer(heatPoints) {
        return markRaw(L.heatLayer(heatPoints, HEATMAP_OPTIONS));
      },
      bindLayerEvents() {
        mapContext.clustersLayer?.off('click');
        mapContext.markersLayer?.off('click');

        mapContext.clustersLayer?.on('click', (event) => {
          methods.handleMarkerClick(event.layer);
        });

        mapContext.markersLayer?.on('click', (event) => {
          methods.handleMarkerClick(event.layer);
        });
      },
      removeRenderedLayers() {
        if (!mapContext.map) {
          return;
        }

        [mapContext.clustersLayer, mapContext.heatmapLayer, mapContext.markersLayer].forEach((layer) => {
          if (layer) {
            mapContext.map.removeLayer(layer);
          }
        });
      },
      syncActiveOverlay() {
        if (!mapContext.map) {
          return;
        }

        if (state.activeOverlay === PARAMETERS.MAP_OVERLAYS.MARKERS && !methods.canShowMarkersOverlay()) {
          state.activeOverlay = PARAMETERS.MAP_OVERLAYS.CLUSTERS;
        }

        methods.removeRenderedLayers();

        switch (state.activeOverlay) {
          case PARAMETERS.MAP_OVERLAYS.HEATMAP:
            if (!mapContext.heatmapLayer) {
              mapContext.heatmapLayer = methods.createHeatmapLayer(mapContext.heatPoints);
              const currentCache = methods.getCurrentLayerCache();

              if (currentCache) {
                currentCache.heatmapLayer = mapContext.heatmapLayer;
              }
            }

            if (mapContext.heatmapLayer) {
              mapContext.heatmapLayer.addTo(mapContext.map);
            }
            break;
          case PARAMETERS.MAP_OVERLAYS.MARKERS:
            if (!mapContext.markersLayer && methods.canShowMarkersOverlay()) {
              mapContext.markersLayer = methods.createMarkersLayer();
              const currentCache = methods.getCurrentLayerCache();

              if (currentCache) {
                currentCache.markersLayer = mapContext.markersLayer;
              }

              methods.bindLayerEvents();
            }

            if (mapContext.markersLayer && methods.canShowMarkersOverlay()) {
              mapContext.markersLayer.addTo(mapContext.map);
            }
            break;
          case PARAMETERS.MAP_OVERLAYS.CLUSTERS:
          default:
            if (mapContext.clustersLayer) {
              mapContext.clustersLayer.addTo(mapContext.map);
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
        mapContext.layerControl?.getContainer()?.classList.add('leaflet-control-layers-expanded');
      },
      collapseLayerControl() {
        mapContext.layerControl?.getContainer()?.classList.remove('leaflet-control-layers-expanded');
      },
      expandBaseLayerControl() {
        mapContext.baseLayerControl?.getContainer()?.classList.add('leaflet-control-layers-expanded');
      },
      collapseBaseLayerControl() {
        mapContext.baseLayerControl?.getContainer()?.classList.remove('leaflet-control-layers-expanded');
      },
      syncOverlayControl() {
        if (!mapContext.layerControlGroup) {
          return;
        }

        Array.from(mapContext.layerControlGroup.querySelectorAll('input[type="radio"]')).forEach((input) => {
          input.checked = input.value === state.activeOverlay;
        });
      },
      syncBaseLayerControl() {
        if (!mapContext.baseLayerControlGroup) {
          return;
        }

        Array.from(mapContext.baseLayerControlGroup.querySelectorAll('input[type="radio"]')).forEach((input) => {
          input.checked = input.value === state.activeBaseLayer;
        });
      },
      createToggleControl({ options, onExpand, onCollapse, onChange, syncControlState, stateKeys, title, controlClassName, iconDataUri, iconSize = '30px 30px' }) {
        const { buttonKey, panelKey, groupKey } = stateKeys;

        // noinspection JSUnusedGlobalSymbols
        return L.Control.extend({
          options: {
            position: 'topright'
          },
          // Leaflet calls this when the custom control is added via `addTo(map)`.
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

            mapContext[buttonKey] = markRaw(button);
            mapContext[panelKey] = markRaw(panel);
            mapContext[groupKey] = markRaw(group);

            window.setTimeout(() => {
              syncControlState();
            }, 0);

            return container;
          },
          // Leaflet calls this when the control is removed via `removeControl(...)`
          onRemove() {
            mapContext[buttonKey] = null;
            mapContext[panelKey] = null;
            mapContext[groupKey] = null;
          }
        });
      },
      ensureBaseLayerControl() {
        if (!mapContext.map) {
          return;
        }

        if (mapContext.baseLayerControl) {
          methods.syncBaseLayerControl();
          return;
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

        mapContext.baseLayerControl = markRaw(new BaseLayerControl());
        mapContext.baseLayerControl.addTo(mapContext.map);
        methods.syncBaseLayerControl();
      },
      ensureLayerControl(shouldBuildMarkersOverlay) {
        if (!mapContext.map) {
          return;
        }

        if (mapContext.layerControl && state.lastCanShowMarkersOverlay === shouldBuildMarkersOverlay) {
          methods.syncOverlayControl();
          return;
        }

        if (mapContext.layerControl) {
          mapContext.map.removeControl(mapContext.layerControl);
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

        mapContext.layerControl = markRaw(new LayerControl());
        mapContext.layerControl.addTo(mapContext.map);
        state.lastCanShowMarkersOverlay = shouldBuildMarkersOverlay;
        methods.syncOverlayControl();
      },
      async renderLayers() {
        if (!mapContext.map) {
          return;
        }

        const mapContextKey = methods.getCurrentMapContextKey();

        if (ACTIVE_MAP_CONTEXT_KEY !== mapContextKey) {
          methods.clearMemoryCache();
          ACTIVE_MAP_CONTEXT_KEY = mapContextKey;
        }

        const renderToken = state.activeRenderToken + 1;
        state.activeRenderToken = renderToken;
        methods.removeRenderedLayers();
        mapContext.markersLayer = null;
        mapContext.heatmapLayer = null;
        mapContext.cachedMarkers = [];
        mapContext.heatPoints = [];

        const shouldBuildMarkersOverlay = methods.canShowMarkersOverlay();
        const cachedLayers = methods.getCurrentLayerCache();

        if (cachedLayers) {
          mapContext.clustersLayer = cachedLayers.clustersLayer;
          mapContext.heatmapLayer = cachedLayers.heatmapLayer;
          mapContext.markersLayer = cachedLayers.markersLayer;
          mapContext.cachedMarkers = cachedLayers.cachedMarkers;
          mapContext.heatPoints = cachedLayers.heatPoints;
          methods.ensureBaseLayerControl();
          methods.ensureLayerControl(shouldBuildMarkersOverlay);
          methods.syncActiveOverlay();
          methods.scheduleInitialFit(renderToken);
          methods.notifyReady(renderToken);
          return;
        }

        methods.buildMapArtifacts();

        if (renderToken !== state.activeRenderToken) {
          return;
        }

        mapContext.clustersLayer = methods.createClusterLayer(mapContext.cachedMarkers, renderToken);
        methods.setCurrentLayerCache({
          clustersLayer: mapContext.clustersLayer,
          heatmapLayer: null,
          markersLayer: null,
          cachedMarkers: mapContext.cachedMarkers,
          heatPoints: mapContext.heatPoints
        });
        methods.bindLayerEvents();

        if (state.activeOverlay === PARAMETERS.MAP_OVERLAYS.HEATMAP) {
          mapContext.heatmapLayer = methods.createHeatmapLayer(mapContext.heatPoints);
        }

        methods.ensureBaseLayerControl();
        methods.ensureLayerControl(shouldBuildMarkersOverlay);
        methods.syncActiveOverlay();
        methods.scheduleInitialFit(renderToken);

        if (state.activeOverlay !== PARAMETERS.MAP_OVERLAYS.CLUSTERS) {
          methods.notifyReady(renderToken);
        }
      }
    };

    onMounted(() => {
      if (!methods.canShowMarkersOverlay() && state.activeOverlay === PARAMETERS.MAP_OVERLAYS.MARKERS) {
        state.activeOverlay = PARAMETERS.MAP_OVERLAYS.CLUSTERS;
      }

      mapContext.map = markRaw(L.map(mapContext.mapElement, {
        zoomControl: false,
        preferCanvas: true,
        maxZoom: 18,
        minZoom: 1,
        zoomSnap: 1,
        zoomDelta: 1
      }).setView([0, 0], 3));

      L.control.zoom({
        position: 'topright'
      }).addTo(mapContext.map);

      mapContext.baseLayers = methods.createBaseLayers();
      methods.syncActiveBaseLayer();

      methods.queueRenderLayers();
      methods.ensureInitialMapSize();
    });

    watch(
      () => props.locations,
      () => {
        methods.queueRenderLayers();
      }
    );

    watch(
      () => props.locationCacheKey,
      () => {
        const mapContextKey = methods.getCurrentMapContextKey();

        if (ACTIVE_MAP_CONTEXT_KEY !== mapContextKey) {
          methods.clearMemoryCache();
          ACTIVE_MAP_CONTEXT_KEY = mapContextKey;
        }

        methods.queueRenderLayers();
      }
    );

    watch(
      () => props.isActive,
      (isActive) => {
        if (isActive) {
          return;
        }

        methods.clearMemoryCache();
        ACTIVE_MAP_CONTEXT_KEY = null;
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
      if (mapContext.pendingRenderFrame !== null) {
        window.cancelAnimationFrame(mapContext.pendingRenderFrame);
      }

      if (mapContext.fitBoundsTimeout !== null) {
        window.clearTimeout(mapContext.fitBoundsTimeout);
      }

      if (mapContext.map) {
        mapContext.map.remove();
        mapContext.map = null;
      }

      methods.clearMemoryCache();
      ACTIVE_MAP_CONTEXT_KEY = null;
    });

    return {
      state,
      ...methods
    };
  }
};
</script>
<style src="@/theme/map/MapLeaflet.scss" lang="scss"></style>
