// Global variables
let geoData;
let map;
let geoJsonLayer;

// Load GeoJSON data
fetch('golbazar.geojson') // Replace with your GeoJSON file path
    .then(response => response.json())
    .then(data => {
        geoData = data;
        initializeForm();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

function initializeForm() {
    // Populate VDC dropdown
    const vdcSelect = document.getElementById('vdcSelect');
    const vdcs = [...new Set(geoData.features.map(f => f.properties.Former_VDC))];
    
    vdcs.sort().forEach(vdc => {
        const option = document.createElement('option');
        option.value = vdc;
        option.textContent = vdc;
        vdcSelect.appendChild(option);
    });
    
    // VDC change event
    vdcSelect.addEventListener('change', function() {
        const wardSelect = document.getElementById('wardSelect');
        wardSelect.innerHTML = '<option value="">Select Ward</option>';
        wardSelect.disabled = !this.value;
        
        if (this.value) {
            const wards = [...new Set(
                geoData.features
                    .filter(f => f.properties.Former_VDC === this.value)
                    .map(f => f.properties.Wardno)
            )];
            
            wards.sort().forEach(ward => {
                const option = document.createElement('option');
                option.value = ward;
                option.textContent = ward;
                wardSelect.appendChild(option);
            });
        }
    });
    
    // Form submission
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchParcels();
    });
    
    // Initialize map
    map = L.map('map').setView([27.7, 85.3], 12); // Set default coordinates for Nepal
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function searchParcels() {
    const vdc = document.getElementById('vdcSelect').value;
    const ward = document.getElementById('wardSelect').value;
    const parcelInput = document.getElementById('parcelInput').value;
    const parcelNumbers = parcelInput.split(',').map(p => p.trim());
    
    // Filter features based on selection
    let filteredFeatures = geoData.features;
    
    if (vdc) {
        filteredFeatures = filteredFeatures.filter(f => f.properties.Former_VDC === vdc);
    }
    
    if (ward) {
        filteredFeatures = filteredFeatures.filter(f => f.properties.Wardno === ward);
    }
    
    if (parcelInput) {
        filteredFeatures = filteredFeatures.filter(f => 
            parcelNumbers.includes(f.properties.PARCELID) // Replace PARCELID with your actual property name
        );
    }
    
    // Display results on map
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }
    
    if (filteredFeatures.length > 0) {
        const filteredGeoJson = {
            type: 'FeatureCollection',
            features: filteredFeatures
        };
        
        geoJsonLayer = L.geoJSON(filteredGeoJson, {
            onEachFeature: function(feature, layer) {
                // Customize popup content based on your GeoJSON properties
                let popupContent = `<b>VDC:</b> ${feature.properties.Former_VDC}<br>`;
                popupContent += `<b>Ward:</b> ${feature.properties.Wardno}<br>`;
                popupContent += `<b>Parcel:</b> ${feature.properties.PARCELID}`; // Adjust property names
                layer.bindPopup(popupContent);
            }
        }).addTo(map);
        
        // Zoom to the results
        map.fitBounds(geoJsonLayer.getBounds());
    } else {
        alert('No parcels found matching your criteria.');
    }
}
