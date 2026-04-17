<template>
  <div class="leaflet-map-shell">
    <div ref="mapElement" class="leaflet-map"></div>
  </div>
</template>

<script setup>
import L from 'leaflet';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  markers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['marker-click']);

const mapElement = ref(null);
let map = null;
let markersLayer = null;

const getMarkerColors = () => {
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
};

const renderMarkers = () => {
  if (!map || !markersLayer) {
    return;
  }

  markersLayer.clearLayers();

  if (props.markers.length === 0) {
    map.setView([0, 0], 2);
    return;
  }

  const bounds = [];
  const colors = getMarkerColors();

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
      emit('marker-click', marker);
    });
    markersLayer.addLayer(leafletMarker);
    bounds.push([marker.latitude, marker.longitude]);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 13);
    return;
  }

  map.fitBounds(bounds, {
    padding: [28, 28]
  });
};

onMounted(() => {
  map = L.map(mapElement.value, {
    zoomControl: true
  }).setView([0, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  renderMarkers();

  window.setTimeout(() => {
    map?.invalidateSize();
  }, 0);
});

watch(
  () => props.markers,
  () => {
    renderMarkers();
    window.setTimeout(() => {
      map?.invalidateSize();
    }, 0);
  },
  {
    deep: true
  }
);

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
