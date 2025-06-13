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

Server listens on port `3000` by default.

## Usage

Send a POST request to `/wake` with JSON body containing `mac` address.

```bash
curl -X POST http://localhost:3000/wake \
  -H "Content-Type: application/json" \
  -d '{"mac":"AA:BB:CC:DD:EE:FF"}'
```
