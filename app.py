import re
import os
import logging
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db, auth
from flask_compress import Compress

# Set GOOGLE_APPLICATION_CREDENTIALS if hosted
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Firebase app with error handling
try:
    # Check if Firebase is already initialized
    if not firebase_admin._apps:
        # Path to the JSON file
        cred_path = "ev-app-9d9ad-firebase-adminsdk-fbsvc-4bf25d6bc4.json"
        
        if not os.path.exists(cred_path):
            raise FileNotFoundError(f"Firebase credentials file not found at {cred_path}")
            
        cred = credentials.Certificate(cred_path)
        
        # Initialize Firebase app with all required options
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://ev-app-9d9ad-default-rtdb.firebaseio.com/',
            'projectId': 'ev-app-9d9ad',
            'storageBucket': 'ev-app-9d9ad.appspot.com',
            'authDomain': 'ev-app-9d9ad.firebaseapp.com'
        })
        logger.info("Firebase initialized successfully")
    else:
        logger.info("Firebase already initialized")
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {str(e)}")
    raise

app = Flask(__name__)
Compress(app)  # Enable gzip compression
app.secret_key = os.environ.get("SESSION_SECRET", "spot-ev-secret-key")

# List of admin emails
ADMIN_EMAILS = [
    'rajawasim1002@gmail.com',
    'abdur.00375@iqra.edu.pk',
    'aakhund26@gmail.com',
    'muhammad.00266@iqra.edu.pk'
]

# update_driver_status

@app.route('/update_driver_status', methods=['POST'])
def update_driver_status():
    data = request.json
    identifier = data.get('identifier')  # CNIC or name
    new_status = data.get('status')      # 'active' or 'inactive'

    if not identifier or not new_status:
        return jsonify({'status': 'error', 'message': 'Missing identifier or status'}), 400

    # Clean identifier input
    identifier_clean = str(identifier).replace('-', '').replace(' ', '').strip().lower()

    drivers_ref = db.reference('drivers')
    drivers_data = drivers_ref.get()

    updated = False
    for driver_id, driver in drivers_data.items():
        driver_cnic_clean = str(driver.get('cnic', '')).replace('-', '').replace(' ', '').strip().lower()
        driver_name_clean = str(driver.get('name', '')).strip().lower()
        if driver_cnic_clean == identifier_clean or driver_name_clean == identifier_clean:
            db.reference(f'drivers/{driver_id}/status').set(new_status)
            updated = True
            break

    if updated:
        return jsonify({'status': 'success', 'message': f'Driver status updated to {new_status}'})
    else:
        return jsonify({'status': 'error', 'message': 'Driver not found'}), 404

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/track.html')
def track():
    return render_template('track.html')

@app.route('/ev-routes.html')
def ev_routes():
    routes_ref = db.reference('routes')
    routes_data = routes_ref.get() or {}
    return render_template('ev-routes.html', routes=routes_data)

@app.route('/contact.html')
def contact():
    return render_template('contact.html')

# @app.route('/drivers-login.html', methods=['GET', 'POST'])
# def drivers_login():
#     # Clear any existing session data when accessing login page
#     if request.method == 'GET':
#         session.clear()
#         return render_template('drivers-login.html')
    
#     if request.method == 'POST':
#         try:
#             username = request.form.get('username')
#             password = request.form.get('password')
            
#             if not username or not password:
#                 return jsonify({
#                     'status': 'error',
#                     'message': 'Username and password are required'
#                 }), 400
            
#             # Get drivers from Firebase
#             drivers_ref = db.reference('drivers')
#             drivers_data = drivers_ref.get()
            
#             if not drivers_data:
#                 return jsonify({
#                     'status': 'error',
#                     'message': 'No drivers found in the system'
#                 }), 404
            
#             for driver_id, driver in drivers_data.items():
#                 if driver.get('username') == username and driver.get('password') == password:

#                     #inactive condition
#                  if driver.get('status') == 'inactive':
#                     return jsonify({
#                          'status': 'error',
#                          'message': 'Account is inactive. Please contact admin.'
#                     }), 403

