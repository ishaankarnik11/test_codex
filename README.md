# Wake-on-LAN Server

Simple ExpressJS server that exposes a `/wake` endpoint to send Wake-on-LAN packets.

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

Send a POST request to `/wake` with JSON body containing `mac` address.

```bash
curl -X POST http://localhost:3000/wake \
  -H "Content-Type: application/json" \
  -d '{"mac":"AA:BB:CC:DD:EE:FF"}'
```

## Device Management

Three additional endpoints are available to manage devices. Device information
is persisted in a MongoDB database. A device requires a `name` and `mac`
address. An optional `ip` address can also be provided.

### Add a Device

```bash
curl -X POST http://localhost:3000/device \
  -H "Content-Type: application/json" \
  -d '{"name":"Desktop","mac":"AA:BB:CC:DD:EE:FF","ip":"192.168.0.10"}'
```

### Update a Device

```bash
curl -X PUT http://localhost:3000/device/Desktop \
  -H "Content-Type: application/json" \
  -d '{"mac":"AA:BB:CC:DD:EE:11","ip":"192.168.0.11"}'
```

### Delete a Device

```bash
curl -X DELETE http://localhost:3000/device/Desktop
```
