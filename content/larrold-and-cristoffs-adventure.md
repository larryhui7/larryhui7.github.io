---
title: "Larrold and Cristoff's Adventure"
description: "A cross-country road trip across the US and Canada — interactive map with our stops, plans, and a car that follows the route."
hideMeta: true
---

<!-- Leaflet (open-source map library) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<style>
  .rt-intro {
    color: var(--secondary);
    margin-bottom: 1.2rem;
  }
  #rt-map {
    width: 100%;
    height: 560px;
    border-radius: 12px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 14px rgba(0,0,0,0.12);
    z-index: 0;
  }
  .rt-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin: 1rem 0;
  }
  .rt-btn {
    background: maroon;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
    transition: opacity 0.15s ease;
  }
  .rt-btn:hover { opacity: 0.85; }
  .rt-btn.secondary {
    background: var(--tertiary);
    color: var(--primary);
  }
  .rt-speed {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--secondary);
    font-size: 0.9rem;
    margin-left: auto;
  }
  /* Stop markers */
  .rt-stop-icon {
    background: maroon;
    color: #fff;
    border: 2px solid #fff;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    box-shadow: 0 1px 5px rgba(0,0,0,0.4);
  }
  /* Car marker — a fixed square whose exact center is the anchored geo point,
     so the car stays locked to the path at every zoom level. */
  .rt-car-icon {
    width: 58px;
    height: 58px;
  }
  .rt-car-icon img,
  .rt-car-icon .rt-car-fallback {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.45));
  }
  .rt-car-fallback {
    font-size: 48px;
    line-height: 58px;
    text-align: center;
  }
  .rt-flip { transform: scaleX(-1); }
  /* Popups */
  .leaflet-popup-content { margin: 12px 14px; }
  .rt-pop { max-height: 300px; overflow-y: auto; min-width: 220px; }
  .rt-pop h3 {
    margin: 0 0 0.3rem 0;
    color: maroon;
    font-size: 1.05rem;
    border-bottom: 2px solid maroon;
    padding-bottom: 0.2rem;
  }
  .rt-pop .rt-day {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--secondary);
    font-weight: 700;
  }
  .rt-pop p { margin: 0.4rem 0 0 0; font-size: 0.9rem; line-height: 1.4; }
  /* Itinerary list below map */
  .rt-itinerary { margin-top: 2rem; }
  .rt-itinerary h2 {
    font-size: 1.3rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid maroon;
    padding-bottom: 0.3rem;
  }
  .rt-stop-card {
    border-left: 3px solid maroon;
    padding: 0.3rem 0 0.3rem 1rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .rt-stop-card:hover { background: var(--tertiary); }
  .rt-stop-card h3 { margin: 0; font-size: 1.05rem; }
  .rt-stop-card .rt-day { font-size: 0.75rem; color: var(--secondary); font-weight: 700; text-transform: uppercase; }
  .rt-stop-card p { margin: 0.3rem 0 0 0; color: var(--secondary); font-size: 0.9rem; }
</style>

<p class="rt-intro">
  Follow along as <strong>Larrold</strong> and <strong>Cristoff</strong> take on the open road across the US and Canada.
  Click any city to see the stop, or hit <em>Start the trip</em> to watch the car drive the whole route.
</p>

<div id="rt-map"></div>

<div class="rt-controls">
  <button class="rt-btn" id="rt-play">▶ Start the trip</button>
  <button class="rt-btn secondary" id="rt-reset">⟲ Reset</button>
  <span class="rt-speed">
    Speed:
    <input type="range" id="rt-speed" min="1" max="10" value="5" />
  </span>
</div>

<div class="rt-itinerary" id="rt-itinerary">
  <h2>The Itinerary</h2>
</div>

<script>
(function () {
  // =========================================================================
  // EDIT YOUR TRIP HERE: add / remove / reorder stops. Order = driving order.
  //   name  : city label
  //   coords: [latitude, longitude]
  //   day   : short label (e.g. "The Start")
  // =========================================================================
  var STOPS = [
    { name: "Berkeley, CA",                   coords: [37.8715, -122.2730], day: "The Start" },
    { name: "Sacramento, CA",                 coords: [38.5816, -121.4944], day: "The Kickoff" },
    { name: "Reno, NV",                       coords: [39.5296, -119.8138], day: "Biggest Little City" },
    { name: "Great Basin National Park, NV",  coords: [39.0057, -114.2192], day: "We Love Rocks" },
    { name: "Salt Lake City, UT",             coords: [40.7608, -111.8910], day: "Salt Flats & Dirty Soda" },
    { name: "Cheyenne, WY",                   coords: [41.1400, -104.8202], day: "Wyoming lmfao" },
    { name: "Denver, CO",                     coords: [39.7392, -104.9903], day: "Mile High" },
    { name: "Wichita, KS",                    coords: [37.6872,  -97.3301], day: "Air Capital of the World" },
    { name: "Oklahoma City, OK",              coords: [35.4676,  -97.5164], day: "Bricktown" },
    { name: "Dallas, TX",                     coords: [32.7767,  -96.7970], day: "Historic West End" },
    { name: "Waco, TX",                       coords: [31.5493,  -97.1467], day: "Dr Pepper" },
    { name: "Austin, TX",                     coords: [30.2672,  -97.7431], day: "$200 of BBQ" },
    { name: "Houston, TX",                    coords: [29.7604,  -95.3698], day: "Space City" },
    { name: "New Orleans, LA",                coords: [29.9511,  -90.0715], day: "Beignets & Jazz" },
    { name: "Birmingham, AL",                 coords: [33.5186,  -86.8104], day: "Civil Rights District" },
    { name: "Nashville, TN",                  coords: [36.1627,  -86.7816], day: "Hot Chicken & Honky-Tonks" },
    { name: "Louisville, KY",                 coords: [38.2527,  -85.7585], day: "Bourbon" },
    { name: "Columbus, OH",                   coords: [39.9612,  -82.9988], day: "Scioto Mile" },
    { name: "Pittsburgh, PA",                 coords: [40.4406,  -79.9959], day: "Three Rivers" },
    { name: "Rochester, NY",                  coords: [43.1566,  -77.6088], day: "High Falls" },
    { name: "Toronto, ON",                    coords: [43.6532,  -79.3832], day: "The Finish" }
  ];

  // Number of evenly-spaced points the car steps through along the whole
  // route (controls animation smoothness & duration regardless of route length).
  var PATH_POINTS = 700;

  // Routing service used to snap the route onto real highways/roads.
  var OSRM_BASE = "https://router.project-osrm.org/route/v1/driving/";

  document.addEventListener("DOMContentLoaded", function () {
    var map = L.map("rt-map", { scrollWheelZoom: false }).setView([45, -95], 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    var latlngs = STOPS.map(function (s) { return s.coords; });

    // The route line — starts as straight lines, upgraded to real roads below.
    var routeLine = L.polyline(latlngs, {
      color: "maroon", weight: 4, opacity: 0.8, lineCap: "round", lineJoin: "round",
      smoothFactor: 0 // don't simplify, so the line hugs roads (no cutting across lakes) at low zoom
    }).addTo(map);

    // City markers + popups
    var markers = [];
    STOPS.forEach(function (stop, i) {
      var icon = L.divIcon({
        className: "",
        html: '<div class="rt-stop-icon">' + (i + 1) + "</div>",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      var popupHtml =
        '<div class="rt-pop">' +
          '<div class="rt-day">' + stop.day + "</div>" +
          "<h3>" + stop.name + "</h3>" +
        "</div>";
      var m = L.marker(stop.coords, { icon: icon })
        .addTo(map)
        .bindPopup(popupHtml);
      markers.push(m);
    });

    // Fit map to the whole route
    map.fitBounds(L.latLngBounds(latlngs).pad(0.15));

    // ---- Car marker ------------------------------------------------------
    var carIcon = L.divIcon({
      className: "",
      html:
        '<div class="rt-car-icon">' +
          '<img src="/car.png" alt="Larrold and Cristoff" ' +
               'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';">' +
          '<span class="rt-car-fallback" style="display:none;">🚗</span>' +
        "</div>",
      iconSize: [58, 58],
      iconAnchor: [29, 29]
    });
    var car = L.marker(latlngs[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);

    function interp(a, b, t) {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }

    // Approx planar distance between two [lat,lng] points (fine for resampling).
    function segDist(a, b) {
      var dLat = a[0] - b[0];
      var dLng = (a[1] - b[1]) * Math.cos((a[0] + b[0]) * Math.PI / 360);
      return Math.sqrt(dLat * dLat + dLng * dLng);
    }

    // Resample any coordinate list into `n` points spaced evenly by distance,
    // so the car moves at a steady pace and the animation length is bounded.
    function resample(coords, n) {
      if (coords.length < 2) return coords.slice();
      var cum = [0];
      for (var i = 1; i < coords.length; i++) {
        cum.push(cum[i - 1] + segDist(coords[i - 1], coords[i]));
      }
      var total = cum[cum.length - 1];
      if (total === 0) return coords.slice();
      var out = [], j = 0;
      for (var k = 0; k <= n; k++) {
        var target = total * k / n;
        while (j < cum.length - 2 && cum[j + 1] < target) j++;
        var segLen = cum[j + 1] - cum[j];
        var t = segLen > 0 ? (target - cum[j]) / segLen : 0;
        out.push(interp(coords[j], coords[j + 1], t));
      }
      return out;
    }

    // Single source of truth: the red line and the car's path are built from the
    // SAME coordinates, so the car always follows exactly along the red route.
    var path = [];
    function setRoute(coords) {
      routeLine.setLatLngs(coords);          // draw the red path
      path = resample(coords, PATH_POINTS);  // car steps along the same geometry
      if (!playing) { idx = 0; car.setLatLng(path[0]); }
    }
    setRoute(latlngs); // straight-line route to start

    // Ask the routing service to snap the route onto real highways/roads.
    var coordStr = STOPS.map(function (s) { return s.coords[1] + "," + s.coords[0]; }).join(";");
    fetch(OSRM_BASE + coordStr + "?overview=full&geometries=geojson")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) {
        if (!data.routes || !data.routes[0]) return;
        var roads = data.routes[0].geometry.coordinates.map(function (c) {
          return [c[1], c[0]]; // GeoJSON is [lng,lat] → Leaflet [lat,lng]
        });
        setRoute(roads);
        map.fitBounds(routeLine.getBounds().pad(0.08));
      })
      .catch(function () { /* routing unavailable → keep straight-line fallback */ });

    var idx = 0, timer = null, playing = false;
    var speedEl = document.getElementById("rt-speed");
    var playBtn = document.getElementById("rt-play");

    // Face the car along its overall heading. Uses a look-ahead window and a
    // deadzone so it doesn't flip back and forth on north/south stretches where
    // the longitude only wiggles slightly.
    var facingWest = false;
    function updateFacing() {
      var el = car.getElement();
      var img = el && el.querySelector(".rt-car-icon img, .rt-car-fallback");
      if (!img) return;
      var ahead = path[Math.min(idx + 6, path.length - 1)];
      var behind = path[Math.max(idx - 6, 0)];
      var dLng = ahead[1] - behind[1];
      if (dLng < -0.05) facingWest = true;       // clearly heading west
      else if (dLng > 0.05) facingWest = false;  // clearly heading east
      // otherwise keep current facing (hysteresis)
      if (facingWest) img.classList.add("rt-flip");
      else img.classList.remove("rt-flip");
    }

    function step() {
      if (idx >= path.length - 1) { stop(); return; }
      idx++;
      car.setLatLng(path[idx]);
      updateFacing();
      var delay = 60 - parseInt(speedEl.value, 10) * 5; // 55ms (slow) → 10ms (fast)
      timer = setTimeout(step, delay);
    }

    function play() {
      if (playing) return;
      if (idx >= path.length - 1) idx = 0; // restart if finished
      playing = true;
      playBtn.textContent = "❚❚ Pause";
      step();
    }
    function stop() {
      playing = false;
      clearTimeout(timer);
      playBtn.textContent = idx >= path.length - 1 ? "▶ Replay" : "▶ Resume";
    }
    function reset() {
      stop();
      idx = 0;
      car.setLatLng(path[0]);
      playBtn.textContent = "▶ Start the trip";
    }

    playBtn.addEventListener("click", function () { playing ? stop() : play(); });
    document.getElementById("rt-reset").addEventListener("click", reset);

    // ---- Itinerary cards below the map ----------------------------------
    var wrap = document.getElementById("rt-itinerary");
    STOPS.forEach(function (stop, i) {
      var card = document.createElement("div");
      card.className = "rt-stop-card";
      card.innerHTML =
        '<div class="rt-day">' + stop.day + " · Stop " + (i + 1) + "</div>" +
        "<h3>" + stop.name + "</h3>";
      card.addEventListener("click", function () {
        map.flyTo(stop.coords, 6, { duration: 0.8 });
        markers[i].openPopup();
      });
      wrap.appendChild(card);
    });
  });
})();
</script>
