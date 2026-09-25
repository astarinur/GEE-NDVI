# Google Earth Engine: Sentinel-2 NDVI & Vegetation Density Analysis

## 📌 Project Overview
This project presents an automated workflow in **Google Earth Engine (GEE)** to process **Sentinel-2 Surface Reflectance (L2A)** imagery for Normalized Difference Vegetation Index (NDVI) calculation and vegetation density classification in Temanggung Regency, Indonesia.

To ensure high data accuracy, advanced cloud and cloud shadow masking algorithms were implemented by combining the `QA60` band and the Scene Classification Layer (`SCL`).

🛠️ Key Features & Methodology
1. Advanced Cloud & Shadow Masking:
- Filters out high/medium cloud probability, cirrus, and cloud shadows using Sentinel-2 L2A SCL bands.
2. Multi-Temporal Composite:
- Generates a clean composite image using the .median() reducer over a specified time window.
3. NDVI Calculation & Classification:
- Calculates NDVI using Near-Infrared (B8) and Red (B4) bands.
- Classifies vegetation density into 5 distinct ecological classes:
  - Non-Vegetation (< 0.2)
  - Very Low Density (0.2 - 0.3)
  - Low Density (0.3 - 0.4)
  - Medium Density (0.4 - 0.5)
  - High Density (> 0.5)
4. Automated Area Calculation & Export:
- Automatically computes total area (in Hectares) for each vegetation class.
- Exports classification summary tables (CSV) and NDVI rasters (GeoTIFF) directly to Google Drive.

Result:
<img width="1920" height="1080" alt="Cuplikan layar 2026-09-25 213529" src="https://github.com/user-attachments/assets/46632725-1774-488e-a899-cece1337c806" />
<img width="1920" height="1080" alt="Cuplikan layar 2026-09-25 213539" src="https://github.com/user-attachments/assets/c699cd31-6ea7-4f7e-930f-28ae110af229" />

📁 Repository Structure
- script.js : Main Google Earth Engine JavaScript code for processing and visualization.
- README.md : Documentation and project guide.

🚀 How to Run
- Copy the script provided in script.js.
- Paste it into the Google Earth Engine Code Editor.
- Ensure your AOI shapefile/asset path (users/astarinur...) is correctly configured in your GEE     assets.
- Click Run.

Created as part of my GIS & Spatial Analysis Portfolio.
