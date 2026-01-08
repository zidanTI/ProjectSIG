import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Circle as CircleStyle, Icon } from 'ol/style';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';

/* ================= NAVIGASI ================= */
const homePage = document.getElementById('home-page');
const mapPage = document.getElementById('map-page');
const aboutPage = document.getElementById('about-page');

const btnMasukPeta = document.getElementById('btnMasukPeta');
const navHome = document.getElementById('navHome');
const navMap = document.getElementById('navMap');
const navAbout = document.getElementById('navAbout');

function showPage(page) {
  homePage.classList.add('d-none');
  mapPage.classList.add('d-none');
  aboutPage.classList.add('d-none');

  page.classList.remove('d-none');

  if (page === mapPage) {
    setTimeout(() => map.updateSize(), 200);
  }
}

btnMasukPeta.onclick = () => showPage(mapPage);
navHome.onclick = () => showPage(homePage);
navMap.onclick = () => showPage(mapPage);
navAbout.onclick = () => showPage(aboutPage);

/* ================= POPUP ================= */
const overlay = new Overlay({
  element: document.getElementById('popup'),
  autoPan: true
});

/* ================= STYLE ================= */
const riauStyle = new Style({
  fill: new Fill({ color: 'rgba(0,60,255,0.3)' }),
  stroke: new Stroke({ color: '#0033cc', width: 2 })
});

const rthStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#28a745' }),
    stroke: new Stroke({ color: '#fff', width: 2 })
  })
});

const sampahStyle = new Style({
  image: new Icon({
    src: 'icon/garbage.png',
    scale: 0.08
  })
});

/* ================= LAYER ================= */
const riauLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/convert_projection.json',
    format: new GeoJSON()
  }),
  style: riauStyle
});

const rthLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/rth_pekanbaru.json',
    format: new GeoJSON()
  }),
  style: rthStyle
});

const sampahLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/sampah_ilegal.json',
    format: new GeoJSON()
  }),
  style: sampahStyle
});

/* ================= MAP ================= */
const map = new Map({
  target: 'map',
  overlays: [overlay],
  layers: [
    new TileLayer({ source: new OSM() }),
    riauLayer,
    rthLayer,
    sampahLayer
  ],
  view: new View({
    center: fromLonLat([101.4478, 0.5333]),
    zoom: 11
  })
});

/* ================= CHECKBOX ================= */
document.getElementById('toggleRiau').onchange = e => riauLayer.setVisible(e.target.checked);
document.getElementById('toggleRTH').onchange = e => rthLayer.setVisible(e.target.checked);
document.getElementById('toggleSampah').onchange = e => sampahLayer.setVisible(e.target.checked);

