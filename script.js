// jshint esversion:10
// 'use strict';

// require('dotenv').config();
// console.log(process.env.pass);

// Global variables in any script can be used in another script if the latter is mentioned below the former in the html head

// NAVIGATOR.GEOLOCATION.GETCURRENTPOSITION
// LOCATION

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Date.now().toString().slice(-10);
    constructor(coords, distance, duration, description, type) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        this.description = description;
        this.type = type;
    }
}

class Running extends Workout {
    constructor(coords, distance, duration, cadence, description, type) {
        super(coords, distance, duration, description, type);
        this.cadence = cadence;
        this.calcPace();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
    }
}

class Cycling extends Workout {
    constructor(coords, distance, duration, elevationGain, description, type) {
        super(coords, distance, duration, description, type);
        this.elevationGain = elevationGain;
        this.calcSpeed();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}

class App {
    #map;
    #mapEvent;
    #self;
    #workouts = [];
    constructor() {
        self = this;
        this._getPosition();
        this._getLocalStorage();
        this._newWorkOut();
        containerWorkouts.addEventListener("click", this._movetoPopup);
    }
    _getPosition() {
        if (navigator.geolocation) {
            // let self = this;
            navigator.geolocation.getCurrentPosition(position => {
                let {
                    latitude: lat,
                    longitude: lon
                } = position.coords;
                this._loadMap(lat, lon);
                // self._loadMap(lat, lon);
            }, function() {
                alert("Couldn't get your location");
            });
        }
    }

    _loadMap(lat, lon) {
        self.#map = L.map('map').setView([lat, lon], 13); // map in the brackets is the id of div in our html
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(self.#map);
        this._showForm();

        self.#workouts.forEach(work => self._renderWorkoutMarker(work));
    }

    _showForm() {
        // Listener on the map object, whcih comes from leaflet
        self.#map.on("click", function(mapE) {
            self.#mapEvent = mapE;
            form.classList.remove("hidden");
            // Focus on distance field
            inputDistance.focus();

            inputType.addEventListener("change", event => {
                self._toggleElevationField(event);
            });
        });
    }

    _toggleElevationField() {
        // Changing Parent's classes, which clickd on child elements
        inputCadence.parentElement.classList.toggle("form__row--hidden");
        inputElevation.parentElement.classList.toggle("form__row--hidden");
    }

    _newWorkOut() {
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            // Prevent submitting of form

            // Get data from form
            let type = inputType.value;
            let description = `${type[0].toUpperCase()+type.slice(1)} on ${new Date().toLocaleString('en-us',{month:'long'})} ${new Date().getDate()}`;
            let workout;
            let distance = Number(inputDistance.value);
            let duration = Number(inputDuration.value);
            let {
                lat: latitude,
                lng: longitude
            } = self.#mapEvent.latlng;

            if (typeof distance != "number" || distance < 0 || typeof distance != "number" || distance < 0) return alert("Enter a valid number");

            // If type is running
            if (type === "running") {
                let cadence = Number(inputCadence.value);
                if (typeof cadence != "number" || cadence < 0) return alert("Enter a valid number");
                workout = new Running([latitude, longitude], distance, duration, cadence, description, type);
                self.#workouts.push(workout);
            }
            // If type is cycling
            if (type === "cycling") {
                let elevation = Number(inputElevation.value);
                if (typeof elevation != "number" || elevation < 0) return alert("Enter a valid number");
                workout = new Cycling([latitude, longitude], distance, duration, elevation, description, type);
                self.#workouts.push(workout);
            }
            // Placing the marker
            self._renderWorkoutMarker(workout);
            // L.marker([latitude, longitude], {
            //         opacity: 0.8
            //     }).addTo(self.#map)
            //     .bindPopup(L.popup({
            //         autoClose: false,
            //         closeOnClick: false,
            //         className: `${type}-popup`
            //     }))
            //     .setPopupContent(description)
            //     .openPopup();
            // Render sidebar list
            self._renderWorkout(workout);

            // Clearing fields
            inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";

            // Removes focus from all fields
            inputDistance.blur();
            inputDuration.blur();
            inputCadence.blur();

            // Local Storage call
            self._localStorage(workout);
        });
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords, {
                opacity: 0.8
            }).addTo(self.#map)
            .bindPopup(L.popup({
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(workout.description)
            .openPopup();
    }

    _renderWorkout(workout) {
        let html = `  <li class="workout workout--${workout.type}\" data-id="${workout.id}">
                      <h2 class="workout__title">${workout.description}</h2>
                      <div class="workout__details">
                        <span class="workout__icon">${workout.type === "running" ? "🏃": "🚴‍♀️"}</span>
                        <span class="workout__value">${workout.distance}</span>
                        <span class="workout__unit">km</span>
                      </div>
                      <div class="workout__details">
                        <span class="workout__icon">⏱</span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                      </div>`;

        if(workout.type==="running") {
            html+=`<div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(2)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>`;
        } else if(workout.type==="cycling") {
            html+=`<div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(2)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
            </div>`;
        }
        form.insertAdjacentHTML('afterend', html);

        form.classList.add("hidden");
    }

    _movetoPopup(event) {
        let elem = event.target.closest(".workout");
        if(!elem) return;

        const workout = self.#workouts.find(item => item.id == elem.dataset.id);

        self.#map.setView(workout.coords, 13, {animate: true, pan: {duration: 1}});
    }

    _localStorage(workout) {
        localStorage.setItem("workouts", JSON.stringify(self.#workouts));
    }

    _getLocalStorage(workout) {
        // console.log("Reached");
        let item = JSON.parse(localStorage.getItem("workouts"));
        if(!item) return;
        self.#workouts = item;
        self.#workouts.forEach(work => self._renderWorkout(work));
    }

    reset() {
        localStorage.clear();
        location.reload();
    }
}

const app = new App();



// class Workout {
//     constructor() {
//         let lat = "lat";
//         let lon = "lon";
//     }
// }
//
// class Running {
//     constructor() {
//         super();
//     }
// }
//
// class Cycling {
//     constructor() {
//
//     }
// }





// GOOGLE MAPS API
// Create the script tag, set the appropriate attributes
// var script = document.createElement('script');
// script.src = 'https://maps.googleapis.com/maps/api/js?key=&callback=initMap';
// script.async = true;
//
// // Attach your callback function to the `window` object
// window.initMap = function() {
//   // JS API is loaded and available
//   map = new google.maps.Map(document.getElementById("map"), {
//     center: { lat: -34.397, lng: 150.644 },
//     zoom: 8,
//   });
// };
//
// // Append the 'script' element to 'head'
// document.head.appendChild(script);
