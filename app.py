
import os
import requests

from flask import Flask, jsonify, request, send_from_directory
from dotenv import load_dotenv
from pathlib import Path


# Project directory

BASE_DIR = Path(__file__).resolve().parent


# Load API keys

load_dotenv(BASE_DIR / ".env")


# Flask application

app = Flask(__name__, static_folder=None)

API_KEY = os.getenv("RESROBOT_API_KEY")
BASE_URL = "https://api.resrobot.se/v2.1"


# ==========================================
# FRONTEND FILES
# ==========================================

@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/style.css")
def css():
    return send_from_directory(BASE_DIR, "style.css")


@app.route("/script.js")
def javascript():
    return send_from_directory(BASE_DIR, "script.js")


@app.route("/aik.png")
def image():
    return send_from_directory(BASE_DIR, "aik.png")


# ==========================================
# STATION SEARCH API
# ==========================================

@app.route("/api/stations")
def search_stations():

    query = request.args.get("q", "").strip()

    if not API_KEY:
        return jsonify({"error": "API key missing"}), 500

    if len(query) < 2 or len(query) > 100:
        return jsonify({"error": "Invalid search query"}), 400

    params = {
        "input": query + "?",
        "format": "json",
        "accessId": API_KEY,
        "maxNo": 10
    }

    try:

        response = requests.get(
            BASE_URL + "/location.name",
            params=params,
            timeout=15
        )

        if not response.ok:
            return jsonify({
                "error": "ResRobot request failed",
                "status": response.status_code
            }), 502

        return jsonify(response.json())

    except (requests.RequestException, ValueError):

        return jsonify({
            "error": "Could not retrieve station data"
        }), 502


# ==========================================
# JOURNEY PLANNING API
# ==========================================

@app.route("/api/trips")
def search_trips():

    origin = request.args.get("origin", "").strip()
    destination = request.args.get("destination", "").strip()

    if not API_KEY:
        return jsonify({"error": "API key missing"}), 500

    if not origin.isdigit() or not destination.isdigit():
        return jsonify({"error": "Invalid station ID"}), 400

    if origin == destination:
        return jsonify({
            "error": "Stations must be different"
        }), 400

    params = {
        "originId": origin,
        "destId": destination,
        "format": "json",
        "accessId": API_KEY,
        "lang": "sv",
        "numF": 3
    }

    try:

        response = requests.get(
            BASE_URL + "/trip",
            params=params,
            timeout=20
        )

        if not response.ok:
            return jsonify({
                "error": "ResRobot request failed",
                "status": response.status_code
            }), 502

        data = response.json()

        if data.get("errorCode"):
            return jsonify({
                "error": "ResRobot trip search failed",
                "code": data["errorCode"]
            }), 502

        return jsonify(data)

    except (requests.RequestException, ValueError):

        return jsonify({
            "error": "Could not retrieve journey data"
        }), 502


# ==========================================
# DEPARTURE BOARD API - NEW
# ==========================================

@app.route("/api/departures")
def search_departures():

    station_id = request.args.get("id", "").strip()

    if not API_KEY:
        return jsonify({"error": "API key missing"}), 500

    if not station_id.isdigit():
        return jsonify({"error": "Invalid station ID"}), 400

    params = {
        "id": station_id,
        "format": "json",
        "accessId": API_KEY,
        "duration": 60,
        "maxJourneys": 20
    }

    try:

        response = requests.get(
            BASE_URL + "/departureBoard",
            params=params,
            timeout=20
        )

        if not response.ok:
            return jsonify({
                "error": "ResRobot request failed",
                "status": response.status_code
            }), 502

        data = response.json()

        if data.get("errorCode"):
            return jsonify({
                "error": "Departure search failed",
                "code": data["errorCode"]
            }), 502

        return jsonify(data)

    except (requests.RequestException, ValueError):

        return jsonify({
            "error": "Could not retrieve departures"
        }), 502

# ==========================================
# SL TRAFFIC DEVIATIONS API
# ==========================================

from time import monotonic
from threading import Lock

traffic_cache = {
    "data": None,
    "timestamp": None,
    "failed": False
}

traffic_lock = Lock()


@app.route("/api/traffic")
def traffic_status():

    with traffic_lock:

        current_time = monotonic()
        last_attempt = traffic_cache["timestamp"]

        if (
            last_attempt is not None
            and current_time - last_attempt < 60
        ):
            if traffic_cache["failed"]:
                return jsonify({
                    "error": "Traffic information temporarily unavailable"
                }), 503

            return jsonify(traffic_cache["data"])

        traffic_cache["timestamp"] = current_time

        try:
            response = requests.get(
                "https://deviations.integration.sl.se/v1/messages",
                params={"future": "false"},
                timeout=15
            )

            response.raise_for_status()
            data = response.json()

            if not isinstance(data, list):
                raise ValueError("Unexpected traffic data")

            traffic_cache["data"] = data
            traffic_cache["failed"] = False

            return jsonify(data)

        except (requests.RequestException, ValueError):

            traffic_cache["failed"] = True

            return jsonify({
                "error": "Could not retrieve SL traffic information"
            }), 502


# ==========================================
# START LOCAL DEVELOPMENT SERVER
# ==========================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
