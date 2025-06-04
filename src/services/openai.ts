interface DocumentRequest {
  titulo: string;
  necesidad: string;
  contexto: string;
}

interface DocumentGenerationResponse {
  html: string;
  titulo: string;
  tipo: string;
}

interface ImproveEmailRequest {
  emailContent: string;
  emailSignature: string;
  signatureImageUrl?: string;
}

interface ImproveEmailResponse {
  improved: string;
}

class OpenAIService {
  private baseURL = 'https://api.openai.com/v1/chat/completions';

  async generateDocument(request: DocumentRequest): Promise<DocumentGenerationResponse> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Debug logs para verificar la variable de entorno
    console.log('🔍 DEBUG: Variables de entorno disponibles:', import.meta.env);
    console.log('🔑 DEBUG: VITE_OPENAI_API_KEY:', apiKey ? 'Configurada (****)' : 'NO CONFIGURADA');
    
    if (!apiKey) {
      throw new Error('OpenAI API Key no configurada en las variables de entorno. Verifica tu archivo .env');
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: `Eres un asistente especializado en crear documentos profesionales para periodistas, analistas políticos y comunicadores. 

Tu tarea es generar HTML bien estructurado y profesional basado en las necesidades del usuario. El HTML debe:

1. Ser completo y bien formateado
2. Incluir estilos CSS inline para que se vea profesional
3. Ser adecuado para convertir a DOCX
4. Incluir elementos como títulos, subtítulos, párrafos, listas, tablas según sea necesario
5. Tener un diseño limpio y profesional

Tipos de documentos que puedes crear:
- Análisis políticos
- Reportes de eventos
- Tablas de análisis de tweets/redes sociales
- Comunicados de prensa
- Cartas oficiales
- Documentos para creadores de contenido
- Plantillas para eventos

Responde SOLO con el HTML generado, sin explicaciones adicionales.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de OpenAI: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Respuesta inválida de OpenAI');
      }

      const htmlContent = data.choices[0].message.content;
      
      return {
        html: htmlContent,
        titulo: request.titulo,
        tipo: this.detectDocumentType(request.necesidad)
      };

    } catch (error) {
      console.error('Error generando documento:', error);
      throw error;
    }
  }

  private buildPrompt(request: DocumentRequest): string {
    return `
Necesito que crees un documento profesional con las siguientes especificaciones:

**Título del documento:** ${request.titulo}

**Qué necesito redactar:** ${request.necesidad}

**Contexto adicional:** ${request.contexto}

Por favor, genera un documento HTML completo y profesional que cumpla con estos requerimientos. El documento debe ser adecuado para uso profesional en periodismo y comunicación política.

Incluye estilos CSS inline para que el documento se vea profesional y esté listo para imprimir o convertir a otros formatos.
`;
  }

  private detectDocumentType(necesidad: string): string {
    const necesidadLower = necesidad.toLowerCase();
    
    if (necesidadLower.includes('análisis') && necesidadLower.includes('político')) {
      return 'Análisis Político';
    } else if (necesidadLower.includes('evento') || necesidadLower.includes('plantilla')) {
      return 'Plantilla de Evento';
    } else if (necesidadLower.includes('tweet') || necesidadLower.includes('tabla') || necesidadLower.includes('análisis')) {
      return 'Análisis de Redes Sociales';
    } else if (necesidadLower.includes('comunicado') || necesidadLower.includes('prensa')) {
      return 'Comunicado de Prensa';
    } else if (necesidadLower.includes('carta') || necesidadLower.includes('oficial')) {
      return 'Documento Oficial';
    } else if (necesidadLower.includes('contenido') || necesidadLower.includes('creador')) {
      return 'Material para Creador de Contenido';
    } else {
      return 'Documento General';
    }
  }

  async generateImprovedEmail(request: ImproveEmailRequest): Promise<ImproveEmailResponse> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API Key no configurada en las variables de entorno. Verifica tu archivo .env');
    }

    const prompt = this.buildImproveEmailPrompt(request);

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: `Eres un asistente experto en redacción profesional de emails para comunicación institucional, prensa y negocios. Tu tarea es mejorar la redacción del correo proporcionado, hacerlo más claro, profesional y persuasivo, y agregar la firma digital proporcionada (texto y/o imagen). Responde SOLO con el HTML final del correo, listo para enviar.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
          max_tokens: 1200
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de OpenAI: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Respuesta inválida de OpenAI');
      }
      const improved = data.choices[0].message.content;
      return { improved };
    } catch (error) {
      console.error('Error mejorando email:', error);
      throw error;
    }
  }

  private buildImproveEmailPrompt(request: ImproveEmailRequest): string {
    let signatureBlock = '';
    if (request.emailSignature) {
      signatureBlock += `\n\n${request.emailSignature}`;
    }
    if (request.signatureImageUrl) {
      signatureBlock += `\n<img src=\"${request.signatureImageUrl}\" alt=\"Firma digital\" style=\"max-width:220px;margin-top:8px;border-radius:4px;border:1px solid #eee;\" />`;
    }
    return `Este es el contenido original del correo (puede contener HTML):\n\n${request.emailContent}\n\nPor favor, mejora la redacción y agrega la siguiente firma digital al final del correo:${signatureBlock}`;
  }
}

export const openAIService = new OpenAIService();
export type { DocumentRequest, DocumentGenerationResponse, ImproveEmailRequest, ImproveEmailResponse }; 