# Hotel Offer Orchestrator

Docker is the only prerequisite. Node.js, Redis, and Temporal do not need to be installed on the host.

## Deploy

From the repository root, with Docker running:

```bash
docker compose up --build
```

This builds the app image and starts Postgres, Temporal, Redis, the API, and the worker. Leave that terminal open. The command keeps running and prints logs.

| Service     | Address               |
| ----------- | --------------------- |
| API         | http://localhost:3000 |
| Temporal UI | http://localhost:8080 |
| Redis       | localhost:6379        |
| Temporal    | localhost:7233        |

Ports 3000, 6379, 7233, and 8080 must be free. If port 3000 is taken, set `API_PORT` to another host port and open the API at `http://localhost:<API_PORT>`.

The first Temporal startup migrates Postgres and can take about a minute. The API and worker start only after Temporal is healthy. If Compose stops because Temporal is still unhealthy, run the same command again.

## Check the API

In a second terminal, after the API is up:

```bash
curl "http://localhost:3000/api/hotels?city=delhi"
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=5000&maxPrice=6000"
```

The first command returns the deduplicated hotel array. The second returns only hotels inside that price range. If you changed `API_PORT`, use that port in both URLs.

## Postman

1. Open Postman and choose **Import**.
2. Select `postman/Hotel-Offer-Orchestrator.postman_collection.json`.
3. Set the collection variable `baseUrl` to the API address, normally `http://localhost:3000`.
4. Run the collection.
