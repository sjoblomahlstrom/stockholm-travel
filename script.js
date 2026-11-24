
// Stockholm Travel - Reverse Engineering Project
// ResRobot v2.1 Integration

const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const swapButton = document.getElementById("swap");

const journeyTab = document.getElementById("journey-tab");
const departureTab = document.getElementById("departure-tab");
const heading = document.querySelector(".journey-box h1");
const fromLabel = document.querySelector('label[for="from"]');
const toGroup = toInput.closest(".input-group");
const results = document.getElementById("journey-results");

const stationCache = new Map();

let searchVersion = 0;

// Display messages

function showMessage(message) {
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    results.appendChild(paragraph);
}

// Create text elements safely

function addText(parent, tag, content, className) {
    const element = document.createElement(tag);

    element.textContent = content;

    if (className) {
        element.className = className;
    }

    parent.appendChild(element);

    return element;
}

// Clear previous search results

function clearResults() {
    searchVersion++;
    results.replaceChildren();
}

// ==========================================
// STATION SEARCH
// ==========================================

function setupStationSearch(input, listId) {

    const stationList = document.createElement("datalist");

    stationList.id = listId;

    document.body.appendChild(stationList);
    input.setAttribute("list", listId);

    let timer;
    let controller;

    input.addEventListener("input", function () {

        clearResults();
        clearTimeout(timer);

        if (controller) {
            controller.abort();
        }

        stationList.replaceChildren();

        const query = input.value.trim();

        if (query.length < 2 || stationCache.has(query)) {
            return;
        }

        timer = setTimeout(async function () {

            controller = new AbortController();

            try {

                const response = await fetch(
                    "/api/stations?q=" + encodeURIComponent(query),
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Station search failed");
                }

                const data = await response.json();

                if (input.value.trim() !== query) {
                    return;
                }

                const locations =
                    data.stopLocationOrCoordLocation || [];

                stationList.replaceChildren();

                locations.forEach(function (location) {

                    const station = location.StopLocation;

                    if (!station || !station.name || !station.extId) {
                        return;
                    }

                    stationCache.set(
                        station.name,
                        station.extId
                    );

                    const option = document.createElement("option");

                    option.value = station.name;

                    stationList.appendChild(option);
                });

            } catch (error) {

                if (error.name === "AbortError") {
                    return;
                }

                if (input.value.trim() !== query) {
                    return;
                }

                results.replaceChildren();

                showMessage(
                    "Kunde inte hämta stationer. Försök igen."
                );
            }

        }, 400);
    });
}

setupStationSearch(fromInput, "from-station-list");
setupStationSearch(toInput, "to-station-list");

// ==========================================
// SWAP STATIONS
// ==========================================

swapButton.addEventListener("click", function () {

    const temporary = fromInput.value;

    fromInput.value = toInput.value;
    toInput.value = temporary;

    clearResults();
});

// ==========================================
// JOURNEY TAB
// ==========================================

journeyTab.addEventListener("click", function () {

    journeyTab.classList.add("active");
    departureTab.classList.remove("active");

    heading.textContent = "Vart vill du åka?";
    fromLabel.textContent = "Från";

    toGroup.style.display = "";
    swapButton.style.display = "";

    clearResults();
});

// ==========================================
// DEPARTURE TAB
// ==========================================

departureTab.addEventListener("click", function () {

    departureTab.classList.add("active");
    journeyTab.classList.remove("active");

    heading.textContent = "Vilken station vill du åka från?";
    fromLabel.textContent = "Station";

    toGroup.style.display = "none";
    swapButton.style.display = "none";

    clearResults();
});

// ==========================================
// CREATE SEARCH BUTTON
// ==========================================

const travelButton = document.createElement("button");

travelButton.textContent = "Sök";
travelButton.id = "travel-search";
travelButton.type = "button";

document.querySelector(".journey-fields")
    .after(travelButton);

// ==========================================
// FORMAT TIME AND DURATION
// ==========================================

function formatTime(time) {
    return time ? time.slice(0, 5) : "--:--";
}

function formatDuration(duration) {

    const match = (duration || "").match(
        /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
    );

    if (!match) {
        return "Okänd restid";
    }

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);

    return Math.ceil(
        hours * 60 + minutes + seconds / 60
    ) + " min";
}

// ==========================================
// TRANSPORT TYPES
// ==========================================

function transportName(category, number, fallback) {

    switch (category) {

        case "JLT":
            return "🚆 Pendeltåg " + number;

        case "SLT":
            return "🚋 Spårvagn " + number;

        case "ULT":
            return "🚇 Tunnelbana " + number;

        case "BLT":
            return "🚌 Buss " + number;

        default:
            return fallback || "Transport " + number;
    }
}

// ==========================================
// DISPLAY JOURNEY RESULTS
// ==========================================

