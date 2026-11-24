
# Stockholm Travel

## Project Overview

Stockholm Travel is an unofficial educational web application inspired by the Swedish public transport website SL.se.

The project was developed as part of the Reverse Engineer a Result assignment, using generative AI to analyse, recreate, implement and test an existing application.

This project is not affiliated with SL or Region Stockholm.

## Features

- Station search with autocomplete
- Journey planning using public transport data
- Departure boards
- Travel duration and departure times
- Transport lines and journey transfers
- Live traffic disruption messages
- Clickable traffic information cards
- Automatic traffic information refresh every 60 seconds
- Responsive desktop and mobile design
- Server-side API key management
- Input validation and error handling

## Technologies

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend functionality |
| Python | Backend development |
| Flask | Web server and API endpoints |
| Requests | External API communication |
| Python-dotenv | Environment variables |
| Git | Version control |
| GitHub | Source code repository |
| Generative AI | Development and troubleshooting |

## External APIs

### Trafiklab ResRobot v2.1

Used for station searches, journey planning and departure information.

### SL Deviations API

Used for traffic disruption messages across different public transport categories.

Traffic information is cached on the backend for 60 seconds.

## Project Structure

    stockholm-travel/
    ├── index.html
    ├── style.css
    ├── script.js
    ├── app.py
    ├── aik.png
    ├── requirements.txt
    ├── README.md
    ├── .gitignore
    └── .env (local only)

## Installation

### 1. Install dependencies

    python -m pip install -r requirements.txt

### 2. Configure environment variables

Create a local file named .env.

Add your own Trafiklab API key:

    RESROBOT_API_KEY=YOUR_API_KEY

A GTFS API key may also be configured for future development, but GTFS realtime integration is not currently implemented.

Never commit API keys to GitHub.

### 3. Start the application

    python app.py

### 4. Open the application

    http://127.0.0.1:5000

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/stations | Search stations |
| GET | /api/trips | Plan journeys |
| GET | /api/departures | Retrieve departures |
| GET | /api/traffic | Retrieve traffic disruptions |

## Security

The application implements basic security measures:

- API keys stored in environment variables
- Sensitive files excluded from Git
- Restricted static file access
- Server-side input validation
- HTTP request timeouts
- Sanitised API error responses
- Flask debug mode disabled
- Safe rendering of external text data

## Testing

Testing was performed on 24 November 2026.

| Test category | Result |
|---|---|
| Final HTTP endpoint tests | 8/8 PASS |
| Protected file access | 4/4 PASS |
| API input validation | 4/4 PASS |
| API key exposure checks | 7/7 PASS |
| Station autocomplete | PASS |
| Journey planning | PASS |
| Departure board | PASS |
| Traffic disruption display | PASS |
| Automatic traffic refresh | PASS |
| Mobile functionality | PASS |

## Performance

Local HTTP response times recorded during final testing:

| Endpoint | Response time |
|---|---:|
| Homepage | 2.08 ms |
| CSS | 1.90 ms |
| JavaScript | 2.33 ms |
| Station search | 108.10 ms |
| Journey planning | 147.22 ms |
| Departure board | 229.58 ms |
| Traffic information | 73.69 ms |

These measurements represent a single local test run and are not production performance benchmarks.

## Limitations

- The application is an educational prototype.
- Some navigation links are placeholders.
- Ticket purchasing is not implemented.
- GTFS realtime integration is not implemented.
- Departure information depends on the available API data.
- External API outage handling has not been fully verified.
- The application has not undergone a comprehensive security audit.
- Production deployment has not been implemented.

## Future Improvements

- GTFS realtime integration
- Interactive transport maps
- Improved journey filtering
- Favourite stations
- Automated regression testing
- Production deployment using AWS
- Additional security hardening

## Conclusion

The project demonstrates how an existing public transport website can be reverse engineered and recreated using modern web technologies, external APIs and generative AI.

The application successfully combines frontend development, backend development, API integration, responsive design and basic security testing.

## Data Sources

- SL: https://sl.se/
- Trafiklab: https://www.trafiklab.se/

## Disclaimer

This project was created for educational purposes only.

It is not an official SL application. Third-party names, trademarks and logos belong to their respective owners.

