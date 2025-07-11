const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
const CONFIG = {
    API_CREDENTIALS: {
        email: 'peg246@digitalcomtech.com',
        password: 'Pegasus246!'
    },
    API_URLS: {
        login: 'https://cipia-middleware.pegasusgateway.com/api/auth/login',
        record: 'https://cipia-middleware.pegasusgateway.com/api/device/{unitId}/record?secondsToRecord=5&source=CABIN'
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ruta principal para servir el HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'standalone.html'));
});

// Variable global para el token
let apiToken = null;

// Función para obtener token
async function obtenerApiToken() {
    try {
        console.log('🔐 Obteniendo API_TOKEN...');
        const response = await fetch(CONFIG.API_URLS.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CONFIG.API_CREDENTIALS)
        });

        if (!response.ok) {
            throw new Error(`Error en autenticación: ${response.status}`);
        }

        const data = await response.json();
        return data.token || data.access_token || data.accessToken || null;
    } catch (error) {
        console.error('❌ Error al obtener token:', error.message);
        return null;
    }
}

// Endpoint para verificar estado
app.get('/api/status', async (req, res) => {
    if (!apiToken) {
        apiToken = await obtenerApiToken();
    }
    
    res.json({
        status: 'OK',
        tokenAvailable: !!apiToken,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para grabar clip
app.post('/api/record', async (req, res) => {
    try {
        const { placa } = req.body;
        
        if (!placa) {
            return res.status(400).json({ error: 'Placa es requerida' });
        }

        // Leer mapeo de placas
        const placasData = fs.readFileSync('placas.json', 'utf8');
        const placasMap = JSON.parse(placasData);
        const unitId = placasMap[placa];

        if (!unitId) {
            return res.status(404).json({ error: `Unit ID no encontrado para la placa: ${placa}` });
        }

        // Asegurar que tenemos token
        if (!apiToken) {
            apiToken = await obtenerApiToken();
        }

        if (!apiToken) {
            return res.status(500).json({ error: 'No se pudo obtener token de autenticación' });
        }

        // Grabar clip
        const url = CONFIG.API_URLS.record.replace('{unitId}', unitId);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiToken}` }
        });

        console.log(`📡 Respuesta API: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado, renovar
                apiToken = await obtenerApiToken();
                if (apiToken) {
                    const retryResponse = await fetch(url, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${apiToken}` }
                    });
                    
                    if (retryResponse.ok) {
                        const responseText = await retryResponse.text();
                        try {
                            const data = JSON.parse(responseText);
                            return res.json(data);
                        } catch (e) {
                            return res.json({ success: true, message: 'Clip grabado exitosamente' });
                        }
                    }
                }
            }
            throw new Error(`Error en API: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        try {
            const data = JSON.parse(responseText);
            res.json(data);
        } catch (e) {
            res.json({ success: true, message: 'Clip grabado exitosamente' });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Inicializar servidor
async function iniciarServidor() {
    console.log('🚀 Iniciando servidor...');
    
    // Obtener token inicial
    apiToken = await obtenerApiToken();
    
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`🔐 Token: ${apiToken ? 'Disponible' : 'No disponible'}`);
    });
}

iniciarServidor(); 