function displayTrip(trip) {

    const card = document.createElement("article");

    card.className = "trip-card";

    const origin = trip.Origin || {};
    const destination = trip.Destination || {};

    addText(
        card,
        "h2",
        formatTime(origin.time) +
        " – " +
        formatTime(destination.time),
        "trip-time"
    );

    addText(
        card,
        "p",
        "Datum: " + (origin.date || "Okänt")
    );

    addText(
        card,
        "p",
        "Restid: " + formatDuration(trip.duration)
    );

    addText(
        card,
        "p",
        "Antal byten: " + (trip.transferCount ?? "Okänt")
    );

    const legs = trip.LegList?.Leg || [];

    legs.forEach(function (leg) {

        const section = document.createElement("div");

        section.className = "trip-leg";

        const legOrigin = leg.Origin || {};
        const legDestination = leg.Destination || {};

        let transport = transportName(
            leg.category,
            leg.number || "",
            leg.name
        );

        if (leg.type === "WALK") {
            transport = "🚶 Promenad";
        }

        addText(section, "h3", transport);

        addText(
            section,
            "p",
            formatTime(legOrigin.time) +
            " – " +
            (legOrigin.name || "Okänd station")
        );

        addText(
            section,
            "p",
            formatTime(legDestination.time) +
            " – " +
            (legDestination.name || "Okänd station")
        );

        if (leg.direction) {

            addText(
                section,
                "p",
                "Mot: " + leg.direction
            );
        }

        if (leg.type === "WALK" && leg.dist != null) {

            addText(
                section,
                "p",
                "Gångsträcka: " + leg.dist + " meter"
            );
        }

        card.appendChild(section);
    });

    results.appendChild(card);
}

// ==========================================
// DISPLAY DEPARTURES - NEW
// ==========================================

function displayDeparture(departure) {

    const card = document.createElement("article");

    card.className = "trip-card";

    const product =
        departure.ProductAtStop ||
        departure.Product?.[0] ||
        {};

    const number =
        product.displayNumber ||
        product.line ||
        product.num ||
        "";

    const category = product.catOut || product.catIn;

    const transport = transportName(
        category,
        number,
        departure.name
    );

    addText(
        card,
        "h2",
        formatTime(departure.rtTime || departure.time),
        "trip-time"
    );

    addText(
        card,
        "h3",
        transport
    );

    addText(
        card,
        "p",
        "Mot: " + (departure.direction || "Okänd destination")
    );

    addText(
        card,
        "p",
        "Station: " + (departure.stop || "Okänd station")
    );

    addText(
        card,
        "p",
        "Datum: " + (departure.rtDate || departure.date || "Okänt")
    );

    if (departure.track) {

        addText(
            card,
            "p",
            "Spår: " + departure.track
        );
    }

    if (departure.cancelled) {

        addText(card, "p", "Inställd");

    } else if (departure.rtTime) {

        addText(
            card,
            "p",
            "Planerad avgång: " + formatTime(departure.time)
        );

        addText(card, "p", "Uppdaterad avgångstid");

    } else {

        addText(card, "p", "Enligt tidtabell");
    }

    results.appendChild(card);
}

// ==========================================
// SEARCH JOURNEYS AND DEPARTURES
// ==========================================

