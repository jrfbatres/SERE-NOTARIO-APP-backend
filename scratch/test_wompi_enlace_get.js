async function testGetLink() {
  const enlaceId = "3746696"; // El ID devuelto en tu prueba anterior

  try {
    const response = await fetch(`http://localhost:3002/api/pagos/wompi/enlace/${enlaceId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    console.log("Respuesta de Wompi al consultar el enlace:", JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("Error ejecutando prueba:", error);
  }
}

testGetLink();
