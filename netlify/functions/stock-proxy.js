// netlify/functions/stock-proxy.js
const fetch = require('node-fetch'); // Importa la librería para hacer peticiones HTTP

// Esta es la función principal que Netlify ejecutará cuando reciba una solicitud
exports.handler = async function(event, context) {
  // Obtenemos el "symbol" (símbolo de la acción, ej: AAPL) de los parámetros de la URL
  const { symbol } = event.queryStringParameters;
  // Obtenemos tu clave de API de Alpha Vantage de las variables de entorno de Netlify (¡más seguro!)
  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

  // Paso de seguridad: Comprobamos si se proporcionó un símbolo de acción
  if (!symbol) {
    return {
      statusCode: 400, // Código de estado HTTP para "Solicitud incorrecta"
      body: JSON.stringify({ error: 'Stock symbol is required.' }) // Mensaje de error
    };
  }

  // Paso de seguridad: Comprobamos si la API Key está configurada
  if (!ALPHA_VANTAGE_API_KEY) {
    return {
      statusCode: 500, // Código de estado HTTP para "Error interno del servidor"
      body: JSON.stringify({ error: 'Alpha Vantage API Key not configured.' }) // Mensaje de error
    };
  }

  try {
    // Construimos la URL para la API de Alpha Vantage
    // 'GLOBAL_QUOTE' es la función que obtiene los datos de una acción
    const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=<span class="math-inline">\{symbol\}&apikey\=</span>{ALPHA_VANTAGE_API_KEY}`;

    // Hacemos la petición a la API de Alpha Vantage
    const response = await fetch(apiUrl);
    const data = await response.json(); // Convertimos la respuesta a formato JSON

    // Verificamos si Alpha Vantage devuelve un error o no encuentra datos
    if (data["Error Message"] || data["Note"]) {
      console.error("Alpha Vantage API Error:", data); // Registramos el error en los logs de Netlify
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data["Error Message"] || data["Note"] || 'Error fetching data from Alpha Vantage.' })
      };
    }

    // Accedemos a la parte de los datos de la cotización global
    const globalQuote = data["Global Quote"];

    // Si no hay datos de cotización global, significa que no se encontró la acción
    if (!globalQuote || Object.keys(globalQuote).length === 0) {
        return {
            statusCode: 404, // Código de estado HTTP para "No encontrado"
            body: JSON.stringify({ error: `No data found for symbol: ${symbol}` })
        };
    }

    // Si todo va bien, devolvemos los datos de la acción
    return {
      statusCode: 200, // Código de estado HTTP para "Éxito"
      headers: {
        // Estos encabezados son importantes para permitir que tu frontend (en otro dominio) acceda a esta función
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json" // Indicamos que la respuesta es JSON
      },
      body: JSON.stringify(globalQuote) // Convertimos los datos a cadena JSON para enviarlos
    };
  } catch (error) {
    // Capturamos cualquier error que ocurra durante la petición
    console.error("Proxy function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch stock data.', details: error.message })
    };
  }
};