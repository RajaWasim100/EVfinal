// Initialize maps and route information
let ev2Map;
let ev4Map;
let ev2Markers = [];
let ev4Markers = [];
let routePathEV2;
let routePathEV4;
let infoWindow = null;

// Route coordinates (approximated for demo)
const routeCoordinatesEV2 = [
    { lat: 24.9801, lng: 67.1702 }, // Bahria Town Main Gate
    { lat: 24.9601, lng: 67.1502 }, // DHA Phase 8
    { lat: 24.9401, lng: 67.1302 }, // Malir Cantonment
    { lat: 24.9205, lng: 67.0836 }  // Malir Halt
];

const routeCoordinatesEV4 = [
    { lat: 24.9801, lng: 67.1702 }, // Bahria Town Main Gate
    { lat: 24.9601, lng: 67.1502 }, // DHA Phase 8
    { lat: 24.9501, lng: 67.1402 }, // Quaid-e-Azam Terminal
    { lat: 24.9401, lng: 67.1302 }, // Malir Cantonment
    { lat: 24.9205, lng: 67.0836 }  // Malir Halt
];

// Initialize Google Maps
function fallbackInitMap() {

    infoWindow = new google.maps.InfoWindow();
    
    // Initialize EV2 Map
    ev2Map = new google.maps.Map(document.getElementById("ev2Map"), {
        center: { lat: 24.9500, lng: 67.1300 },
        zoom: 11,
        styles: [
            {
                "featureType": "transit.station.bus",
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "on" }]
            }
        ]
    });
    
    // Initialize EV4 Map
    ev4Map = new google.maps.Map(document.getElementById("ev4Map"), {
        center: { lat: 24.9500, lng: 67.1300 },
        zoom: 11,
        styles: [
            {
                "featureType": "transit.station.bus",
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "on" }]
            }
        ]
    });
    
    // Initialize route tabs
    initRouteTabs();
    
    // Load EV2 route
    loadRouteEV2();
    
    // Load EV4 route with delay to ensure maps are fully initialized
    setTimeout(() => {
        loadRouteEV4();
    }, 100);
}

// Initialize route tabs functionality
window.initRouteTabs = function() {

    const routeTabs = document.querySelectorAll('.route-tab');
    const routeTabPanes = document.querySelectorAll('.route-tab-pane');
    
    routeTabs.forEach(tab => {
        window.addEventListener('DOMContentLoaded', function () {
            setTimeout(fallbackInitMap, 300);
        });
        
            
            // Remove active class from all tabs and panes
            routeTabs.forEach(t => t.classList.remove('active'));
            routeTabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            document.getElementById(routeId).classList.add('active');
            
            // Trigger resize on maps to fix display issues
            if (routeId === 'ev2' && ev2Map) {
                google.maps.event.trigger(ev2Map, 'resize');
                if (ev2Markers.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    ev2Markers.forEach(marker => bounds.extend(marker.getPosition()));
                    ev2Map.fitBounds(bounds);
                }
            } else if (routeId === 'ev4' && ev4Map) {
                google.maps.event.trigger(ev4Map, 'resize');
                if (ev4Markers.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    ev4Markers.forEach(marker => bounds.extend(marker.getPosition()));
                    ev4Map.fitBounds(bounds);
                }
            }
        });
    };


// Load EV2 Express route
function loadRouteEV2() {
    // Clear previous markers
    clearMarkers(ev2Markers);
    ev2Markers = [];
    
    // Create route path
    routePathEV2 = new google.maps.Polyline({
        path: routeCoordinatesEV2,
        geodesic: true,
        strokeColor: '#09a68c',
        strokeOpacity: 1.0,
        strokeWeight: 4
    });
    
    routePathEV2.setMap(ev2Map);
    
    // Add stop markers
    addStopMarkers(ev2Map, routeCoordinatesEV2, 'EV2', ev2Markers);
    
    // Add bus markers
    fetch('/api/buses/ev2')
        .then(response => response.json())
        .then(buses => {
            buses.forEach(bus => {
                addBusMarker(ev2Map, bus, ev2Markers);
            });
            
            // Fit map to show all markers
            if (ev2Markers.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                ev2Markers.forEach(marker => bounds.extend(marker.getPosition()));
                ev2Map.fitBounds(bounds);
            }
        })
        .catch(error => console.error('Error fetching EV2 buses:', error));
    
    // Fetch stop data
    fetch('/api/stops/ev2')
        .then(response => response.json())
        .then(stops => {
            // Update stop markers with real data if needed
        })
        .catch(error => console.error('Error fetching EV2 stops:', error));
}

