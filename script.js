const API_LOGIN_URL = "https://cipia-middleware.pegasusgateway.com/api/auth/login";
const API_RECORD_URL = "https://cipia-middleware.pegasusgateway.com/api/device";
const API_EMAIL = "peg246@digitalcomtech.com"; // Cambia a tus credenciales
const API_PASSWORD = "Pegasus246!"; // Cambia a tus credenciales

const vehicles = [
  // Lista de vehículos (placas y Unit ID)
    {plate:"BNB-722", unitId:"E321380010" },
    {plate:"BES-901", unitId:"E321180197" },
    {plate:"BBF-859", unitId:"E424340775" },
    {plate:"BES-916", unitId:"E424340793" },
    {plate:"BEQ-816", unitId:"E321370212" },
    {plate:"BER-892", unitId:"E321380535" },
    {plate:"BES-876", unitId:"E321380165" },
    {plate:"BES-903", unitId:"E424340761" },
    {plate:"BRY-925", unitId:"E321370149" },
    {plate:"BND-840", unitId:"E321361064" },
    {plate:"BBW-889", unitId:"E321180215" },
    {plate:"BNB-764", unitId:"E321361151" },
    {plate:"BCU-744", unitId:"E321180099" },
    {plate:"BCL-903", unitId:"E424340781" },
    {plate:"BFN-726", unitId:"E424380905" },
    {plate:"BER-776", unitId:"E321370226" },
    {plate:"BFU-811", unitId:"E424340849" },
    {plate:"BNB-802", unitId:"E321380162" },
    {plate:"BES-877", unitId:"E321370080" },
    {plate:"CBM-726", unitId:"E424380897" },
    {plate:"BNB-886", unitId:"E321380394" },
    {plate:"BES-910", unitId:"E321180182" },
    {plate:"CBM-731", unitId:"E424380765" },
    {plate:"BNE-736", unitId:"E321360959" },
    {plate:"BNE-774", unitId:"E321360973" },
    {plate:"BER-775", unitId:"E321370198" },
    {plate:"BNC-840", unitId:"E321360886" },
    {plate:"BKB-842", unitId:"E321180174" },
    {plate:"BET-810", unitId:"E321180168" },
    {plate:"BRY-783", unitId:"E321380890" },
    {plate:"BNB-888", unitId:"E321370164" },
    {plate:"BNC-841", unitId:"E321360951" },
    {plate:"BNB-865", unitId:"E321370195" },
    {plate:"BBS-713", unitId:"E321180203" },
    {plate:"BNV-788", unitId:"E321380705" },
    {plate:"BES-892", unitId:"E321370219" },
    {plate:"BNB-867", unitId:"E321370235" },
    {plate:"CBM-750", unitId:"E424380987" },
    {plate:"CBM-745", unitId:"E424300548" },
    {plate:"AJB-783", unitId:"E321380595" },
    {plate:"CBL-936", unitId:"E424380805" },
    {plate:"BNC-810", unitId:"E321361067" },
    {plate:"CBL-934", unitId:"E424300531" },
    {plate:"BNG-720", unitId:"E321380680" },
    {plate:"CBL-938", unitId:"E424380800" },
    {plate:"BNB-767", unitId:"E321370236" },
    {plate:"BNB-720", unitId:"E321380430" },
    {plate:"CBM-732", unitId:"E424380790" },
    {plate:"CBL-766", unitId:"E424380760" },
    {plate:"CBL-874", unitId:"E321381118" },
    {plate:"CBM-749", unitId:"E424380815" },
    {plate:"CBL-844", unitId:"E424380853" },
    {plate:"CBL-843", unitId:"E424380892" },
    {plate:"CBL-865", unitId:"E424380784" },
    {plate:"CBM-801", unitId:"E424380775" },
    {plate:"CBM-720", unitId:"E424380858" },
    {plate:"BNI-725", unitId:"E321380385" },
    {plate:"BBX-703", unitId:"E321380896" },
    {plate:"BER-802", unitId:"E321370110" },
    {plate:"CBL-796", unitId:"E424380891" },
    {plate:"CAI-918", unitId:"E321180105" },
    {plate:"CBL-877", unitId:"E424300579" },
    {plate:"CBL-864", unitId:"E424300507" },
    {plate:"BCC-701", unitId:"E321370033" },

      // Agrega más placas y Unit ID aquí
];

// Función para iniciar sesión y obtener el token
async function login() {
  console.log("Iniciando sesión...");
  try {
    const response = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: API_EMAIL, password: API_PASSWORD }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error en login: ${response.status} - ${errorData.message || "Desconocido"}`);
    }

    const data = await response.json();
    return data.token;
  } catch (err) {
    console.error("Error al iniciar sesión:", err.message);
    alert(`Error al iniciar sesión: ${err.message}`);
    return null;
  }
}

// Función para grabar un clip usando el Unit ID
async function grabarClip(unitId) {
  const token = await login();
  if (!token) return;

  const url = `${API_RECORD_URL}/${unitId}/record?secondsToRecord=5&source=CABIN`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      alert(`¡Clip grabado exitosamente para Unit ID: ${unitId}!`);
    } else {
      const errorData = await response.json();
      alert(`Error al grabar el clip: ${errorData.message || "Desconocido"}`);
    }
  } catch (err) {
    console.error("Error al grabar clip:", err.message);
    alert("Error al comunicarse con el API externo.");
  }
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al realizar la solicitud:", error.message);
    alert("Error al iniciar sesión: " + error.message);
  }
}
// Evento para buscar vehículo por placa
document.getElementById("search-vehicle").addEventListener("click", () => {
  const plate = document.getElementById("search-plate").value.toUpperCase();
  const vehicle = vehicles.find(v => v.plate.toUpperCase() === plate);

  const vehicleInfo = document.getElementById("vehicle-info");
  const vehicleList = document.getElementById("vehicle-list");

  // Limpiar mensajes y lista
  vehicleInfo.textContent = "";
  vehicleList.innerHTML = "";

  if (vehicle) {
    // Mostrar mensaje de vehículo encontrado
    vehicleInfo.textContent = `Vehículo encontrado: Placa ${vehicle.plate}, Unit ID ${vehicle.unitId}`;
    
    // Agregar botón para grabar clip
    const li = document.createElement("li");
    li.innerHTML = `
      Placa: ${vehicle.plate}
      <button onclick="grabarClip('${vehicle.unitId}')">Grabar Clip</button>
    `;
    vehicleList.appendChild(li);
  } else {
    // Mostrar mensaje si no se encuentra el vehículo
    vehicleInfo.textContent = "Vehículo no encontrado.";
  }
});