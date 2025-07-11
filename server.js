require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();

// Configura CORS
app.use(cors());

// Middleware para parsear el cuerpo de las solicitudes POST
app.use(express.json());

// Variable global para el token
let apiToken = null;

// Función para obtener el API_TOKEN
async function obtenerApiToken() {
  try {
    console.log('Intentando obtener API_TOKEN...');
    const response = await fetch('https://cipia-middleware.pegasusgateway.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'peg246@digitalcomtech.com', 
        password: 'Pegasus246!' 
      })
    });

    if (!response.ok) {
      throw new Error(`Error en la autenticación: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Respuesta de autenticación:', data);
    
    // Verificar diferentes estructuras de respuesta posibles
    if (data.token) {
      return data.token;
    } else if (data.access_token) {
      return data.access_token;
    } else if (data.accessToken) {
      return data.accessToken;
    } else {
      console.error('Token no encontrado en la respuesta:', data);
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el API_TOKEN:', error.message);
    return null;
  }
}

// Función para renovar el token si es necesario
async function renovarTokenSiEsNecesario() {
  if (!apiToken) {
    console.log('Token no disponible, obteniendo nuevo token...');
    apiToken = await obtenerApiToken();
    if (apiToken) {
      console.log('API_TOKEN obtenido exitosamente');
    } else {
      console.error('No se pudo obtener el API_TOKEN');
    }
  }
}

// Endpoint para grabar clip usando la placa
app.post('/record', async (req, res) => {
  const { placa } = req.body;
  console.log(`Solicitud recibida para grabar clip de la placa: ${placa}`);
  
  if (!placa) {
    return res.status(400).json({ error: 'Placa es requerida' });
  }

  // Asegurar que tenemos un token válido
  await renovarTokenSiEsNecesario();
  
  if (!apiToken) {
    return res.status(500).json({ error: 'No se pudo obtener el token de autenticación' });
  }

  try {
    // Leer el archivo de mapeo de placas
    const data = await fs.promises.readFile('public/placas.json', 'utf8');
    const placasMap = JSON.parse(data);
    const unitId = placasMap[placa];

    if (!unitId) {
      return res.status(404).json({ error: `Unit ID no encontrado para la placa: ${placa}` });
    }

    console.log(`Grabando clip para Unit ID: ${unitId}`);

    // Realizar la solicitud para grabar el clip
    const url = `https://cipia-middleware.pegasusgateway.com/api/device/${unitId}/record?secondsToRecord=5&source=CABIN`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiToken}`
        // Removemos Content-Type ya que la API no lo acepta
      },
    });

    console.log(`Respuesta de la API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // Si el token expiró, intentar renovarlo
      if (response.status === 401) {
        console.log('Token expirado, renovando...');
        apiToken = await obtenerApiToken();
        if (apiToken) {
          // Reintentar la solicitud con el nuevo token
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${apiToken}`
            },
          });
          
          console.log(`Respuesta del reintento: ${retryResponse.status} ${retryResponse.statusText}`);
          
          if (retryResponse.ok) {
            // Manejar respuesta que puede no ser JSON
            const responseText = await retryResponse.text();
            console.log('Respuesta del servidor:', responseText);
            
            try {
              const retryData = JSON.parse(responseText);
              return res.status(200).json(retryData);
            } catch (e) {
              // Si no es JSON válido, pero la solicitud fue exitosa
              console.log('Respuesta no es JSON válido, pero la solicitud fue exitosa');
              return res.status(200).json({ 
                success: true, 
                message: 'Clip grabado exitosamente',
                response: responseText 
              });
            }
          } else {
            throw new Error(`Error después de renovar token: ${retryResponse.status} ${retryResponse.statusText}`);
          }
        } else {
          throw new Error('No se pudo renovar el token');
        }
      } else {
        throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
      }
    }

    // Manejar respuesta que puede no ser JSON
    const responseText = await response.text();
    console.log('Respuesta del servidor:', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('Clip grabado exitosamente:', responseData);
      res.status(200).json(responseData);
    } catch (e) {
      // Si no es JSON válido, pero la solicitud fue exitosa
      console.log('Respuesta no es JSON válido, pero la solicitud fue exitosa');
      res.status(200).json({ 
        success: true, 
        message: 'Clip grabado exitosamente',
        response: responseText 
      });
    }

  } catch (error) {
    console.error('Error al grabar clip:', error.message);
    res.status(500).json({ error: `Error al grabar el clip: ${error.message}` });
  }
});

// Endpoint para verificar el estado del servidor
app.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    tokenAvailable: !!apiToken,
    timestamp: new Date().toISOString()
  });
});

// Servir archivos estáticos
app.use(express.static('public'));

// Inicializar el servidor
async function iniciarServidor() {
  console.log('Iniciando servidor...');
  
  // Obtener el token al iniciar
  await renovarTokenSiEsNecesario();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Estado del token: ${apiToken ? 'Disponible' : 'No disponible'}`);
  });
}

// Iniciar el servidor
iniciarServidor().catch(console.error); 