#                     # Check if this is the default password
#                     if password == "password123":
#                         return jsonify({
#                             'status': 'change_password',
#                             'message': 'Please change your password',
#                             'driver_id': driver_id
#                         }), 200
                    
#                     # Normal login success
#                     session.clear()  # Clear any existing session data
#                     session['logged_in'] = True
#                     session['username'] = username
#                     session['driver_name'] = driver.get('name')
#                     session['bus_id'] = driver.get('bus_id')
#                     session['driver_id'] = driver_id
                    
#                     return jsonify({
#                         'status': 'success',
#                         'message': 'Login successful'
#                     }), 200
            
#             # If we get here, no matching credentials were found
#             return jsonify({
#                 'status': 'error',
#                 'message': 'Invalid username or password'
#             }), 401
            
#         except Exception as e:
#             logging.error(f"Login error: {str(e)}")
#             return jsonify({
#                 'status': 'error',
#                 'message': 'An error occurred during login'
#             }), 500
    
#     return render_template('drivers-login.html')

@app.route('/drivers-login.html', methods=['GET', 'POST'])
def drivers_login():
    # Clear any existing session data when accessing login page
    if request.method == 'GET':
        session.clear()
        return render_template('drivers-login.html')

    if request.method == 'POST':
        try:
            username = request.form.get('username')
            password = request.form.get('password')
            ...

            if not username or not password:
                return jsonify({
                    'status': 'error',
                    'message': 'Username and password are required'
                }), 400

            # Get drivers from Firebase
            drivers_ref = db.reference('drivers')
            drivers_data = drivers_ref.get()

            if not drivers_data:
                return jsonify({
                    'status': 'error',
                    'message': 'No drivers found in the system'
                }), 404

            for driver_id, driver in drivers_data.items():
                if driver.get('username') == username and driver.get('password') == password:

                    # Check if account is inactive
                    if driver.get('status') == 'inactive':
                        return jsonify({
                            'status': 'error',
                            'message': 'Account is inactive. Please contact admin.'
                        }), 403

                    # Check if this is the default password
                    if password == "password123":
                        return jsonify({
                            'status': 'change_password',
                            'message': 'Please change your password',
                            'driver_id': driver_id
                        }), 200
                    

                    # Normal login success
                    session.clear()  # Clear any existing session data
                    session['logged_in'] = True
                    session['username'] = username
                    session['driver_name'] = driver.get('name')
                    session['bus_id'] = driver.get('bus_id')
                    session['driver_id'] = driver_id

                    return jsonify({
                        'status': 'success',
                        'message': 'Login successful'
                    }), 200

            # If we get here, no matching credentials were found
            return jsonify({
                'status': 'error',
                'message': 'Invalid username or password'
            }), 401

        except Exception as e:
            logging.error(f"Login error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'An error occurred during login'
            }), 500

    return render_template('drivers-login.html')


@app.route('/driver-dashboard.html')
def driver_dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('drivers_login'))
    
    driver_id = session.get('driver_id')
    driver_ref = db.reference(f'drivers/{driver_id}')
    driver_data = driver_ref.get()
    
    if not driver_data:
        return redirect(url_for('drivers_login'))
    
    # Get driver's current location and status from Firebase
    user_ref = db.reference(f'users/{driver_id}')
    user_data = user_ref.get() or {}
    
    # Ensure route_id is lowercase for consistency
    route = driver_data.get('route', '')
    route_id = route.lower() if route else ''
    
    app.logger.debug(f'Driver data: {driver_data}')
    app.logger.debug(f'User data: {user_data}')
    
    # Get bus details from the buses collection
    bus_id = driver_data.get('bus_id', '')
    bus_ref = db.reference(f'buses/{bus_id}')
    bus_data = bus_ref.get() or {}
    
    bus_details = {
        'id': bus_id,
        'bus_number': bus_data.get('busNumber', ''),
        'route': route,
        'route_id': route_id,
        'status': user_data.get('status', 'Offline'),
        'speed': user_data.get('speed', '0'),
        'nextStop': user_data.get('nextStop', 'Not available'),
        'estimatedArrival': user_data.get('estimatedArrival', 'Not available')
    }
    
    app.logger.debug(f'Bus details: {bus_details}')
    
    # Get route details from Firebase using the correct routeId
    route_ref = db.reference(f'routes/{route_id}')
    route_details = route_ref.get()
    
    # Get stops for the route
    stops_ref = db.reference(f'stops/{route_id}')
    stops = stops_ref.get() or []
    
    return render_template('driver-dashboard.html', 
                         driver_name=driver_data.get('name'),
                         bus_details=bus_details,
                         route_details=route_details,
                         stops=stops,
                         driver_id=driver_id)

