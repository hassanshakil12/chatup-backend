import "./src/config/env.js";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import transporter from "./src/config/nodemailer.js";

const PORT = process.env.PORT || 5000;

(() => {
  try {
    app.listen(PORT, async () => {
      await connectDB();
      transporter
        .verify()
        .then(() => {
          console.log("Email transporter is ready");
        })
        .catch((err) => {
          console.error("TRANSPORTER ERROR:", err);
        });

      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(`Error starting server: ${error.message}`);
  }
})();
