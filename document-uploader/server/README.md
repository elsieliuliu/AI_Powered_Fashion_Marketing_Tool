# Document Analysis Server

This server provides document analysis capabilities for the Fashion project.

## Port Configuration

The server uses a simplified port configuration system with a clear order of precedence:

1. `SERVER_PORT` environment variable (highest priority)
2. `PORT` environment variable (secondary priority)
3. Default port `64970` (lowest priority)

### Server Port Discovery

When the server starts, it:

1. Determines the port using the precedence above
2. Writes the port to multiple locations for easy discovery:
   - `public/server-port.txt` (primary location)
   - `server-port.txt` (in the server directory for backward compatibility)
   - `public/port-info.json` (with additional metadata)

The client uses a similar order of precedence when discovering the server port:

1. Checks `public/port-info.json` (most reliable, includes timestamp)
2. Checks `public/server-port.txt`
3. Checks localStorage for a cached port
4. Tries the default port (64970)
5. Tries common ports (5000, 3000, etc.) as a last resort

## Starting the Server

Several npm scripts are available for starting the server:

```bash
# Start with default port selection logic
npm start

# Start with specific ports
npm run start:default  # Uses port 64970
npm run start:3000     # Uses port 3000
npm run start:5000     # Uses port 5000

# Start with a random available port
npm run start:random

# Start with auto-reload during development
npm run start:dev
```

## Environment Variables

Copy the `.env.example` file to `.env` to configure environment variables:

```bash
cp .env.example .env
```

Then edit the `.env` file to set your configuration options.

## Dependencies

Make sure to install dependencies before starting the server:

```bash
npm install
```

## Common Issues

### Port Already in Use

If you see an error like "Port 64970 is already in use", you have these options:

1. Close the application using this port
2. Set `SERVER_PORT` to a different value in your `.env` file
3. Use one of the alternate start scripts:
   ```bash
   npm run start:3000
   # or
   npm run start:random
   ```
