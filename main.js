import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import {Circle as CircleStyle, Fill, Stroke, Style, Icon} from 'ol/style'; 
import Overlay from 'ol/Overlay';
import {fromLonLat} from 'ol/proj';

// --- 1. SETUP POPUP & KOTAK INFO ---
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');
const infoBox = document.getElementById('info-box');

const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: { duration: 250 },
  },
});

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// --- 2. DEFINISI STYLE ---

// ==> PERBAIKAN: Style Riau dibuat lebih tebal agar terlihat
const riauStyle = new Style({
  fill: new Fill({
    // Warna Biru, Transparansi 0.4 (Lebih tebal dari sebelumnya 0.1)
    color: 'rgba(0, 60, 255, 0.4)' 
  }),
  stroke: new Stroke({
    color: '#0033cc', // Garis biru tua
    width: 2 // Garis dipertebal
  })
});

// Style Hijau untuk RTH
const rthStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({color: '#28a745'}), // Hijau
    stroke: new Stroke({color: '#fff', width: 2}),
  }),
});

// Style Sampah Ilegal menggunakan Ikon
const sampahStyle = new Style({
  image: new Icon({ 
    src: 'icon/garbage.png', 
    scale: 0.08, 
    anchor: [0.5, 1], 
  }),
});

// --- 3. LOAD LAYER ---

// ==> PERBAIKAN: Source dipisah untuk cek Error
const riauSource = new VectorSource({
  format: new GeoJSON(),
  // Pastikan file ini ada di folder 'data'
  url: 'data/polygon_riau.json' 
});

// Fitur Tambahan: Munculkan pesan jika file Riau GAGAL dimuat
riauSource.on('featuresloaderror', function (err) {
  console.error("ERROR MEMUAT RIAU:", err);
  alert("Gagal memuat peta Riau! Cek apakah file 'data/polygon_riau.json' sudah ada?");
});

// Layer 0: Polygon Riau (Background)
const riauLayer = new VectorLayer({
  source: riauSource,
  style: riauStyle,
  zIndex: 1 // Layer paling bawah
});

// Layer 1: RTH
const rthLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/rth_pekanbaru.json',
    format: new GeoJSON(),
  }),
  style: rthStyle,
  zIndex: 10 // Layer di atas
});
rthLayer.setProperties({ name: 'RTH' }); 

// Layer 2: Sampah
const sampahLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/sampah_ilegal.json',
    format: new GeoJSON(),
  }),
  style: sampahStyle,
  zIndex: 10 // Layer di atas
});
sampahLayer.setProperties({ name: 'Sampah' }); 

// --- 4. BUAT PETA ---
const map = new Map({
  target: 'map',
  overlays: [overlay],
  layers: [
    new TileLayer({ source: new OSM() }), // Peta Dasar OSM
    riauLayer,    // Peta Wilayah Riau (Sudah diperbaiki)
    rthLayer,     // Titik RTH
    sampahLayer   // Titik Sampah
  ],
  view: new View({
    center: fromLonLat([101.4478, 0.5333]), // Fokus Pekanbaru
    zoom: 12, 
  }),
});

// --- 5. LOGIKA KONTROL LAYER (CHECKBOX) ---
const toggleRTH = document.getElementById('toggleRTH');
const toggleSampah = document.getElementById('toggleSampah');
const toggleRiau = document.getElementById('toggleRiau');

if (toggleRTH) {
    toggleRTH.addEventListener('change', function() {
      rthLayer.setVisible(this.checked);
    });
}

if (toggleSampah) {
    toggleSampah.addEventListener('change', function() {
      sampahLayer.setVisible(this.checked);
    });
}

if (toggleRiau) {
    toggleRiau.addEventListener('change', function() {
        riauLayer.setVisible(this.checked);
    });
}

// --- 6. LOGIKA KLIK POPUP ---
map.on('singleclick', function (evt) {
  // Logic: Filter supaya background (Riau) tidak ikut diklik
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    // Jika layer yang diklik adalah Riau, abaikan
    if (layer === riauLayer) {
        return null; 
    }
    return feature;
  });

  // Reset Info Box jika klik kosong
  if (!feature) {
     overlay.setPosition(undefined);
     infoBox.innerHTML = 'Klik pada titik data untuk informasi detail.';
     return;
  }
  
  // Jika kena titik (Feature ditemukan)
  const coordinate = evt.coordinate;
  const props = feature.getProperties(); 
  let popupHTML = '';
  let infoText = '';

  if (props.Surveyor) { 
    // ==> INI DATA SAMPAH
    const volumeData = props['Volume (m3)'] || 'N/A';
    const jarakData = props['Jarak dari Jalan (m)'] || 'N/A';
    
    popupHTML = `
      <h6 class="fw-bold text-danger mb-2">Titik Sampah Ilegal</h6>
      <table class="table table-sm table-striped" style="font-size:13px;">
          <tr><td><strong>Surveyor</strong></td><td>: ${props.Surveyor}</td></tr>
          <tr><td><strong>Jenis</strong></td><td>: ${props.Jenis}</td></tr>
          <tr><td><strong>Volume</strong></td><td>: ${volumeData} m3</td></tr> 
          <tr><td><strong>Jarak</strong></td><td>: ${jarakData} m</td></tr>      
      </table>
      <div class="d-grid">
          <a href="${props.Foto}" target="_blank" class="btn btn-sm btn-primary">Lihat Foto Lokasi</a>
      </div>
    `;
    
    infoText = `
      <strong>Titik Sampah Ilegal</strong><br>
      Surveyor: ${props.Surveyor}<br>
      Volume: ${volumeData} m³
    `;
    
  } else if (props.Nama) {
    // ==> INI DATA RTH
    const namaData = props.Nama || 'Nama RTH Tidak Ditemukan';
    const luasData = props.Luas || 'N/A';
    
    popupHTML = `
      <h6 class="fw-bold text-success mb-2">${namaData}</h6>
      <table class="table table-sm table-striped" style="font-size:13px;">
          <tr><td><strong>Jenis</strong></td><td>: ${props.Jenis}</td></tr>
          <tr><td><strong>Luas</strong></td><td>: ${luasData} m²</td></tr>
          <tr><td><strong>Vegetasi</strong></td><td>: ${props.Vegetasi}</td></tr>
      </table>
    `;
    
    infoText = `
      <strong>${namaData}</strong><br>
      Jenis: ${props.Jenis}<br>
      Luas: ${luasData} m²
    `;
  }

  content.innerHTML = popupHTML;
  overlay.setPosition(coordinate);
  infoBox.innerHTML = infoText;
});

// Ubah kursor jadi telunjuk saat di atas titik (abaikan background Riau)
map.on('pointermove', function (e) {
  const pixel = map.getEventPixel(e.originalEvent);
  
  const hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      if (layer === riauLayer) return false;
      return true;
  });

  map.getTarget().style.cursor = hit ? 'pointer' : '';
});