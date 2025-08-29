import jwt from "jsonwebtoken";

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const refreshToken = req.cookies.refreshToken; // ✅ CORRECT // Refresh token stored in cookies

  console.log("Cookies Received:", authHeader);
  console.log("here again here")
  console.log("cookies", req.cookies);
  console.log("Refresh Token:", refreshToken);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token required" });
  }

  const accessToken = authHeader.split(" ")[1];

  // 🔑 Verify the access token
  jwt.verify(accessToken, process.env.ACCESS_SECRET, (err, decoded) => {
    if (!err) {
      req.user = decoded;
      return next(); // ✅ Access token is valid → Proceed
    }

    if (err.name !== "TokenExpiredError") {
      console.error("Invalid access token:", err);
      return res.status(403).json({ message: "Invalid access token" });
    }

    console.log("Access token expired, checking refresh token...");

    // 🔁 Handle Refresh Token
    if (!refreshToken) {
      return res.status(403).json({ message: "Refresh token required" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decodedRefresh) => {
      if (err) {
        console.error("Refresh Token Error:", err);
        return res.status(403).json({ message: "Refresh token expired, please log in again" });
      }

      // ♻️ Generate new tokens
      const newAccessToken = jwt.sign(
        { id: decodedRefresh.id },
        process.env.ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      const newRefreshToken = jwt.sign(
        { id: decodedRefresh.id },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // 🍪 Update cookies and headers
      res.setHeader("Authorization", `Bearer ${newAccessToken}`);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false, // ✅ Set to "true" in production
         sameSite: "Lax",
       path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ accessToken: newAccessToken });

      console.log("Refresh Token Set in Cookies:", newRefreshToken);

      req.user = decodedRefresh;
      next(); // ✅ Proceed to protected route
    });
  });
};

export default authenticateUser;