@app.route('/start_trip', methods=['POST'])
def start_trip():
    if not session.get('logged_in'):
        return jsonify({'status': 'error', 'message': 'Not logged in'})
    
    session['trip_started'] = True
    return jsonify({'status': 'started'})

@app.route('/end_trip', methods=['POST'])
def end_trip():
    if not session.get('logged_in'):
        return jsonify({'status': 'error', 'message': 'Not logged in'})
    
    driver_id = session.get('driver_id')
    if driver_id:
        # Remove driver's location data when trip ends
        db.reference(f'users/{driver_id}').delete()
    
    session['trip_started'] = False
    return jsonify({'status': 'ended'})

@app.route('/logout')
def logout():
    driver_id = session.get('driver_id')
    if driver_id:
        # Remove driver's location data on logout
        db.reference(f'users/{driver_id}').delete()
    
    session.clear()
    return redirect(url_for('drivers_login'))

# API endpoints
@app.route('/api/routes')
def get_routes():
    routes_ref = db.reference('routes')
    routes_data = routes_ref.get() or {}
    return jsonify(routes_data)

@app.route('/api/buses/<route_id>')
def get_buses(route_id):
    users_ref = db.reference('users')
    users_data = users_ref.get() or {}
    
    active_buses = []
    for user_id, user in users_data.items():
        if user.get('role') == 'driver' and user.get('routeId') == route_id:
            active_buses.append({
                'id': user.get('busId'),
                'route': route_id.upper(),
                'status': 'Active',
                'location': {'lat': user.get('lat'), 'lng': user.get('lng')},
                'speed': user.get('speed', '0'),
                'nextStop': user.get('nextStop', 'Unknown'),
                'estimatedArrival': user.get('estimatedArrival', 'Unknown')
            })
    
    return jsonify(active_buses)

@app.route('/api/stops/<route_id>')
def get_stops(route_id):
    stops_ref = db.reference(f'stops/{route_id}')
    stops = stops_ref.get() or []
    return jsonify(stops)

@app.route('/api/schedule/<route_id>')
def get_schedule(route_id):
    schedule_ref = db.reference(f'schedules/{route_id}')
    schedule = schedule_ref.get() or []
    return jsonify(schedule)

# @app.route('/admin.html')
# def admin_portal():
#     return render_template('admin.html')

@app.route('/admin-login.html')
def admin_login():
    # Clear any existing session data when accessing login page
    session.clear()
    return render_template('admin-login.html')

@app.route('/admin.html')
def admin():
    # Check if admin is logged in
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    return render_template('admin.html', is_admin_page=True)

