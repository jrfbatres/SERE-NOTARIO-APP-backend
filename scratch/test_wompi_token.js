import { getWompiToken } from '../src/lib/wompi.js';

async function test() {
  try {
    console.log('Testing Wompi Authentication...');
    const token = await getWompiToken();
    console.log('Token obtenido exitosamente:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
