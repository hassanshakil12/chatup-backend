import { Server } from "socket.io";
import { createServer } from "node:http";
import connectDB from "./db.js";
import transporter from "./nodemailer.js";

const startServer = (app) => {
  try {
    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.BASE_URL,
        credentials: true,
      },
    });

    global.io = io;

    io.on("connection", (socket) => {
      console.log(`A user connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });

    server.listen(process.env.PORT, async () => {
      await connectDB();
      transporter
        .verify()
        .then(() => {
          console.log("Email transporter is ready");
        })
        .catch((err) => {
          console.error("TRANSPORTER ERROR:", err);
        });
      console.log(`Server is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
  }
};

export default startServer;
