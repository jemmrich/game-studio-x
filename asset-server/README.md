# GSX Assets File Server

A simple Deno file server for serving static assets.

## Prerequisites

- [Deno](https://deno.land/) installed on your system

## Running the Server

Start the file server with the following command:

```bash
deno task serve
```

Or directly:

```bash
deno run --allow-net --allow-read server.ts
```

The server will start on `http://localhost:8001/`

### Permissions

- `--allow-net`: Required to run the HTTP server
- `--allow-read`: Required to read and serve files from the directory

## Features

- Serves files from the current directory
- Directory listing enabled
- CORS enabled for cross-origin requests
- Runs on port 8001

## Usage

Once running, access the server at:
- http://localhost:8001/

You can navigate through directories and access any files in the project.
