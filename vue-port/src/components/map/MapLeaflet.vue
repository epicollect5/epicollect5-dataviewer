<template>
  <div class="leaflet-map-shell">
    <div :ref="setMapElement" class="leaflet-map"></div>
  </div>
</template>

<script>
import L from 'leaflet';
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue';

export default {
  name: 'MapLeaflet',
  props: {
    markers: {
      type: Array,
      default: () => []
    }
  },
  emits: ['marker-click'],
  setup(props, { emit }) {
    const state = reactive({
      mapElement: null,
      map: null,
      markersLayer: null
    });

    const methods = {
      setMapElement(element) {
        state.mapElement = element;
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
      handleMarkerClick(marker) {
        emit('marker-click', marker);
      },
      invalidateMapSize() {
        window.setTimeout(() => {
          state.map?.invalidateSize();
        }, 0);
      },
      renderMarkers() {
        if (!state.map || !state.markersLayer) {
          return;
        }

        state.markersLayer.clearLayers();

        if (props.markers.length === 0) {
          state.map.setView([0, 0], 2);
          return;
        }

        const bounds = [];
        const colors = methods.getMarkerColors();

        props.markers.forEach((marker) => {
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
          state.markersLayer.addLayer(leafletMarker);
          bounds.push([marker.latitude, marker.longitude]);
        });

        if (bounds.length === 1) {
          state.map.setView(bounds[0], 13);
          return;
        }

        state.map.fitBounds(bounds, {
          padding: [28, 28]
        });
      }
    };

    onMounted(() => {
      state.map = L.map(state.mapElement, {
        zoomControl: true
      }).setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(state.map);

      state.markersLayer = L.layerGroup().addTo(state.map);
      methods.renderMarkers();
      methods.invalidateMapSize();
    });

    watch(
      () => props.markers,
      () => {
        methods.renderMarkers();
        methods.invalidateMapSize();
      },
      {
        deep: true
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
