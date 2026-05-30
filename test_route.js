const { POST } = require('./src/app/api/auth/login/route.js');
const req = {
  json: async () => ({ correo: 'admin@serenotario.com', clave: 'admin123' })
};
POST(req).then(res => {
  console.log('Result:', res);
}).catch(console.error);
