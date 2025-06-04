# 📧 Configuración del Backend para Envío de Emails

## ⚠️ **Estado Actual**
Actualmente el sistema está **simulando** el envío de emails. Para enviar emails reales, necesitas implementar un backend.

## 🔧 **Opciones de Implementación**

### **Opción 1: API Backend con Node.js + Nodemailer (Recomendado)**

#### 1. Crear endpoint `/api/send-email`
```javascript
// pages/api/send-email.js (Next.js) o routes/email.js (Express)
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, text, smtp, from } = req.body;

  try {
    // Crear transporter con configuración SMTP del usuario
    const transporter = nodemailer.createTransporter({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.auth.user,
        pass: smtp.auth.pass
      }
    });

    // Enviar email
    await transporter.sendMail({
      from: `${from.name} <${from.email}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    });

    res.status(200).json({ success: true, message: 'Email enviado' });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

#### 2. Endpoint para probar SMTP `/api/test-email`
```javascript
// pages/api/test-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  const { smtp, from, to } = req.body;

  try {
    const transporter = nodemailer.createTransporter({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth
    });

    // Verificar conexión
    await transporter.verify();

    // Enviar email de prueba
    await transporter.sendMail({
      from: `${from.name} <${from.email}>`,
      to: to,
      subject: 'Prueba SMTP - PulseJournal',
      html: req.body.html,
      text: req.body.text
    });

    res.status(200).json({ 
      success: true, 
      message: 'SMTP configurado correctamente' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

#### 3. Instalar dependencias
```bash
npm install nodemailer
npm install @types/nodemailer  # Si usas TypeScript
```

### **Opción 2: EmailJS (Frontend sin backend)**

#### 1. Configurar EmailJS
```javascript
// En AdminPanel.tsx, descomenta la línea de EmailJS:
await emailjs.send('service_id', 'template_id', emailData, 'public_key');
```

#### 2. Instalar EmailJS
```bash
npm install emailjs-com
```

#### 3. Configurar en EmailJS dashboard
1. Crear cuenta en [EmailJS](https://www.emailjs.com/)
2. Configurar servicio SMTP
3. Crear template
4. Obtener service_id, template_id y public_key

### **Opción 3: Servicios de Email (Recomendado para producción)**

#### SendGrid
```javascript
// pages/api/send-email-sendgrid.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  const { to, subject, html, from } = req.body;

  try {
    await sgMail.send({
      to: to,
      from: from.email,
      subject: subject,
      html: html
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### Resend
```javascript
// pages/api/send-email-resend.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const { to, subject, html, from } = req.body;

  try {
    await resend.emails.send({
      from: from.email,
      to: to,
      subject: subject,
      html: html
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 🔐 **Variables de Entorno**

Crea un archivo `.env.local`:
```bash
# Solo si usas servicios de email
SENDGRID_API_KEY=tu_api_key_aqui
RESEND_API_KEY=tu_api_key_aqui
MAILGUN_API_KEY=tu_api_key_aqui

# Para seguridad adicional
ALLOWED_ORIGINS=http://localhost:3000,https://tudominio.com
```

## 📝 **Activar el Backend**

Una vez que tengas el backend configurado:

1. **Descomenta las líneas en `AdminPanel.tsx`:**
```javascript
// En sendSingleEmail(), descomenta:
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(emailData)
});

if (!response.ok) {
  const error = await response.text();
  throw new Error(error);
}

// En testEmailConfig(), descomenta:
const response = await fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testEmailData)
});
```

2. **Comenta las líneas de simulación:**
```javascript
// Comenta estas líneas:
// await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
// if (Math.random() < 0.05) throw new Error('Error simulado...');
```

## 🚀 **Configuraciones SMTP Comunes**

### Gmail
- Host: `smtp.gmail.com`
- Puerto: `587` (TLS) o `465` (SSL)
- Usuario: tu email de Gmail
- Contraseña: App Password (no tu contraseña normal)

### Outlook/Hotmail
- Host: `smtp-mail.outlook.com`
- Puerto: `587`
- Usuario: tu email completo
- Contraseña: tu contraseña

### Custom SMTP
- Consulta con tu proveedor de hosting

## ✅ **Testing**

1. Configura tu SMTP en la interfaz
2. Presiona "Probar SMTP"
3. Revisa tu email para confirmar
4. Si funciona, ya puedes enviar emails masivos

## 🔒 **Seguridad**

⚠️ **IMPORTANTE**: Nunca expongas credenciales SMTP en el frontend. El sistema actual las maneja en el backend por seguridad.

- Las credenciales se envían al backend para cada envío
- No se almacenan permanentemente en el servidor
- Se validan antes de cada envío 