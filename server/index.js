const { WebSocketServer } = require('ws')
const http = require('http')
const uuidv4 = require('uuid').v4
const url = require('url')

const server = http.createServer()
const wsServer = new WebSocketServer({ server })

const port = 8000
const connections = {}
const users = {}

const handleMessage = (bytes, uuid) => {
  const message = JSON.parse(bytes.toString())
  console.log(`${username} connected`)
  const user = users[uuid]
  user.state = message
  broadcast()

  console.log(`${user.username} updated their updated state: ${JSON.stringify(user.state)}`)
}

const handleClose = uuid => {
  console.log(`${users[uuid].username} disconnected`)
  delete connections[uuid]
  delete users[uuid]
  broadcast()
}

const broadcast = () => {
  Object
    .keys(connections)
    .forEach(uuid => {
      const connection = connections[uuid]
      const message = JSON.stringify(users)
      connection.send(message)
    })
}

wsServer.on('connection', (connection, request) => {
  const { username }  = url.parse(request.url, true).query
  console.log(`${username} connected`)
  const uuid = uuidv4()
  connections[uuid] = connection
  users[uuid] = {
    username,
    state: { }
  }
  connection.on('message', message => handleMessage(message, uuid));
  connection.on('close', () => handleClose(uuid));
});

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
})









import http, { IncomingMessage, ServerResponse } from "http";
import { server as WebSocketServer, routerRequest, IMessage } from "websocket";
import { serverStartTime, logger } from "./app";

// Create HTTP server
const httpServer = http.createServer((request: IncomingMessage, response: ServerResponse) => {
  if (request.url === "/status") {
    response.writeHead(200, { "Content-Type": "application/json" });

    const responseObject = {
      serverStarted: serverStartTime,
    };

    response.end(JSON.stringify(responseObject));
  } else {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Sorry, unknown url");
  }
});

httpServer.listen(process.env.HTTP_PORT_LISTEN, (error: Error) => {
  if (error === undefined) {
    logger.info(`HTTP server started and listening on port ${process.env.HTTP_PORT_LISTEN}`);
  } else {
    process.exit(1);
  }
});

// Create WebSocket server
const wsServer = new WebSocketServer({
  httpServer: httpServer
});

// Handle WebSocket clients emits
wsServer.on("request", (request: routerRequest) => {
  const connection = request.accept(request.origin);

  connection.on("message", (message: IMessage) => {
    if (message.type === "utf8") {
      logger.info(`Received Message: ${message.utf8Data}`);
      // connection.sendUTF(message.utf8Data); // reply message to client
    }
    else if (message.type === "binary") {
      logger.info(`Received Binary Message of ${message.binaryData.length} bytes`);
      // connection.sendBytes(message.binaryData); // reply message to client
    }
  });

  connection.on("close", (code: number, message: string) => {
    logger.info(`Client disconnected. Reason: ${message}`);
  });
});