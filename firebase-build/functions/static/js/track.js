// Initialize map and tracking functionality
let map;
let markers = [];
let selectedRoute = null;
let selectedStop = null;
let busData = {};
let stopsData = {};
let infoWindow = null;
let trackingInterval = null;

// Initialize Google Map
function initMap() {
    // Center on Karachi (Default location)
    const karachiLocation = { lat: 24.9500, lng: 67.1180 };
    
    map = new google.maps.Map(document.getElementById("busMap"), {
        center: karachiLocation,
        zoom: 11,
        styles: [
            {
                "featureType": "transit.station.bus",
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "on" }]
            }
        ]
    });
    
    infoWindow = new google.maps.InfoWindow();

    // Hide the overlay initially since the map is loaded
    document.getElementById('mapOverlay').classList.add('hidden');
    
    // Initialize form elements
    initFormElements();
    
    // Initialize bus tracking buttons
    initBusTrackingButtons();
    
    // Load initial data
    fetchInitialData();
}

// Initialize the form select elements and button
function initFormElements() {
    const routeSelect = document.getElementById('routeSelect');
    const stopSelect = document.getElementById('stopSelect');
    const trackBtn = document.querySelector('.track-btn');
    
    // Route selection event
    routeSelect.addEventListener('change', function() {
        selectedRoute = this.value;
        if (selectedRoute) {
            loadStops(selectedRoute);
            stopSelect.disabled = false;
            updateMapForRoute(selectedRoute);
        } else {
            stopSelect.disabled = true;
            trackBtn.disabled = true;
        }
    });
    
    // Stop selection event
    stopSelect.addEventListener('change', function() {
        selectedStop = this.value;
        if (selectedStop) {
            trackBtn.disabled = false;
        } else {
            trackBtn.disabled = true;
        }
    });
    
    // Track button event
    trackBtn.addEventListener('click', function() {
        if (selectedRoute && selectedStop) {
            trackBuses(selectedRoute, selectedStop);
        }
    });
    
    // Refresh tracking event
    document.getElementById('refreshTracking').addEventListener('click', function(e) {
        e.preventDefault();
        if (selectedRoute) {
            updateMapForRoute(selectedRoute);
        }
    });
}

// Initialize bus tracking buttons
function initBusTrackingButtons() {
    const trackBusButtons = document.querySelectorAll('.track-bus-btn');
    
    trackBusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const busId = this.getAttribute('data-bus-id');
            const routeId = busId.split('-')[0]; // Extract route ID (ev2 or ev4)
            
            // Update route select dropdown
            document.getElementById('routeSelect').value = routeId;
            
            // Trigger change event to load stops
            const changeEvent = new Event('change');
            document.getElementById('routeSelect').dispatchEvent(changeEvent);
            
            // Track the specific bus
            trackSpecificBus(busId);
        });
    });
}

// Fetch initial data from API endpoints
function fetchInitialData() {
    // Fetch routes data
    fetch('/api/routes')
        .then(response => response.json())
        .then(data => {
            // Store routes data if needed
        })
        .catch(error => console.error('Error fetching routes:', error));
    
    // Fetch buses data for both routes
    fetch('/api/buses/ev2')
        .then(response => response.json())
        .then(data => {
            busData.ev2 = data;
            updateBusList('ev2', data);
        })
        .catch(error => console.error('Error fetching EV2 buses:', error));
    
    fetch('/api/buses/ev4')
        .then(response => response.json())
        .then(data => {
            busData.ev4 = data;
            updateBusList('ev4', data);
        })
        .catch(error => console.error('Error fetching EV4 buses:', error));
}

// Load stops for selected route
function loadStops(routeId) {
    fetch(`/api/stops/${routeId}`)
        .then(response => response.json())
        .then(data => {
            stopsData[routeId] = data;
            
            // Populate stops dropdown
            const stopSelect = document.getElementById('stopSelect');
            stopSelect.innerHTML = '<option value="" selected disabled>Choose a stop</option>';
            
            data.forEach(stop => {
                const option = document.createElement('option');
                option.value = stop.id;
                option.textContent = stop.name;
                stopSelect.appendChild(option);
            });
        })
        .catch(error => console.error(`Error fetching stops for ${routeId}:`, error));
}

// Update the map for a selected route
function updateMapForRoute(routeId) {
    clearMarkers();
    
    fetch(`/api/buses/${routeId}`)
        .then(response => response.json())
        .then(data => {
            busData[routeId] = data;
            
            // Add bus markers to the map
            addBusMarkers(data);
            
            // Add stop markers if we have them
            if (stopsData[routeId]) {
                addStopMarkers(stopsData[routeId]);
            }
            
            // Fit map to show all markers
            fitMapToBounds();
            
            // Update bus list
            updateBusList(routeId, data);
            
            // Update arrivals list based on selected stop (if any)
            updateArrivalsListForRoute(routeId);
        })
        .catch(error => console.error(`Error updating map for ${routeId}:`, error));
}

