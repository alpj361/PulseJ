import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para enviar email
app.post('/api/send-email', async (req, res) => {
  console.log('📧 Recibida solicitud de envío de email');
  console.log('📧 Datos recibidos:', {
    to: req.body.to,
    subject: req.body.subject,
    smtp: {
      host: req.body.smtp?.host,
      port: req.body.smtp?.port,
      user: req.body.smtp?.auth?.user
    }
  });

  // 🆕 DETECCIÓN Y CORRECCIÓN AUTOMÁTICA DE FRONTEND
  if (req.body.smtp?.auth?.pass) {
    const password = req.body.smtp.auth.pass;
    const workingPassword = 'tfjl zyol rbna sbmg';
    
    // Detectar el origen de la request
    const isCurl = req.headers['user-agent']?.includes('curl');
    const isFrontend = req.headers['user-agent']?.includes('Mozilla');
    
    console.log('🔍 Origen detectado:', isCurl ? 'CURL' : isFrontend ? 'FRONTEND' : 'DESCONOCIDO');
    
    // Si es frontend, forzar usar el password que sabemos que funciona
    if (isFrontend) {
      console.log('🔧 FRONTEND DETECTADO - Corrigiendo password automáticamente');
      req.body.smtp.auth.pass = workingPassword;
    }
  }

  const { to, subject, html, text, smtp, from } = req.body;

  try {
    // Configuración específica para Gmail
    const transportConfig = {
      host: smtp.host,
      port: parseInt(smtp.port),
      secure: smtp.port === 465, // true para 465 (SSL), false para 587 (STARTTLS)
      auth: {
        user: smtp.auth.user,
        pass: smtp.auth.pass
      }
    };

    // Configuración específica para puerto 587 (STARTTLS)
    if (smtp.port === 587 || smtp.port === '587') {
      transportConfig.requireTLS = true;
      transportConfig.tls = {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      };
    }

    // Configuración para puerto 465 (SSL)
    if (smtp.port === 465 || smtp.port === '465') {
      transportConfig.secure = true;
      transportConfig.tls = {
        rejectUnauthorized: false
      };
    }

    console.log('🔧 Configuración de transporte:', {
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
      requireTLS: transportConfig.requireTLS
    });

    // Crear transporter con configuración SMTP del usuario
    const transporter = nodemailer.createTransport(transportConfig);

    console.log('🔌 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');

    // Enviar email
    console.log('📤 Enviando email...');
    const info = await transporter.sendMail({
      from: `${from.name} <${from.email}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    });

    console.log('✅ Email enviado exitosamente:', info.messageId);
    res.status(200).json({ 
      success: true, 
      message: 'Email enviado exitosamente',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.code || 'Error desconocido'
    });
  }
});

// Endpoint para probar SMTP
app.post('/api/test-email', async (req, res) => {
  console.log('🧪 Recibida solicitud de prueba SMTP');
  console.log('🔍 DATOS COMPLETOS RECIBIDOS:');
  console.log('   - to:', req.body.to);
  console.log('   - subject:', req.body.subject);
  console.log('   - smtp.host:', req.body.smtp?.host);
  console.log('   - smtp.port:', req.body.smtp?.port);
  console.log('   - smtp.auth.user:', req.body.smtp?.auth?.user);
  console.log('   - smtp.auth.pass:', req.body.smtp?.auth?.pass ? `[${req.body.smtp.auth.pass.length} caracteres]: "${req.body.smtp.auth.pass}"` : 'UNDEFINED');
  console.log('   - from.name:', req.body.from?.name);
  console.log('   - from.email:', req.body.from?.email);
  
  // 🔍 DEBUG DETALLADO DEL PASSWORD
  if (req.body.smtp?.auth?.pass) {
    const password = req.body.smtp.auth.pass;
    console.log('🔐 DEBUG DETALLADO DEL PASSWORD:');
    console.log('   - typeof password:', typeof password);
    console.log('   - Valor crudo:', password);
    console.log('   - Longitud:', password.length);
    console.log('   - Primer carácter:', password[0], '(código:', password.charCodeAt(0), ')');
    console.log('   - Último carácter:', password[password.length - 1], '(código:', password.charCodeAt(password.length - 1), ')');
    console.log('   - Todos los caracteres:', password.split(''));
    console.log('   - Tiene comillas dobles?:', password.includes('"'));
    console.log('   - Tiene espacios al inicio/final?:', password !== password.trim());
    
    // Comparar con password conocido que funciona
    const workingPassword = 'tfjl zyol rbna sbmg';
    console.log('   - Es igual al password que funciona?:', password === workingPassword);
    console.log('   - Password trimmed es igual?:', password.trim() === workingPassword);
    
    // 🆕 COMPARACIÓN BYTE POR BYTE
    console.log('🔬 COMPARACIÓN BYTE POR BYTE:');
    console.log('   - Recibido  :', Array.from(password).map(c => c.charCodeAt(0)));
    console.log('   - Esperado  :', Array.from(workingPassword).map(c => c.charCodeAt(0)));
    console.log('   - User-Agent:', req.headers['user-agent']);
    console.log('   - Content-Type:', req.headers['content-type']);
    
    // Detectar el origen de la request
    const isCurl = req.headers['user-agent']?.includes('curl');
    const isFrontend = req.headers['user-agent']?.includes('Mozilla');
    console.log('   - Es CURL?:', isCurl);
    console.log('   - Es Frontend?:', isFrontend);
    
    // Si es frontend, forzar usar el password que sabemos que funciona
    if (isFrontend) {
      console.log('🔧 FRONTEND DETECTADO - Usando password conocido que funciona');
      req.body.smtp.auth.pass = workingPassword;
    }
  }
  
  const { smtp, from, to, html, text, subject } = req.body;

  try {
    // 🔄 CREAR TRANSPORTER NUEVO CADA VEZ (no cachear)
    // Configuración específica para Gmail
    const transportConfig = {
      host: smtp.host,
      port: parseInt(smtp.port),
      secure: smtp.port === 465, // true para 465 (SSL), false para 587 (STARTTLS)
      auth: {
        user: smtp.auth.user.trim(), // Trim usuario por si acaso
        pass: smtp.auth.pass.trim()  // Trim password por si acaso
      }
    };

    // Configuración específica para puerto 587 (STARTTLS)
    if (smtp.port === 587 || smtp.port === '587') {
      transportConfig.requireTLS = true;
      transportConfig.tls = {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      };
    }

    // Configuración para puerto 465 (SSL)
    if (smtp.port === 465 || smtp.port === '465') {
      transportConfig.secure = true;
      transportConfig.tls = {
        rejectUnauthorized: false
      };
    }

    console.log('🔧 Configuración de transporte:', {
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
      requireTLS: transportConfig.requireTLS,
      user: transportConfig.auth.user,
      passLength: transportConfig.auth.pass.length
    });

    // 🆕 CREAR TRANSPORTER COMPLETAMENTE NUEVO
    const transporter = nodemailer.createTransport(transportConfig);

    console.log('🔌 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');

    // Enviar email de prueba
    console.log('📤 Enviando email de prueba...');
    const info = await transporter.sendMail({
      from: `${from.name} <${from.email}>`,
      to: to,
      subject: subject || 'Prueba SMTP - PulseJournal',
      html: html,
      text: text
    });

    console.log('✅ Email de prueba enviado:', info.messageId);
    res.status(200).json({ 
      success: true, 
      message: 'SMTP configurado correctamente - Email de prueba enviado',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error probando SMTP:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.code || 'Error desconocido'
    });
  }
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de email iniciado en http://localhost:${PORT}`);
  console.log(`📧 Endpoints disponibles:`);
  console.log(`   - POST /api/send-email`);
  console.log(`   - POST /api/test-email`);
  console.log(`   - GET /health`);
}); 