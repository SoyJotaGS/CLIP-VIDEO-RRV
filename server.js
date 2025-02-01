const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Configura CORS
app.use(cors());

// Middleware para parsear el cuerpo de las solicitudes POST
app.use(express.json());

// Proxy para el login
app.post('/proxy/login', async (req, res) => {
  const url = 'https://cipia-middleware.pegasusgateway.com/api/auth/login';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor proxy' });
  }
});

// Proxy para grabar un clip
app.post('/proxy/record/:unitId', async (req, res) => {
  const { unitId } = req.params;
  const url = `https://cipia-middleware.pegasusgateway.com/api/device/${unitId}/record?secondsToRecord=5&source=CABIN`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: req.headers.authorization },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor proxy' });
  }
});

// Servir archivos estáticos
app.use(express.static('public'));

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor proxy corriendo en http://localhost:${PORT}`);
});