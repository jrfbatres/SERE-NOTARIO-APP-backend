const http = require('http');

http.get('http://localhost:3000/api/nodos/mapa?root=1', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log("API Response Success:", data.success);
      if (data.success) {
        console.log("Root Node properties:");
        console.log("ID:", data.data.id);
        console.log("Nombre:", data.data.nombre);
        console.log("Ley ID:", data.data.ley_id);
        console.log("Audio 1:", data.data.audio_1);
        console.log("Audio 2:", data.data.audio_2);
      }
    } catch (err) {
      console.error("Failed to parse response:", err);
      console.log("Raw body:", body);
    }
  });
}).on('error', console.error);