@app.route('/admin-login', methods=['POST'])
def admin_login_process():
    try:
        logger.info("Received admin login request")
        id_token = request.json.get('idToken')
        if not id_token:
            logger.error("No authentication token provided")
            return jsonify({
                'status': 'error',
                'message': 'No authentication token provided'
            }), 401

        # Verify the ID token
        try:
            logger.info("Attempting to verify ID token")
            decoded_token = auth.verify_id_token(id_token)
            email = decoded_token.get('email')
            logger.info(f"Token verified successfully for email: {email}")
            
            if email not in ADMIN_EMAILS:
                logger.warning(f"Unauthorized access attempt from email: {email}")
                return jsonify({
                    'status': 'error',
                    'message': 'Unauthorized access'
                }), 403

            # Test Firebase connection
            try:
                logger.info("Testing Firebase connection")
                drivers_ref = db.reference('drivers')
                drivers_data = drivers_ref.get()
                logger.info("Firebase connection successful during admin login")
                
                # Set admin session
                session['admin_logged_in'] = True
                session['admin_email'] = email
                session['admin_uid'] = decoded_token.get('uid')
                logger.info(f"Admin session set for email: {email}")
                
                return jsonify({
                    'status': 'success',
                    'message': 'Login successful'
                })
            except Exception as e:
                logger.error(f"Firebase connection error during admin login: {str(e)}")
                return jsonify({
                    'status': 'error',
                    'message': 'Database connection error. Please try again.'
                }), 500

        except auth.InvalidIdTokenError:
            logger.error("Invalid ID token provided")
            return jsonify({
                'status': 'error',
                'message': 'Invalid authentication token'
            }), 401
        except auth.ExpiredIdTokenError:
            logger.error("Expired ID token provided")
            return jsonify({
                'status': 'error',
                'message': 'Authentication token expired'
            }), 401
        except auth.RevokedIdTokenError:
            logger.error("Revoked ID token provided")
            return jsonify({
                'status': 'error',
                'message': 'Authentication token has been revoked'
            }), 401
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'Authentication failed'
            }), 401

    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred during login'
        }), 500

@app.route('/check_admin_session', methods=['GET'])
def check_admin_session():
    try:
        if not session.get('admin_logged_in'):
            return jsonify({
                'status': 'error',
                'message': 'Not logged in as admin'
            }), 401

        # Verify admin email is still valid
        if session.get('admin_email') not in ADMIN_EMAILS:
            session.clear()
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        # Test Firebase connection
        try:
            drivers_ref = db.reference('drivers')
            drivers_data = drivers_ref.get()
            return jsonify({
                'status': 'success',
                'message': 'Admin session and database connection are valid',
                'admin_email': session.get('admin_email')
            })
        except Exception as e:
            logger.error(f"Firebase connection error in check_admin_session: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'Database connection error'
            }), 500

    except Exception as e:
        logger.error(f"Error checking admin session: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Session check failed'
        }), 500

@app.route('/admin-logout')
def admin_logout():
    session.clear()
    return redirect(url_for('admin_login'))

@app.route('/add_driver', methods=['POST'])
def add_driver():
    try:
        data = request.json
        name = data.get('name')
        cnic = data.get('cnic')
        
        if not name or not cnic:
            return jsonify({
                "status": "error",
                "message": "Name and CNIC are required"
            }), 400

        # Clean CNIC input - remove hyphens, spaces and ensure it's a string
        cnic = str(cnic).replace('-', '').replace(' ', '').strip()

        # Validate CNIC format (13 digits)
        if not re.match(r'^\d{13}$', cnic):
            return jsonify({
                "status": "error",
                "message": "Please enter a valid 13-digit CNIC number"
            }), 400
        
        # Format CNIC with hyphens for storage
        formatted_cnic = f"{cnic[:5]}-{cnic[5:12]}-{cnic[12]}"
        
        # Check for duplicate CNIC
        drivers_ref = db.reference('drivers')
        existing_drivers = drivers_ref.get()

        if existing_drivers:
            for driver_id, driver in existing_drivers.items():
                existing_cnic = str(driver.get('cnic', '')).replace('-', '').replace(' ', '').strip()
                if existing_cnic == cnic:
                    return jsonify({
                        "status": "error",
                        "message": "Driver with this CNIC already exists"
                    }), 400

        # Create a username from the name (e.g., "ahmed.khan")
        username = name.lower().replace(' ', '.')

        driver_data = {
            "name": name,
            "age": data.get('age'),
            "cnic": formatted_cnic,  # Store formatted CNIC
            "username": username,
            "password": "password123",  # Default password that should be changed on first login
            "bus_id": data.get('bus_id', ''),
            "routeId": data.get('route', '').lower(),
            "route": data.get('route', ''),
            "experience": data.get('experience', ''),
            "phone": data.get('phone', ''),
            "status": "active",
            "role": "driver",
            "created_at": datetime.now().isoformat()
        }

        # Add to Firebase
        new_driver_ref = drivers_ref.push(driver_data)

        return jsonify({
            "status": "success",
            "message": f"Driver {name} added successfully",
            "username": username,
            "password": "password123"
        })

    except Exception as e:
        logger.error(f"Error adding driver: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An error occurred while adding the driver: {str(e)}"
        }), 500