// Load EV4 Shuttle route
function loadRouteEV4() {
    // Clear previous markers
    clearMarkers(ev4Markers);
    ev4Markers = [];
    
    // Create route path
    routePathEV4 = new google.maps.Polyline({
        path: routeCoordinatesEV4,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 1.0,
        strokeWeight: 4
    });
    
    routePathEV4.setMap(ev4Map);
    
    // Add stop markers
    addStopMarkers(ev4Map, routeCoordinatesEV4, 'EV4', ev4Markers);
    
    // Add bus markers
    fetch('/api/buses/ev4')
        .then(response => response.json())
        .then(buses => {
            buses.forEach(bus => {
                addBusMarker(ev4Map, bus, ev4Markers);
            });
            
            // Fit map to show all markers
            if (ev4Markers.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                ev4Markers.forEach(marker => bounds.extend(marker.getPosition()));
                ev4Map.fitBounds(bounds);
            }
        })
        .catch(error => console.error('Error fetching EV4 buses:', error));
    
    // Fetch stop data
    fetch('/api/stops/ev4')
        .then(response => response.json())
        .then(stops => {
            // Update stop markers with real data if needed
        })
        .catch(error => console.error('Error fetching EV4 stops:', error));
}

// Add stop markers to the map
function addStopMarkers(map, coordinates, routeType, markersArray) {
    const stopNames = routeType === 'EV2' 
        ? ['Bahria Town Main Gate', 'DHA Phase 8', 'Malir Cantonment', 'Malir Halt']
        : ['Bahria Town Main Gate', 'DHA Phase 8', 'Quaid-e-Azam Terminal', 'Malir Cantonment', 'Malir Halt'];
    
    coordinates.forEach((position, index) => {
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: stopNames[index],
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="${routeType === 'EV2' ? '#09a68c' : '#3b82f6'}">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 24)
            },
            zIndex: 5
        });
        
        // Add stop info window on click
        marker.addListener('click', () => {
            const content = `
                <div class="stop-info-window">
                    <h3>${stopNames[index]}</h3>
                    <p>Route: ${routeType} ${routeType === 'EV2' ? 'Express' : 'Shuttle'}</p>
                    <p>Stop ${index + 1} of ${coordinates.length}</p>
                </div>
            `;
            
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        });
        
        markersArray.push(marker);
    });
}

// Add a bus marker to the map
function addBusMarker(map, bus, markersArray) {
    const marker = new google.maps.Marker({
        position: bus.location,
        map: map,
        title: bus.route,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${bus.id.startsWith('ev2') ? '#09a68c' : '#3b82f6'}">
                    <path d="M4,16c0,0.88 0.39,1.67 1,2.22V20c0,0.55 0.45,1 1,1h1c0.55,0 1,-0.45 1,-1v-1h8v1c0,0.55 0.45,1 1,1h1c0.55,0 1,-0.45 1,-1v-1.78c0.61,-0.55 1,-1.34 1,-2.22V6c0,-3.5 -3.58,-4 -8,-4s-8,0.5 -8,4v10zm3.5,1c-0.83,0 -1.5,-0.67 -1.5,-1.5S6.67,14 7.5,14s1.5,0.67 1.5,1.5S8.33,17 7.5,17zm9,0c-0.83,0 -1.5,-0.67 -1.5,-1.5s0.67,-1.5 1.5,-1.5 1.5,0.67 1.5,1.5 -0.67,1.5 -1.5,1.5z"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
        },
        zIndex: 10
    });
    
    // Add bus info window on click
    marker.addListener('click', () => {
        const content = `
            <div class="bus-info-window">
                <h3>${bus.route}</h3>
                <p>${bus.status}</p>
                <p>Next Stop: ${bus.nextStop}</p>
                <p>ETA: ${bus.estimatedArrival}</p>
            </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    });
    
    markersArray.push(marker);
}

// Clear all markers from the map
function clearMarkers(markersArray) {
    markersArray.forEach(marker => {
        marker.setMap(null);
    });
}

// Make sure map initializes when Google Maps API loads
window.initMap = initMap;
