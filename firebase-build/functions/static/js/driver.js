// Driver dashboard map and tracking functionality
let driverMap;
let driverMarker;
let stopMarkers = [];
let routePath;
let infoWindow;
let isTripsStarted = false;
let intervalId;
let driverBus = null;

// Initialize Google Map
function initMap() {
    // Get bus ID from the page
    const busId = document.querySelector('.driver-welcome p').textContent.split('Bus ID: ')[1].trim();
    const routeType = busId.split('-')[0]; // ev2 or ev4
    
    // Fetch bus data
    fetch(`/api/buses/${routeType}`)
        .then(response => response.json())
        .then(buses => {
            // Find the driver's bus
            driverBus = buses.find(bus => bus.id === busId);
            
            if (!driverBus) {
                console.error('Driver bus not found');
                return;
            }
            
            // Initialize map centered on the driver's bus
            driverMap = new google.maps.Map(document.getElementById('driverMap'), {
                center: driverBus.location,
                zoom: 13,
                styles: [
                    {
                        "featureType": "transit.station.bus",
                        "elementType": "labels.icon",
                        "stylers": [{ "visibility": "on" }]
                    }
                ]
            });
            
            infoWindow = new google.maps.InfoWindow();
            
            // Add driver's bus marker
            addDriverMarker(driverBus.location);
            
            // Load route stops
            loadRouteStops(routeType);
            
            // Initialize trip controls
            initTripControls();
        })
        .catch(error => console.error('Error fetching bus data:', error));
}

// Add driver's bus marker
function addDriverMarker(location) {
    // Remove existing marker if any
    if (driverMarker) {
        driverMarker.setMap(null);
    }
    
    driverMarker = new google.maps.Marker({
        position: location,
        map: driverMap,
        title: 'Your Bus',
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="#09a68c">
                    <path d="M4,16c0,0.88 0.39,1.67 1,2.22V20c0,0.55 0.45,1 1,1h1c0.55,0 1,-0.45 1,-1v-1h8v1c0,0.55 0.45,1 1,1h1c0.55,0 1,-0.45 1,-1v-1.78c0.61,-0.55 1,-1.34 1,-2.22V6c0,-3.5 -3.58,-4 -8,-4s-8,0.5 -8,4v10zm3.5,1c-0.83,0 -1.5,-0.67 -1.5,-1.5S6.67,14 7.5,14s1.5,0.67 1.5,1.5S8.33,17 7.5,17zm9,0c-0.83,0 -1.5,-0.67 -1.5,-1.5s0.67,-1.5 1.5,-1.5 1.5,0.67 1.5,1.5 -0.67,1.5 -1.5,1.5z"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(36, 36),
            anchor: new google.maps.Point(18, 18)
        },
        zIndex: 10,
        animation: google.maps.Animation.BOUNCE
    });
    
    // Stop animation after 3 seconds
    setTimeout(() => {
        driverMarker.setAnimation(null);
    }, 3000);
    
    // Add info window
    driverMarker.addListener('click', () => {
        const content = `
            <div class="driver-info-window">
                <h3>Your Bus</h3>
                <p>Status: ${driverBus.status}</p>
                <p>Next Stop: ${driverBus.nextStop}</p>
                <p>ETA: ${driverBus.estimatedArrival}</p>
            </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open(driverMap, driverMarker);
    });
}

// Load route stops
function loadRouteStops(routeType) {
    fetch(`/api/stops/${routeType}`)
        .then(response => response.json())
        .then(stops => {
            // Clear existing stop markers
            stopMarkers.forEach(marker => marker.setMap(null));
            stopMarkers = [];
            
            // Add stop markers
            stops.forEach((stop, index) => {
                addStopMarker(stop, index);
            });
            
            // Create route path
            const coordinates = stops.map(stop => stop.location);
            
            if (routePath) {
                routePath.setMap(null);
            }
            
            routePath = new google.maps.Polyline({
                path: coordinates,
                geodesic: true,
                strokeColor: '#09a68c',
                strokeOpacity: 0.7,
                strokeWeight: 4
            });
            
            routePath.setMap(driverMap);
            
            // Fit map to show all points
            const bounds = new google.maps.LatLngBounds();
            coordinates.forEach(coord => bounds.extend(coord));
            driverMap.fitBounds(bounds);
            
            // Update stop markers and highlight the next stop
            highlightNextStop(driverBus.nextStop);
            
            // Handle the stop item clicks in the sidebar
            handleStopItemClicks();
        })
        .catch(error => console.error('Error loading route stops:', error));
}

// Add stop marker
function addStopMarker(stop, index) {
    const isNextStop = stop.name === driverBus.nextStop;
    
    const marker = new google.maps.Marker({
        position: stop.location,
        map: driverMap,
        title: stop.name,
        label: {
            text: (index + 1).toString(),
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 'bold'
        },
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="${isNextStop ? '#ff6b6b' : '#3b82f6'}">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 28),
            labelOrigin: new google.maps.Point(12, 9)
        },
        zIndex: isNextStop ? 9 : 5
    });
    
    marker.addListener('click', () => {
        const content = `
            <div class="stop-info-window">
                <h3>${stop.name}</h3>
                <p>Stop #${index + 1}</p>
                ${isNextStop ? '<p><b>Next Stop</b> - Arriving in ' + driverBus.estimatedArrival + '</p>' : ''}
            </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open(driverMap, marker);
    });
    
    stopMarkers.push(marker);
}

