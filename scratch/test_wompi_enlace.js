async function testCreateLink() {
  try {
    const payload = {
      monto: 1.00,
      nombreProducto: "Prueba Wompi 1 Dólar",
      descripcionProducto: "Prueba de integración",
      usuarioId: 999,
      // urlRedirect: "https://mi-dominio.com/exito" // Opcional, si no, usa DB
    };

    const response = await fetch('http://localhost:3002/api/pagos/wompi/enlace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Respuesta del servidor:", JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("Error ejecutando prueba:", error);
  }
}

testCreateLink();
