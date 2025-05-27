import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Email as EmailIcon
} from '@mui/icons-material';

export default function Terms() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          fontWeight="bold"
          gutterBottom
          sx={{ 
            background: 'linear-gradient(45deg, #3b82f6, #4f46e5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
          }}
        >
          Términos y Condiciones
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label="Versión Alpha" 
            color="warning" 
            variant="outlined"
            icon={<DescriptionIcon />}
          />
          <Chip 
            label="Última actualización: 1 de Mayo 2025" 
            color="info" 
            variant="outlined"
          />
        </Box>
        <Typography variant="h6" color="text.secondary">
          Pulse Journal - Plataforma de Análisis de Tendencias
        </Typography>
      </Box>

      {/* Términos y Condiciones */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DescriptionIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            📄 TÉRMINOS Y CONDICIONES DE USO
          </Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">1. Información general</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Bienvenido a <strong>Pulse Journal</strong>, una plataforma en fase <strong>Alpha</strong> orientada a periodistas, comunicadores, instituciones y personas interesadas en el análisis de tendencias informativas. El acceso se proporciona por invitación y está sujeto a los presentes Términos y Condiciones de uso.
            </Typography>
            <Typography paragraph>
              Pulse Journal es operada por StandatPD, con jurisdicción en <strong>Guatemala</strong>. Para consultas, puedes contactarnos en <strong>support@standatpd.com</strong>.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">2. Estado del servicio (Alpha)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 2 }}>
              La plataforma se encuentra en <strong>fase de desarrollo (Alpha)</strong>
            </Alert>
            <Typography component="div">
              Esto significa que:
              <ul>
                <li>Puede presentar errores, fallos o interrupciones.</li>
                <li>Las funcionalidades pueden cambiar sin previo aviso.</li>
                <li>Los datos ofrecidos pueden estar en constante ajuste o prueba.</li>
                <li>No se garantiza continuidad ni soporte técnico formal en esta etapa.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">3. Acceso y registro</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>El acceso está limitado a usuarios invitados o aprobados por el equipo de Pulse Journal.</li>
                <li>Al registrarte, aceptas proporcionar información veraz y mantener la confidencialidad de tus credenciales.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">4. Descripción del servicio</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Pulse Journal permite:</Typography>
            <Typography component="div">
              <ul>
                <li>Analizar publicaciones en redes sociales.</li>
                <li>Identificar tendencias y generar insights.</li>
                <li>Usar modelos de IA para contextualización de temas y storytelling.</li>
                <li>Consultar librerías informativas con datos agregados.</li>
                <li>Generar contenido periodístico con apoyo técnico.</li>
              </ul>
            </Typography>
            <Typography paragraph>
              Estas funcionalidades pueden conectarse a servicios de terceros como <strong>Supabase, Perplexity, OpenAI y Google Drive</strong>, que pueden tener sus propias políticas de uso y privacidad.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">5. Uso gratuito y créditos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Durante la fase Alpha, el acceso es gratuito bajo invitación. Sin embargo, algunas funcionalidades pueden estar limitadas por uso de <strong>créditos</strong>. En el futuro, ciertos servicios podrán requerir pago adicional. El uso indebido del sistema puede resultar en suspensión del acceso.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">6. Datos recolectados</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Recolectamos y procesamos los siguientes datos de los usuarios:</Typography>
            <Typography component="div">
              <ul>
                <li>Nombre y correo electrónico</li>
                <li>Número de teléfono (si se proporciona)</li>
                <li>Cookies para análisis de navegación</li>
                <li>Logs de uso y actividad dentro de la plataforma</li>
              </ul>
            </Typography>
            <Typography paragraph>
              Esta información se utiliza para mejorar el servicio y no se comparte con terceros sin consentimiento expreso, salvo por obligación legal.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">7. Uso aceptable</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Queda prohibido:</Typography>
            <Typography component="div">
              <ul>
                <li>Reproducir o distribuir partes del contenido generado sin autorización.</li>
                <li>Utilizar ingeniería inversa sobre la plataforma o sus modelos.</li>
                <li>Automatizar solicitudes masivas o realizar scraping no autorizado.</li>
                <li>Usar Pulse Journal con fines ilegales, difamatorios o para difundir desinformación.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">8. Propiedad intelectual</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Todos los derechos sobre el software, diseño y arquitectura de Pulse Journal pertenecen a sus desarrolladores. Los datos generados por el usuario le pertenecen, pero la plataforma se reserva derechos sobre el entorno de análisis y visualización.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">9. Limitación de responsabilidad</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Pulse Journal no se hace responsable por:</Typography>
            <Typography component="div">
              <ul>
                <li>Pérdidas derivadas del uso de información incorrecta, incompleta o desactualizada.</li>
                <li>Daños causados por interrupciones del servicio.</li>
                <li>Decisiones tomadas por el usuario basadas en los contenidos generados durante esta fase de prueba.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">10. Modificaciones</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Se notificará a los usuarios registrados mediante correo electrónico o aviso dentro de la plataforma.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">11. Legislación aplicable</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Estos Términos se rigen por las leyes de <strong>Guatemala</strong>, sin perjuicio de los derechos que puedan corresponderte según otras jurisdicciones.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Política de Privacidad */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            🔐 POLÍTICA DE PRIVACIDAD
          </Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">1. Introducción</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              En <strong>Pulse Journal</strong>, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta Política explica qué información recopilamos, cómo la usamos y con quién la compartimos mientras utilizas nuestra plataforma, actualmente en fase <strong>Alpha</strong>.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">2. Responsable del tratamiento</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              La plataforma es operada por <strong>StandatPD</strong>, bajo jurisdicción de <strong>Guatemala</strong>. Si tienes preguntas o deseas ejercer tus derechos sobre tus datos, puedes contactarnos en <strong>support@standatpd.com</strong>.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">3. Información que recolectamos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Durante tu uso de Pulse Journal, podemos recopilar los siguientes datos:</Typography>
            <Typography component="div">
              <ul>
                <li><strong>Datos de identificación</strong>: nombre, correo electrónico, número de teléfono (si lo proporcionas).</li>
                <li><strong>Datos técnicos</strong>: tipo de navegador, dirección IP, sistema operativo.</li>
                <li><strong>Datos de uso</strong>: actividad dentro de la plataforma, interacciones, errores, y logs de navegación.</li>
                <li><strong>Cookies</strong>: empleadas para análisis interno y mejora de la experiencia de usuario.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">4. Finalidades del tratamiento</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Utilizamos tus datos para:</Typography>
            <Typography component="div">
              <ul>
                <li>Permitir y gestionar tu acceso a la plataforma.</li>
                <li>Analizar el uso del sistema para mejorar nuestras funcionalidades.</li>
                <li>Generar estadísticas internas y detectar fallos.</li>
                <li>Contactarte con fines técnicos o administrativos.</li>
                <li>Cumplir con requisitos legales aplicables.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">5. Uso de servicios de terceros</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Pulse Journal se conecta con herramientas de terceros como <strong>Supabase, Perplexity, OpenAI y Google Drive</strong>. Estas plataformas pueden recopilar información de acuerdo con sus propias políticas de privacidad, ajenas a nuestro control directo.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">6. Compartición de datos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>No compartimos tu información con terceros, salvo:</Typography>
            <Typography component="div">
              <ul>
                <li>Que nos brindes tu consentimiento expreso.</li>
                <li>Que sea necesario para cumplir con obligaciones legales.</li>
                <li>Que se requiera para el funcionamiento técnico del servicio (por ejemplo, almacenamiento en la nube).</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">7. Seguridad</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Adoptamos medidas razonables para proteger tus datos contra pérdida, acceso no autorizado, alteración o divulgación. Sin embargo, al estar en fase Alpha, no podemos garantizar una seguridad total.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">8. Retención de datos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Conservaremos tus datos mientras mantengas una cuenta activa en Pulse Journal, o mientras sea necesario para fines de desarrollo, legales o administrativos. Puedes solicitar su eliminación escribiéndonos a <strong>support@standatpd.com</strong>.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">9. Tus derechos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>De acuerdo con la legislación aplicable, puedes ejercer los siguientes derechos:</Typography>
            <Typography component="div">
              <ul>
                <li>Acceder a tus datos.</li>
                <li>Solicitar correcciones o actualizaciones.</li>
                <li>Solicitar la eliminación de tu cuenta y datos personales.</li>
                <li>Retirar tu consentimiento cuando lo desees.</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">10. Cambios a esta política</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Podemos actualizar esta Política en cualquier momento. Notificaremos los cambios relevantes a través de la plataforma o por correo electrónico si eres un usuario registrado.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Contacto */}
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <EmailIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" component="h3" fontWeight="bold">
            📬 Contacto
          </Typography>
        </Box>
        <Typography variant="h6" color="primary.main">
          support@standatpd.com
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Para consultas, soporte técnico o ejercicio de derechos sobre tus datos
        </Typography>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Footer */}
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          © 2025 StandatPD - Pulse Journal. Todos los derechos reservados.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Versión Alpha - Documento actualizado el 1 de Mayo de 2025
        </Typography>
      </Box>
    </Container>
  );
} 