@app.route('/reset_driver_password', methods=['POST'])
def reset_driver_password():
    if not session.get('admin_logged_in'):
        return jsonify({
            'status': 'error',
            'message': 'Admin authentication required'
        }), 401

    try:
        data = request.json
        driver_id = data.get('driver_id')
        
        if not driver_id:
            return jsonify({
                'status': 'error',
                'message': 'Driver ID is required'
            }), 400

        # Get driver reference
        driver_ref = db.reference(f'drivers/{driver_id}')
        driver_data = driver_ref.get()

        if not driver_data:
            return jsonify({
                'status': 'error',
                'message': 'Driver not found'
            }), 404

        # Reset password to default
        new_password = "password123"
        driver_ref.update({
            'password': new_password
        })

        return jsonify({
            'status': 'success',
            'message': 'Password reset successfully',
            'new_password': new_password
        })

    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'An error occurred while resetting the password: {str(e)}'
        }), 500

@app.route('/get_driver_password', methods=['GET'])
def get_driver_password():
    if not session.get('admin_logged_in'):
        return jsonify({
            'status': 'error',
            'message': 'Admin authentication required'
        }), 401

    try:
        driver_id = request.args.get('driver_id')
        
        if not driver_id:
            return jsonify({
                'status': 'error',
                'message': 'Driver ID is required'
            }), 400

        # Get driver reference
        driver_ref = db.reference(f'drivers/{driver_id}')
        driver_data = driver_ref.get()

        if not driver_data:
            return jsonify({
                'status': 'error',
                'message': 'Driver not found'
            }), 404

        return jsonify({
            'status': 'success',
            'password': driver_data.get('password')
        })

    except Exception as e:
        logger.error(f"Error getting driver password: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'An error occurred while getting the password: {str(e)}'
        }), 500

@app.route('/post_announcement', methods=['POST'])
def post_announcement():
    # Check admin authentication
    if not session.get('admin_logged_in'):
        return jsonify({
            'status': 'error',
            'message': 'Admin authentication required'
        }), 401

    try:
        message = request.json.get('message')
        
        if not message:
            return jsonify({
                'status': 'error',
                'message': 'Announcement message is required'
            }), 400

        # Add announcement to Firebase
        db.reference('announcements').push({
            "message": message,
            "timestamp": datetime.now().isoformat()
        })

        return jsonify({
            "status": "success",
            "message": "Announcement posted successfully"
        })

    except Exception as e:
        logger.error(f"Error posting announcement: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'An error occurred while posting the announcement: {str(e)}'
        }), 500

# driver announcement
@app.route('/post_announcement_driver', methods=['POST'])
def post_announcement_driver():
    if not session.get('admin_logged_in'):
        return jsonify({'status': 'error', 'message': 'Admin authentication required'}), 401

    try:
        message = request.json.get('message')
        if not message:
            return jsonify({'status': 'error', 'message': 'Announcement message is required'}), 400

        # Push to driver_announcements instead of general announcements
        db.reference('driver_announcements').push({
            "message": message,
            "timestamp": datetime.now().isoformat()
        })

        return jsonify({'status': 'success', 'message': 'Driver announcement posted successfully'})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# delete announcement
@app.route('/delete_announcement', methods=['POST'])
def delete_announcement():
    data = request.get_json()
    announcement_id = data.get('announcement_id')
    ann_type = data.get('type')

    try:
        path = 'driver_announcements' if ann_type == 'Driver' else 'announcements'
        db.reference(f'{path}/{announcement_id}').delete()

        return jsonify({'status': 'success'})
    except Exception as e:
        print("Delete Error:", e)
        return jsonify({'status': 'error', 'message': str(e)})




