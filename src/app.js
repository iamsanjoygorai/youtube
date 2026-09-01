import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import videoRoutes from "./routes/video.routes.js";
import likeRoutes from "./routes/like.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import userRoutes from "./routes/user.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

const app = express();

app.use(
cors({
origin: "http://localhost:5173",
credentials: true,
})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
res.status(200).json({
success: true,
message: "YouTube Clone API is running",
});
});


app.get("/api/test-video", (req, res) => {
res.json({
success: true,
message: "This is the current app.js",
});
});

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/videos", likeRoutes);
app.use("/api", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api", subscriptionRoutes);

export default app;
