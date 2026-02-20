const express = require("express");
const cors = require("cors");

const { PORT, CLIENT_ORIGIN } = require("./config/env");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
<<<<<<< HEAD
const aiRoutes = require("./routes/ai.routes");
=======
const postRoutes = require("./routes/post.routes");
>>>>>>> b4ed66a7859ca46242fea49c174321a7d3857b96

const app = express();

app.use(
<<<<<<< HEAD
  cors({ origin: [CLIENT_ORIGIN, "http://127.0.0.1:5500"], credentials: true }),
=======
  cors({
    origin: [CLIENT_ORIGIN, "http://127.0.0.1:5500", "http://127.0.0.1:5501"],
    credentials: true,
  })
>>>>>>> b4ed66a7859ca46242fea49c174321a7d3857b96
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
<<<<<<< HEAD
app.use("/api/ai", aiRoutes);
=======
app.use("/api/posts", postRoutes);
>>>>>>> b4ed66a7859ca46242fea49c174321a7d3857b96

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`),
);
