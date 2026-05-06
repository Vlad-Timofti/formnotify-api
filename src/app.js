const authRoutes = require("./modules/auth/auth.routes");
const submissionRoutes = require("./modules/submissions/submissions.routes");
const notificationRoutes = require("./modules/notifications/notifications.routes");
const formRoutes = require("./modules/forms/forms.routes");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(express.json());

const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many submissions. Please try again later.",
  },
});

app.use("/public/forms", publicSubmitLimiter);

const swaggerDocument = YAML.load(path.join(__dirname, "docs", "openapi.yaml"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/notification-channels", notificationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FormNotify API is running",
  });
});

app.use("/auth", authRoutes);
app.use("/forms", formRoutes);
app.use("/", submissionRoutes);
module.exports = app;