travelButton.addEventListener("click", async function () {

    const from = fromInput.value.trim();
    const to = toInput.value.trim();

    const fromId = stationCache.get(from);
    const toId = stationCache.get(to);

    const isDeparture =
        departureTab.classList.contains("active");

    clearResults();

    const currentSearch = searchVersion;

    if (!fromId) {

        showMessage("Välj en station från stationsförslagen.");
        return;
    }

    if (!isDeparture && !toId) {

        showMessage("Välj en destination från stationsförslagen.");
        return;
    }

    if (!isDeparture && fromId === toId) {

        showMessage("Från och Till får inte vara samma station.");
        return;
    }

    travelButton.disabled = true;
    travelButton.textContent = "Söker...";

    showMessage(
        isDeparture
            ? "Hämtar avgångar från ResRobot..."
            : "Hämtar reseförslag från ResRobot..."
    );

    try {

        let url;

        if (isDeparture) {

            url = "/api/departures?id=" +
                encodeURIComponent(fromId);

        } else {

            const params = new URLSearchParams({
                origin: fromId,
                destination: toId
            });

            url = "/api/trips?" + params.toString();
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        if (currentSearch !== searchVersion) {
            return;
        }

        results.replaceChildren();

        // Display departures

        if (isDeparture) {

            const departures = data.Departure || [];

            if (departures.length === 0) {

                showMessage("Inga avgångar hittades.");
                return;
            }

            addText(
                results,
                "h2",
                "Avgångar från " + from
            );

            showMessage(
                "Antal avgångar: " + departures.length
            );

            departures.forEach(displayDeparture);

        } else {

            // Display journeys

            const trips = data.Trip || [];

            if (trips.length === 0) {

                showMessage("Inga resor hittades.");
                return;
            }

            addText(
                results,
                "h2",
                "Reseförslag: " + from + " → " + to
            );

            trips.forEach(displayTrip);
        }

        showMessage("Datakälla: Trafiklab / ResRobot v2.1");

    } catch (error) {

        if (currentSearch !== searchVersion) {
            return;
        }

        results.replaceChildren();

        showMessage(
            isDeparture
                ? "Kunde inte hämta avgångar. Försök igen."
                : "Kunde inte hämta reseförslag. Försök igen."
        );

    } finally {

        travelButton.disabled = false;
        travelButton.textContent = "Sök";
    }
});
// ==========================================
// SL LIVE TRAFFIC INFORMATION
// ==========================================

const trafficCards = document.querySelectorAll(".traffic-card");
const trafficUpdated = document.getElementById("last-updated");
const trafficDetails = document.getElementById("traffic-details");
const trafficTitle = document.getElementById("traffic-details-title");
const trafficMessages = document.getElementById("traffic-messages");
const trafficClose = document.getElementById("close-traffic-details");

let liveTraffic = [];
let trafficAvailable = false;
let trafficLoading = false;
let selectedTraffic = null;

function getTrafficGroup(line) {

    const mode = line.transport_mode;
    const number = String(line.designation);

    if (mode === "METRO") {

        if (["10", "11"].includes(number)) {
            return "metro-blue";
        }

        if (["13", "14"].includes(number)) {
            return "metro-red";
        }

        if (["17", "18", "19"].includes(number)) {
            return "metro-green";
        }
    }

    if (mode === "BUS") return "bus";
    if (mode === "TRAIN") return "train";
    if (mode === "TRAM") return "tram";
    if (mode === "SHIP") return "ship";

    return null;
}

function getTrafficMessages(group) {

    return liveTraffic.filter(function (message) {

        const lines = message.scope?.lines || [];

        return lines.some(function (line) {
            return getTrafficGroup(line) === group;
        });
    });
}

function renderTrafficDetails(card) {

    selectedTraffic = card;

    trafficCards.forEach(function (item) {
        item.setAttribute(
            "aria-expanded",
            String(item === card)
        );
    });

    trafficTitle.textContent =
        card.querySelector("strong").textContent;

    trafficMessages.replaceChildren();
    trafficDetails.hidden = false;

    if (!trafficAvailable) {

        addText(
            trafficMessages,
            "p",
            "Aktuell trafikinformation är inte tillgänglig."
        );

        return;
    }

    const messages = getTrafficMessages(
        card.dataset.traffic
    );

    if (messages.length === 0) {

        addText(
            trafficMessages,
            "p",
            "Inga matchande trafikmeddelanden."
        );

        return;
    }

    messages.forEach(function (message) {

        const variants = message.message_variants || [];

        const variant =
            variants.find(v => v.language === "sv") ||
            variants[0] ||
            {};

        const article = document.createElement("article");

        article.className = "trip-card";

        addText(
            article,
            "h3",
            variant.header || "Trafikmeddelande"
        );

        addText(
            article,
            "p",
            variant.scope_alias || "Berörda linjer"
        );

        addText(
            article,
            "p",
            variant.details || "Ingen beskrivning tillgänglig."
        );

        trafficMessages.appendChild(article);
    });
}

trafficCards.forEach(function (card) {

    card.addEventListener("click", function () {
        renderTrafficDetails(card);
    });
});

trafficClose.addEventListener("click", function () {

    trafficDetails.hidden = true;
    selectedTraffic = null;

    trafficCards.forEach(function (card) {
        card.setAttribute("aria-expanded", "false");
    });
});

async function loadTraffic() {

    if (trafficLoading) return;

    trafficLoading = true;

    try {

        const response = await fetch("/api/traffic", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Traffic API failed");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid traffic data");
        }

        liveTraffic = data;
        trafficAvailable = true;

        trafficCards.forEach(function (card) {

            const messages = getTrafficMessages(
                card.dataset.traffic
            );

            const status = card.querySelector(
                ".traffic-status"
            );

            status.classList.remove(
                "status-good",
                "status-warning"
            );

            if (messages.length === 0) {

                status.textContent =
                    "Inga matchande meddelanden";

            } else {

                status.textContent =
                    messages.length + " trafikmeddelanden";

                status.classList.add("status-warning");
            }
        });

        const unclassified = liveTraffic.filter(function (message) {

            const lines = message.scope?.lines || [];

            return lines.length === 0 ||
                lines.some(line => !getTrafficGroup(line));
        }).length;

        trafficUpdated.textContent =
            "Senast hämtad: " +
            new Date().toLocaleTimeString("sv-SE") +
            " | " + liveTraffic.length +
            " trafikmeddelanden totalt" +
            " | " + unclassified +
            " helt eller delvis oklassificerade";

    } catch (error) {

        trafficAvailable = false;
        liveTraffic = [];

        trafficUpdated.textContent =
            "Kunde inte hämta trafikinformation.";

        trafficCards.forEach(function (card) {

            const status = card.querySelector(
                ".traffic-status"
            );

            status.classList.remove(
                "status-good",
                "status-warning"
            );

            status.textContent = "Status okänd";
        });

        console.error("Traffic information failed:", error);

    } finally {

        trafficLoading = false;

        if (selectedTraffic) {
            renderTrafficDetails(selectedTraffic);
        }
    }
}

// Load traffic information immediately
loadTraffic();

// Refresh traffic information every 60 seconds
setInterval(loadTraffic, 60000);