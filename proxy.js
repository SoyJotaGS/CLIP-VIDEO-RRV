const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir CORS
app.use(cors());
app.use(express.json());

const API_LOGIN_URL = "https://cipia-middleware.pegasusgateway.com/api/auth/login";
const API_RECORD_URL = "https://cipia-middleware.pegasusgateway.com/api/device";

// Endpoint para login
app.post("/api/login", async (req, res) => {
  try {
    const response = await axios.post(API_LOGIN_URL, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Error interno del proxy" });
  }
});

// Endpoint para grabar clip
app.post("/api/record", async (req, res) => {
  const { unitId, token } = req.body;
  try {
    const response = await axios.post(
      `${API_RECORD_URL}/${unitId}/record?secondsToRecord=5&source=CABIN`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Error al grabar el clip" });
  }
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Proxy corriendo en http://localhost:${PORT}`));