// Track buses for a specific route and stop
function trackBuses(routeId, stopId) {
    clearMarkers();
    
    // Find the selected stop
    const selectedStopObj = stopsData[routeId].find(stop => stop.id === stopId);
    
    if (selectedStopObj) {
        // Center map on selected stop
        map.setCenter(selectedStopObj.location);
        map.setZoom(13);
        
        // Add stop marker
        addStopMarker(selectedStopObj, true);
        
        // Add buses for the route
        if (busData[routeId]) {
            addBusMarkers(busData[routeId]);
        }
        
        // Update arrivals list for the selected stop
        updateArrivalsListForStop(routeId, stopId);
        
        // Set up interval for real-time tracking
        if (trackingInterval) {
            clearInterval(trackingInterval);
        }
        
        trackingInterval = setInterval(() => {
            updateMapForRoute(routeId);
        }, 10000); // Update every 10 seconds
    }
}

// Track a specific bus
function trackSpecificBus(busId) {
    const routeId = busId.split('-')[0]; // Extract route ID (ev2 or ev4)
    
    // Find the bus object
    const bus = busData[routeId].find(b => b.id === busId);
    
    if (bus) {
        clearMarkers();
        
        // Add the bus marker
        const marker = addBusMarker(bus);
        
        // Center on the bus
        map.setCenter(bus.location);
        map.setZoom(14);
        
        // Open info window for this bus
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
    }
}

// Add bus markers to the map
function addBusMarkers(buses) {
    buses.forEach(bus => {
        addBusMarker(bus);
    });
}

// Add a single bus marker
function addBusMarker(bus) {
    const marker = new google.maps.Marker({
        position: bus.location,
        map: map,
        title: bus.route,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#09a68c">
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
    
    markers.push(marker);
    return marker;
}

// Add stop markers to the map
function addStopMarkers(stops) {
    stops.forEach(stop => {
        addStopMarker(stop);
    });
}

// Add a single stop marker
function addStopMarker(stop, isSelected = false) {
    const marker = new google.maps.Marker({
        position: stop.location,
        map: map,
        title: stop.name,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="${isSelected ? '#ff6b6b' : '#3b82f6'}">
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
                <h3>${stop.name}</h3>
                <p>Bus Stop ID: ${stop.id}</p>
            </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    });
    
    markers.push(marker);
    return marker;
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// Fit map to show all markers
function fitMapToBounds() {
    if (markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
        bounds.extend(marker.getPosition());
    });
    
    map.fitBounds(bounds);
    
    // Don't zoom in too far
    if (map.getZoom() > 15) {
        map.setZoom(15);
    }
}

// Update the bus list display
function updateBusList(routeId, buses) {
    const busList = document.getElementById('activeBusList');
    
    if (!busList) return;
    
    // Keep existing buses for other routes
    const existingBuses = Array.from(busList.querySelectorAll('.bus-item'))
        .filter(item => {
            const busId = item.querySelector('.track-bus-btn').getAttribute('data-bus-id');
            return !busId.startsWith(routeId + '-');
        });
    
    // Clear bus list for this route
    busList.innerHTML = '';
    
    // Add existing buses for other routes back
    existingBuses.forEach(item => {
        busList.appendChild(item);
    });
    
    // Add new buses for this route
    buses.forEach(bus => {
        const busItem = document.createElement('div');
        busItem.className = 'bus-item';
        busItem.innerHTML = `
            <div class="bus-icon">${routeId.toUpperCase()}</div>
            <div class="bus-info">
                <div class="bus-route">${bus.route}</div>
                <div class="bus-status">${bus.status}</div>
            </div>
            <div class="bus-action">
                <button class="btn btn-sm btn-outline track-bus-btn" data-bus-id="${bus.id}">Track</button>
            </div>
        `;
        
        busList.appendChild(busItem);
        
        // Add event listener to the new button
        const button = busItem.querySelector('.track-bus-btn');
        button.addEventListener('click', function() {
            const busId = this.getAttribute('data-bus-id');
            trackSpecificBus(busId);
        });
    });
}

// Update arrivals list for a route
function updateArrivalsListForRoute(routeId) {
    const arrivalsList = document.getElementById('arrivalsList');
    
    if (!arrivalsList) return;
    
    // Mock arrival times for now, these would come from the API in a real application
    const mockArrivals = [
        { time: '7:30 AM', route: 'EV2 Express', status: 'Arriving in 5 min' },
        { time: '7:45 AM', route: 'EV4 Shuttle', status: 'Arriving in 20 min' },
        { time: '8:00 AM', route: 'EV2 Express', status: 'Arriving in 35 min' }
    ];
    
    // Update arrivals list
    arrivalsList.innerHTML = '';
    
    mockArrivals.forEach(arrival => {
        const arrivalItem = document.createElement('div');
        arrivalItem.className = 'arrival-item';
        arrivalItem.innerHTML = `
            <div class="arrival-time">${arrival.time}</div>
            <div class="arrival-info">
                <div class="arrival-route">${arrival.route}</div>
                <div class="arrival-status">${arrival.status}</div>
            </div>
        `;
        
        arrivalsList.appendChild(arrivalItem);
    });
}

// Update arrivals list for a specific stop
function updateArrivalsListForStop(routeId, stopId) {
    // This would fetch real arrival times from the API in a real application
    // For now, we'll use the current buses and their ETAs
    updateArrivalsListForRoute(routeId);
}

// Make sure map initializes when Google Maps API loads
window.initMap = initMap;
