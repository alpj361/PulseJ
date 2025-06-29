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
  Shield as PrivacyIcon,
  Security as SecurityIcon,
  DataUsage as DataUsageIcon
} from '@mui/icons-material';

export default function Privacy() {
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
          Política de Privacidad
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label="Versión Alpha" 
            color="warning" 
            variant="outlined"
            icon={<PrivacyIcon />}
          />
          <Chip 
            label="Última actualización: 1 de Mayo 2025" 
            color="info" 
            variant="outlined"
          />
        </Box>
        <Typography variant="h6" color="text.secondary">
          Pulse Journal - Protección de Datos Personales
        </Typography>
      </Box>

      {/* Política de Privacidad */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PrivacyIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            🔒 POLÍTICA DE PRIVACIDAD
          </Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">1. Introducción</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              En <strong>Pulse Journal</strong>, tu privacidad es nuestra prioridad. Esta Política de Privacidad explica cómo recolectamos, usamos, compartimos y protegemos tu información personal cuando utilizas nuestra plataforma.
            </Typography>
            <Typography paragraph>
              StandatPD, con sede en <strong>Guatemala</strong>, es la entidad responsable del tratamiento de tus datos personales. Para cualquier consulta sobre privacidad, contáctanos en <strong>privacy@standatpd.com</strong>.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">2. Información que recolectamos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" sx={{ mb: 2 }}>
              Solo recolectamos la información necesaria para brindarte el mejor servicio
            </Alert>
            <Typography paragraph><strong>Información que proporcionas directamente:</strong></Typography>
            <Typography component="div">
              <ul>
                <li>Nombre completo y dirección de correo electrónico</li>
                <li>Número de teléfono (opcional)</li> 
                <li>Información de perfil profesional</li>
                <li>Contenido que cargas o creas en la plataforma</li>
                <li>Proyectos, coberturas y documentos de trabajo</li>
              </ul>
            </Typography>
            <Typography paragraph><strong>Información recolectada automáticamente:</strong></Typography>
            <Typography component="div">
              <ul>
                <li>Direcciones IP y ubicación aproximada</li>
                <li>Información del dispositivo y navegador</li>
                <li>Cookies y tecnologías similares</li>
                <li>Logs de uso y actividad en la plataforma</li>
                <li>Métricas de rendimiento y errores</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">3. Cómo usamos tu información</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              Utilizamos tu información para:
              <ul>
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Personalizar tu experiencia en la plataforma</li>
                <li>Procesar análisis de tendencias y generar insights</li>
                <li>Comunicarnos contigo sobre actualizaciones y soporte</li>
                <li>Garantizar la seguridad y prevenir fraudes</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Desarrollar nuevas funcionalidades</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">4. Compartir información</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              <strong>No vendemos ni alquilamos tu información personal a terceros.</strong> Solo compartimos información en las siguientes circunstancias:
            </Typography>
            <Typography component="div">
              <ul>
                <li><strong>Proveedores de servicios:</strong> Supabase (base de datos), OpenAI/Perplexity (IA), Google Drive (almacenamiento)</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o autoridades competentes</li>
                <li><strong>Protección:</strong> Para proteger nuestros derechos, propiedad o seguridad</li>
                <li><strong>Consentimiento:</strong> Cuando tengas consentimiento explícito</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">5. Seguridad de datos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography fontWeight="bold">Medidas de seguridad implementadas</Typography>
            </Box>
            <Typography component="div">
              <ul>
                <li>Encriptación SSL/TLS para todas las comunicaciones</li>
                <li>Autenticación segura con tokens JWT</li>
                <li>Acceso restringido por roles y permisos</li>
                <li>Respaldos regulares y seguros</li>
                <li>Monitoreo continuo de actividad sospechosa</li>
                <li>Cumplimiento con estándares de seguridad internacional</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">6. Tus derechos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Tienes derecho a:</Typography>
            <Typography component="div">
              <ul>
                <li><strong>Acceso:</strong> Solicitar una copia de tu información personal</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de tus datos personales</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
                <li><strong>Limitación:</strong> Restringir ciertos usos de tu información</li>
              </ul>
            </Typography>
            <Typography paragraph>
              Para ejercer estos derechos, contáctanos en <strong>privacy@standatpd.com</strong>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">7. Cookies y tecnologías similares</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia:
            </Typography>
            <Typography component="div">
              <ul>
                <li><strong>Cookies esenciales:</strong> Para el funcionamiento básico de la plataforma</li>
                <li><strong>Cookies analíticas:</strong> Para entender cómo usas la plataforma</li>
                <li><strong>Cookies de preferencias:</strong> Para recordar tus configuraciones</li>
              </ul>
            </Typography>
            <Typography paragraph>
              Puedes controlar las cookies através de la configuración de tu navegador.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">8. Retención de datos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li><strong>Datos de cuenta:</strong> Mientras mantengas tu cuenta activa</li>
                <li><strong>Datos de uso:</strong> Hasta 2 años después de la inactividad</li>
                <li><strong>Logs técnicos:</strong> Hasta 12 meses</li>
                <li><strong>Datos de respaldo:</strong> Hasta 90 días en sistemas de respaldo</li>
              </ul>
            </Typography>
            <Typography paragraph>
              Cuando elimines tu cuenta, eliminaremos tus datos personales dentro de 30 días, excepto cuando sea requerido mantenerlos por obligaciones legales.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">9. Transferencias internacionales</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de Guatemala. Cuando transferimos datos internacionalmente, implementamos medidas apropiadas para proteger tu información conforme a estándares internacionales.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">10. Menores de edad</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Pulse Journal no está dirigido a menores de 18 años. No recolectamos conscientemente información personal de menores. Si te das cuenta de que un menor ha proporcionado información personal, contáctanos inmediatamente.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">11. Cambios a esta política</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios significativos por correo electrónico o através de la plataforma. La fecha de "Última actualización" indica cuándo se modificó por última vez.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">12. Contacto</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DataUsageIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography fontWeight="bold">Oficial de Protección de Datos</Typography>
            </Box>
            <Typography component="div">
              Si tienes preguntas sobre esta Política de Privacidad o el tratamiento de tus datos personales:
              <ul>
                <li><strong>Email:</strong> privacy@standatpd.com</li>
                <li><strong>Soporte general:</strong> support@standatpd.com</li>
                <li><strong>Jurisdicción:</strong> Guatemala</li>
              </ul>
            </Typography>
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Respuesta garantizada en 72 horas</strong> para consultas sobre privacidad y protección de datos.
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Footer Note */}
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Esta Política de Privacidad es efectiva a partir del 1 de Mayo de 2025
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          StandatPD - Pulse Journal © 2025
        </Typography>
      </Box>
    </Container>
  );
} 