@app.route('/get_drivers', methods=['GET'])
def get_drivers():
    try:
        # Get reference to the drivers node
        drivers_ref = db.reference('drivers')
        
        # Fetch all drivers
        drivers_data = drivers_ref.get()
        
        # Log the data for debugging
        app.logger.debug(f'Fetched drivers data: {drivers_data}')
        
        if not drivers_data:
            app.logger.warning('No drivers found in the database')
            return jsonify([])
        
        # Transform the data into a list format
        driver_list = []
        for driver_id, driver_data in drivers_data.items():
            driver = {
                'id': driver_id,
                'name': driver_data.get('name', ''),
                'age': driver_data.get('age', ''),
                'cnic': driver_data.get('cnic', ''),
                'username': driver_data.get('username', ''),
                'bus_id': driver_data.get('bus_id', ''),
                'route': driver_data.get('route', ''),
                'experience': driver_data.get('experience', ''),
                'phone': driver_data.get('phone', ''),
                'status': driver_data.get('status', 'inactive')
            }
            driver_list.append(driver)
        
        app.logger.debug(f'Processed driver list: {driver_list}')
        return jsonify(driver_list)
        
    except Exception as e:
        app.logger.error(f'Error fetching drivers: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/location')
def get_location():
    if not session.get('logged_in'):
        return jsonify({'error': 'Not logged in'}), 401
    
    driver_id = session.get('driver_id')
    if not driver_id:
        return jsonify({'error': 'No driver ID found'}), 404
    
    # Get location from Firebase users node
    user_ref = db.reference(f'users/{driver_id}')
    user_data = user_ref.get()
    
    if user_data and 'lat' in user_data and 'lng' in user_data:
        return jsonify({
            'lat': user_data['lat'],
            'lng': user_data['lng'],
            'speed': user_data.get('speed', 0),
            'timestamp': user_data.get('timestamp')
        })
    
    return jsonify({'error': 'Location not found'}), 404

@app.route('/change_password', methods=['POST'])
def change_password():
    try:
        driver_id = request.form.get('driver_id')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if not all([driver_id, new_password, confirm_password]):
            return jsonify({
                'status': 'error',
                'message': 'All fields are required'
            }), 400
            
        if new_password != confirm_password:
            return jsonify({
                'status': 'error',
                'message': 'Passwords do not match'
            }), 400
            
        # Update password in Firebase
        driver_ref = db.reference(f'drivers/{driver_id}')
        driver_data = driver_ref.get()
        
        if not driver_data:
            return jsonify({
                'status': 'error',
                'message': 'Driver not found'
            }), 404
            
        # Update the password
        driver_ref.update({
            'password': new_password
        })
        
        return jsonify({
            'status': 'success',
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        logging.error(f"Password change error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred while changing the password'
        }), 500

@app.route('/remove_driver', methods=['POST'])
def remove_driver():
    # Check admin authentication
    if not session.get('admin_logged_in'):
        logger.warning("Unauthorized attempt to remove driver - admin not logged in")
        return jsonify({
            'status': 'error',
            'message': 'Admin authentication required'
        }), 401

    try:
        data = request.json
        driver_id = data.get('driver_id')
        
        if not driver_id:
            return jsonify({
                'status': 'error',
                'message': 'Driver ID is required'
            }), 400

        # Get driver reference
        drivers_ref = db.reference('drivers')
        driver_ref = drivers_ref.child(driver_id)
        
        # Check if driver exists
        driver_data = driver_ref.get()
        if not driver_data:
            return jsonify({
                'status': 'error',
                'message': 'Driver not found'
            }), 404

        # Get the bus_id before removing the driver
        bus_id = driver_data.get('bus_id')

        # Remove driver from Firebase
        try:
            driver_ref.delete()
            logger.info(f"Successfully removed driver with ID: {driver_id}")
        except Exception as e:
            logger.error(f"Error deleting driver from Firebase: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to remove driver from database'
            }), 500

        # Also remove any associated user data
        try:
            users_ref = db.reference('users')
            user_ref = users_ref.child(driver_id)
            user_ref.delete()
            logger.info(f"Successfully removed user data for driver ID: {driver_id}")
        except Exception as e:
            logger.error(f"Error deleting user data from Firebase: {str(e)}")
            # Don't return error here as the main driver deletion was successful

        # Update bus status if the driver was assigned to a bus
        if bus_id:
            try:
                buses_ref = db.reference('buses')
                bus_ref = buses_ref.child(bus_id)
                bus_ref.update({'status': 'inactive'})
                logger.info(f"Updated bus {bus_id} status to inactive")
            except Exception as e:
                logger.error(f"Error updating bus status: {str(e)}")
                # Don't return error here as the main driver deletion was successful

        return jsonify({
            'status': 'success',
            'message': 'Driver removed successfully'
        })

    except Exception as e:
        logger.error(f"Error in remove_driver route: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'An error occurred while removing the driver: {str(e)}'
        }), 500