// Highlight the next stop in the stops list
function highlightNextStop(nextStopName) {
    // Update the UI to show the next stop
    const stopItems = document.querySelectorAll('.stop-item');
    
    stopItems.forEach(item => {
        const stopName = item.querySelector('.stop-name').textContent;
        
        if (stopName === nextStopName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Handle stop item clicks in sidebar
function handleStopItemClicks() {
    const stopItems = document.querySelectorAll('.stop-item');
    
    stopItems.forEach((item, index) => {
        const button = item.querySelector('.btn');
        
        button.addEventListener('click', () => {
            // Only allow marking stops as completed if trip is started
            if (!isTripsStarted) {
                alert('Please start your trip first');
                return;
            }
            
            const stopName = item.querySelector('.stop-name').textContent;
            
            // Mark this stop as completed and update next stop
            markStopAsCompleted(index, stopName);
        });
    });
}

// Mark a stop as completed and update next stop
function markStopAsCompleted(index, stopName) {
    const stopItems = document.querySelectorAll('.stop-item');
    
    // If this is not the current next stop, show error
    if (stopName !== driverBus.nextStop) {
        alert(`You must complete the stops in order. Next stop is ${driverBus.nextStop}.`);
        return;
    }
    
    // Mark current stop as completed
    const button = stopItems[index].querySelector('.btn');
    button.classList.add('active');
    button.innerHTML = '<i class="fas fa-check"></i>';
    
    // Find next stop
    if (index + 1 < stopItems.length) {
        const nextStopName = stopItems[index + 1].querySelector('.stop-name').textContent;
        driverBus.nextStop = nextStopName;
        driverBus.estimatedArrival = '10 min'; // Mock ETA
        
        // Update UI
        highlightNextStop(nextStopName);
        
        // Update stop markers
        updateStopMarkers();
        
        // Update progress bar
        updateTripProgress(index + 1, stopItems.length);
    } else {
        // End of route
        alert('You have reached the final stop! Trip complete.');
        endTrip();
    }
}

// Update stop markers after completing a stop
function updateStopMarkers() {
    stopMarkers.forEach((marker, index) => {
        const isNextStop = marker.getTitle() === driverBus.nextStop;
        
        marker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="${isNextStop ? '#ff6b6b' : '#3b82f6'}">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 28),
            labelOrigin: new google.maps.Point(12, 9)
        });
        
        if (isNextStop) {
            marker.setZIndex(9);
        } else {
            marker.setZIndex(5);
        }
    });
}

// Update trip progress bar
function updateTripProgress(completedStops, totalStops) {
    const progressPercentage = (completedStops / totalStops) * 100;
    document.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
    document.querySelector('.progress-header span:last-child').textContent = `${Math.round(progressPercentage)}%`;
}

// Initialize trip controls
function initTripControls() {
    const btnStartTrip = document.getElementById('btnStartTrip');
    const btnEndTrip = document.getElementById('btnEndTrip');
    
    btnStartTrip.addEventListener('click', function(e) {
        e.preventDefault();
        startTrip();
    });
    
    btnEndTrip.addEventListener('click', function(e) {
        e.preventDefault();
        endTrip();
    });
}

// Start the trip
function startTrip() {
    if (isTripsStarted) {
        alert('Trip already in progress');
        return;
    }
    
    isTripsStarted = true;
    document.getElementById('btnStartTrip').classList.add('btn-primary');
    document.getElementById('btnStartTrip').classList.remove('btn-outline');
    
    // Start simulated movement
    startSimulatedBusMovement();
    
    alert('Trip started! You are now in service.');
}

// End the trip
function endTrip() {
    if (!isTripsStarted) {
        alert('No trip in progress');
        return;
    }
    
    isTripsStarted = false;
    document.getElementById('btnStartTrip').classList.remove('btn-primary');
    document.getElementById('btnStartTrip').classList.add('btn-outline');
    
    // Stop simulated movement
    clearInterval(intervalId);
    
    alert('Trip ended! You are now out of service.');
}

// Simulate bus movement along the route
function startSimulatedBusMovement() {
    let routeIndex = 0;
    const routePoints = stopMarkers.map(marker => marker.getPosition());
    
    // Interpolate points between stops to create smoother movement
    const interpolatedRoute = [];
    for (let i = 0; i < routePoints.length - 1; i++) {
        const start = routePoints[i];
        const end = routePoints[i + 1];
        
        // Add the start point
        interpolatedRoute.push(start);
        
        // Add 5 intermediate points
        for (let j = 1; j <= 5; j++) {
            const fraction = j / 6;
            const lat = start.lat() + (end.lat() - start.lat()) * fraction;
            const lng = start.lng() + (end.lng() - start.lng()) * fraction;
            interpolatedRoute.push(new google.maps.LatLng(lat, lng));
        }
    }
    
    // Add the last point
    interpolatedRoute.push(routePoints[routePoints.length - 1]);
    
    // Move the bus along the route
    intervalId = setInterval(() => {
        if (routeIndex >= interpolatedRoute.length) {
            clearInterval(intervalId);
            alert('You have reached the end of the route!');
            endTrip();
            return;
        }
        
        // Update marker position
        driverMarker.setPosition(interpolatedRoute[routeIndex]);
        
        // Center map on marker
        driverMap.panTo(interpolatedRoute[routeIndex]);
        
        routeIndex++;
        
        // If we've reached a stop point (every 6 points)
        if (routeIndex % 6 === 0) {
            const stopIndex = Math.floor(routeIndex / 6) - 1;
            if (stopIndex >= 0 && stopIndex < stopMarkers.length) {
                // Simulate arriving at this stop
                driverBus.nextStop = stopMarkers[stopIndex].getTitle();
                highlightNextStop(driverBus.nextStop);
            }
        }
    }, 2000); // Move every 2 seconds
}

// Make sure map initializes when Google Maps API loads
window.initMap = initMap;
