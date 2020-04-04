const http = require("http");
const { SERVICE_UNAVAILABLE, getStatusText } = require("http-status-codes");
const { PORT, SHUTDOWN_TIMEOUT, REFRESH_TIMEOUT } = require("../config");
const { logger } = require("../lib");
const { closeAllActors } = require("../actors");
const requestHandler = require("../framework");

const connections = new Map();

const server = http
  .createServer((req, res) => {
    connections.set(res.socket, res);
    requestHandler(req, res);
  })
  .listen(PORT)
  .on("error", onError)
  .on("listening", onListening)
  .on("connection", onConnection);

process.on("SIGINT", async () => {
  if (!server.listening) return;
  logger.info("Stopping server");
  await gracefulShutdown();
  logger.info("Server has stopped");
  process.exit(0);
});

process.on(
  "unhandledRejection",
  logger.uncaught((err, finalLogger) => {
    finalLogger.error(err, "unhandledRejection");
    process.exit(1);
  }),
);

process.on(
  "uncaughtException",
  logger.uncaught((err, finalLogger) => {
    finalLogger.error(err, "uncaughtException");
    process.exit(1);
  }),
);

function onError(err) {
  if (err.syscall !== "listen") {
    throw err;
  }

  const bind = typeof port === "string" ? `Pipe ${PORT}` : `Port ${PORT}`;

  // handle specific listen errors with friendly messages
  const errCodeStrategies = {
    EACCES() {
      logger.error(`${bind} requires elevated privileges`);
    },
    EADDRINUSE() {
      logger.error(`${bind} is already in use`);
    },
  };

  if (!(err.code in errCodeStrategies)) throw err;

  errCodeStrategies[err.code]();
  process.exit(1);
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
}

function onConnection(socket) {
  socket.on("close", () => {
    connections.delete(socket);
  });
}

function timeout(msec) {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  });
}

function freeResources() {
  return closeAllActors();
}

async function closeConnections() {
  const HTTP_HEADERS = {
    "Content-Type": "text/plain",
    Refresh: REFRESH_TIMEOUT,
  };
  const message = getStatusText(SERVICE_UNAVAILABLE);
  const connectionList = [...connections.entries()];

  connectionList.forEach(([connection, res]) => {
    connections.delete(connection);
    if (!res.headersSent) {
      res.writeHead(SERVICE_UNAVAILABLE, HTTP_HEADERS);
      res.end(message);
    }
    connection.destroy();
  });
}

async function gracefulShutdown() {
  server.close(error => {
    if (error) {
      logger.error(error);
      process.exit(1);
    }
  });

  await timeout(SHUTDOWN_TIMEOUT);
  await freeResources();
  await closeConnections();
}
