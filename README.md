# Wake-on-LAN Server

Simple ExpressJS server that exposes endpoints to manage devices, log activity
and send Wake-on-LAN packets.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

The server expects a MongoDB instance running locally at
`mongodb://localhost:27017/wol`. You can override this by setting the
`MONGODB_URI` environment variable before starting the server.

Server listens on port `3000` by default.

## Usage

Send a POST request to `/wake` with JSON body containing `macAddress`.

```bash
curl -X POST http://localhost:3000/wake \
  -H "Content-Type: application/json" \
  -d '{"mac":"AA:BB:CC:DD:EE:FF"}'
```

## Device Management

Several endpoints are available to manage devices. Device information
is persisted in a MongoDB database. A device requires a `name` and `macAddress`.
An optional `ipAddress`, `description` and `group` can also be provided.

### Add a Device

```bash
curl -X POST http://localhost:3000/device \
  -H "Content-Type: application/json" \
  -d '{"name":"Desktop","macAddress":"AA:BB:CC:DD:EE:FF","ipAddress":"192.168.0.10"}'
```

### Update a Device

```bash
curl -X PUT http://localhost:3000/device/Desktop \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"AA:BB:CC:DD:EE:11","ipAddress":"192.168.0.11"}'
```

### Delete a Device

```bash
curl -X DELETE http://localhost:3000/device/Desktop
```

## REST API

The server also exposes a set of `/api/*` endpoints more suitable for
front‑end applications.

* `GET /api/health` – health check.
* `GET /api/devices` – list devices.
* `GET /api/devices/{id}` – fetch a single device.
* `POST /api/devices` – create a device.
* `PUT /api/devices/{id}` – update a device.
* `DELETE /api/devices/{id}` – remove a device.
* `POST /api/devices/{id}/wake` – send Wake‑on‑LAN for a device.
* `POST /api/devices/bulk-wake` – wake multiple devices.
* `GET /api/activities` – list activity records.
* `POST /api/activities` – record an activity.
* `DELETE /api/activities` – clear activity records.
* `GET /api/activities/{id}` – get a single activity entry.
* `GET /api/groups` – list available groups.