@app.route('/test_remove_driver/<driver_id>', methods=['GET'])
def test_remove_driver(driver_id):
    if not session.get('admin_logged_in'):
        return jsonify({
            'status': 'error',
            'message': 'Admin authentication required'
        }), 401

    try:
        # Get driver reference
        drivers_ref = db.reference('drivers')
        driver_ref = drivers_ref.child(driver_id)
        
        # Check if driver exists
        driver_data = driver_ref.get()
        if not driver_data:
            return jsonify({
                'status': 'error',
                'message': 'Driver not found'
            }), 404

        # Log the driver data before deletion
        logger.info(f"Attempting to remove driver: {driver_data}")

        # Remove driver from Firebase
        try:
            driver_ref.delete()
            logger.info(f"Successfully removed driver with ID: {driver_id}")
        except Exception as e:
            logger.error(f"Error deleting driver from Firebase: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f'Failed to remove driver from database: {str(e)}'
            }), 500

        return jsonify({
            'status': 'success',
            'message': 'Driver removed successfully',
            'driver_data': driver_data
        })

    except Exception as e:
        logger.error(f"Error in test_remove_driver route: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'An error occurred while removing the driver: {str(e)}'
        }), 500

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('index.html'), 500

@app.route('/debug_drivers')
def debug_drivers():
    try:
        drivers_ref = db.reference('drivers')
        drivers_data = drivers_ref.get()
        app.logger.debug(f'DEBUG /debug_drivers: {drivers_data}')
        return jsonify(drivers_data)
    except Exception as e:
        app.logger.error(f'DEBUG /debug_drivers error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/debug_firebase', methods=['GET'])
def debug_firebase():
    if not session.get('admin_logged_in'):
        return jsonify({
            'status': 'error',
            'message': 'Admin authentication required'
        }), 401

    try:
        # Test Firebase connection
        drivers_ref = db.reference('drivers')
        drivers_data = drivers_ref.get()
        
        return jsonify({
            'status': 'success',
            'message': 'Firebase connection is working',
            'drivers_count': len(drivers_data) if drivers_data else 0,
            'sample_data': drivers_data
        })
    except Exception as e:
        logger.error(f"Firebase debug error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Firebase connection error: {str(e)}'
        }), 500

@app.route('/debug_firebase_auth', methods=['GET'])
def debug_firebase_auth():
    try:
        # Get the current Firebase app configuration
        app = firebase_admin.get_app()
        options = app.options
        
        return jsonify({
            'status': 'success',
            'config': {
                'project_id': options.get('projectId'),
                'database_url': options.get('databaseURL'),
                'storage_bucket': options.get('storageBucket'),
                'auth_domain': options.get('authDomain')
            }
        })
    except Exception as e:
        logger.error(f"Firebase debug error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Firebase configuration error: {str(e)}'
        }), 500

@app.route('/get_admin_token', methods=['GET'])
def get_admin_token():
    if not session.get('admin_logged_in'):
        return jsonify({
            'status': 'error',
            'message': 'Admin authentication required'
        }), 401

    try:
        # Create a custom token for admin access
        custom_token = auth.create_custom_token('admin')
        return jsonify({
            'status': 'success',
            'token': custom_token.decode('utf-8')
        })
    except Exception as e:
        logger.error(f"Error creating admin token: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error creating admin token: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
