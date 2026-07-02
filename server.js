const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    socket.on("join-workspace", (workspaceId) => {
      console.log(`Client ${socket.id} joining workspace room: ${workspaceId}`);
      socket.join(workspaceId);
    });

    socket.on("join-project", (projectId) => {
      console.log(`Client ${socket.id} joining project room: ${projectId}`);
      socket.join(projectId);
    });

    socket.on("leave-project", (projectId) => {
      console.log(`Client ${socket.id} leaving project room: ${projectId}`);
      socket.leave(projectId);
    });

    socket.on("task-update", (data) => {
      console.log(`Task update received on socket:`, data);
      const { workspaceId } = data;
      if (workspaceId) {
        socket.to(workspaceId).emit("task-update", data);
      } else {
        socket.broadcast.emit("task-update", data);
      }
    });

    socket.on("task-status-updated", (data) => {
      console.log(`Task status updated received on socket:`, data);
      const { projectId } = data;
      // Ensure projectId is always included in the re-broadcast payload
      const broadcastPayload = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
        projectId,
      };
      if (projectId) {
        socket.to(projectId).emit("task-status-changed", broadcastPayload);
      } else {
        socket.broadcast.emit("task-status-changed", broadcastPayload);
      }
    });

    socket.on("task-created", (data) => {
      console.log(`Task created received on socket:`, data);
      const { projectId } = data;
      if (projectId) {
        socket.to(projectId).emit("task-added", data);
      } else {
        socket.broadcast.emit("task-added", data);
      }
    });

    socket.on("task-deleted", (data) => {
      console.log(`Task deleted received on socket:`, data);
      const { projectId } = data;
      if (projectId) {
        socket.to(projectId).emit("task-removed", data);
      } else {
        socket.broadcast.emit("task-removed", data);
      }
    });

    socket.on("project-update", (data) => {
      console.log(`Project update received on socket:`, data);
      const { workspaceId } = data;
      if (workspaceId) {
        socket.to(workspaceId).emit("project-update", data);
      } else {
        socket.broadcast.emit("project-update", data);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
