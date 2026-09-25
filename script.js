// 1. Memanggil SHP dari assets
var aoi = ee.FeatureCollection("users/astarinurarifah2004/Temanggung_Polygon");

// Memfokuskan peta ke AOI
Map.centerObject(aoi, 11);
Map.addLayer(aoi, {color: 'yellow'}, 'Batas Temanggung');

// 2. FUNGSI MASKING AWAN & BAYANGAN AWAN (Menggunakan Cloud Score Plus)
// Gabungan S2 SR Harmonized + Cloud Probability untuk hasil bebas awan presisi tinggi
function maskS2clouds(image) {
  var qa = image.select('QA60');
  
  // Bitmask QA60 bawaan
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var qaMask = qa.bitwiseAnd(cloudBitMask).eq(0)
                 .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  // Menggunakan Scl (Scene Classification Layer) bawaan S2_SR untuk deteksi bayangan awan & awan tipis
  var scl = image.select('SCL');
  // SCL code: 3 (Cloud Shadows), 8 (Cloud Medium Prob), 9 (Cloud High Prob), 10 (Thin Cirrus)
  var sclMask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));

  // Kombinasikan kedua mask
  var mask = qaMask.and(sclMask);

  return image.updateMask(mask)
              .copyProperties(image, ['system:time_start']);
}

// 3. Filter Citra Sentinel-2 L2A (Surface Reflectance)
var S2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(aoi)
  .filterDate('2025-06-01', '2025-09-30')
  // Menaikkan ambang batas pencarian agar mendapat lebih banyak sampel piksels bersih saat median
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .map(maskS2clouds);

// Composite (Median) & Clip ke AOI
var image = S2.median().clip(aoi);

// 4. Function NDVI
function calcNDVI(img) {
  return ee.Image(img).normalizedDifference(['B8', 'B4']).rename('NDVI');
}

// MENGHITUNG NDVI dari citra median yang sudah bersih
var ndvi = calcNDVI(image);

// 5. Visualisasi
var rgbVis = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.2
};

var ndviVis = {
  min: -1,
  max: 1,
  palette: ['red', 'white', 'green']
};

// 6. KLASIFIKASI KERAPATAN VEGETASI 5 KELAS
var ndviClass = ee.Image(0)
  .where(ndvi.lt(0.2), 1)
  .where(ndvi.gte(0.2).and(ndvi.lt(0.3)), 2)
  .where(ndvi.gte(0.3).and(ndvi.lt(0.4)), 3)
  .where(ndvi.gte(0.4).and(ndvi.lt(0.5)), 4)
  .where(ndvi.gte(0.5), 5)
  .clip(aoi);

var classNDVIVis = {
  min: 1,
  max: 5,
  palette: [
    'red',        // 1. Non Vegetasi
    'orange',     // 2. Sangat Rendah
    'yellow',     // 3. Rendah
    'lightgreen', // 4. Sedang
    'darkgreen'   // 5. Tinggi
  ]
};

// 7. MENAMPILKAN PETA
Map.addLayer(image, rgbVis, 'Sentinel-2 RGB (Clean)');
Map.addLayer(ndvi, ndviVis, 'NDVI');
Map.addLayer(ndviClass, classNDVIVis, 'Klasifikasi Kerapatan');

// 8. MENGHITUNG LUAS MASING-MASING KELAS (DALAM HEKTAR)
var areaImage = ee.Image.pixelArea().divide(10000);

var stats = areaImage.addBands(ndviClass).reduceRegion({
  reducer: ee.Reducer.sum().group({ groupField: 1, groupName: 'kode_kelas'}),
  geometry: aoi.geometry(),
  scale: 10,
  maxPixels: 1e13
});

var listKelas = ee.List([1, 2, 3, 4, 5]);

var labelKelas = ee.Dictionary({
  1: 'Non-Vegetasi (< 0.2)',
  2: 'Kerapatan Sangat Rendah (0.2 - 0.3)',
  3: 'Kerapatan Rendah (0.3 - 0.4)',
  4: 'Kerapatan Sedang (0.4 - 0.5)',
  5: 'Kerapatan Tinggi (> 0.5)'
});

var getDictLuas = function(statsResult) {
  var groups = ee.List(statsResult.get('groups'));
  return ee.Dictionary(groups.map(function(item) {
    var d = ee.Dictionary(item);
    return [ee.String(d.get('kode_kelas')), d.get('sum')];
  }).flatten());
};

var dictLuas = getDictLuas(stats);

var tableList = listKelas.map(function(k) {
  var key = ee.String(ee.Number(k).toInt());
  var luasHa = ee.Number(dictLuas.get(key, 0));
  
  return ee.Feature(null, {
    'Kelas_Kerapatan' : labelKelas.get(key),
    'Luas_Ha' : luasHa
  });
});

var featureTable = ee.FeatureCollection(tableList);

// 9. EXPORT HASIL KE GOOGLE DRIVE
Export.table.toDrive({
  collection: featureTable,
  description: 'Luas_NDVI_Temanggung',
  fileFormat: 'CSV'
});

Export.image.toDrive({
  image: ndvi,
  description: 'Raster_NDVI_Temanggung',
  scale: 10,
  region: aoi.geometry(),
  fileFormat: 'PNG',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: ndviClass,
  description: 'Klasifikasi_NDVI_Temanggung',
  scale: 10,
  region: aoi.geometry(),
  fileFormat: 'PNG',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: image,
  description: 'Sentinel-2',
  scale: 10,
  region: aoi.geometry(),
  fileFormat: 'PNG',
  maxPixels: 1e13
});
