import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../services/supabase';
import { openAIService } from '../services/openai';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Fab,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Groups as GroupsIcon,
  VpnKey as KeyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Mail as MailIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import AirtableConfig from '../components/AirtableConfig';

interface InvitationCode {
  id: string;
  code: string;
  description: string;
  created_at: string;
  expires_at: string | null;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  max_uses: number;
  current_uses: number;
  user_type: string;
  credits: number;
}

interface CodeStats {
  total: number;
  active: number;
  used: number;
  expired: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface AirtableUser {
  id: string;
  fields: Record<string, any>;
}

interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
  viewName: string;
}

interface SimilarityGroup {
  mainValue: string;
  similar: string[];
  totalCount: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const USER_TYPES = [
  { value: 'Alpha', label: 'Alpha', color: '#ff6b6b', description: 'Acceso completo y funciones avanzadas' },
  { value: 'Beta', label: 'Beta', color: '#4ecdc4', description: 'Acceso estándar con funciones principales' },
  { value: 'Admin', label: 'Admin', color: '#45b7d1', description: 'Acceso administrativo completo' },
  { value: 'Creador', label: 'Creador', color: '#96ceb4', description: 'Permisos de creación de contenido' }
];

export default function AdminPanel() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para códigos de invitación
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [stats, setStats] = useState<CodeStats>({ total: 0, active: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<InvitationCode | null>(null);
  const [newCodeData, setNewCodeData] = useState({
    prefix: 'PRESS',
    description: '',
    expiresIn: '30',
    maxUses: 1,
    userType: 'Beta',
    credits: 100
  });
  
  // Estados para configuración de email
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromName: 'PulseJournal',
    fromEmail: ''
  });
  const [emailConfigSaved, setEmailConfigSaved] = useState(false);
  
  // Estados para Airtable
  const [airtableConfig, setAirtableConfig] = useState<AirtableConfig>({
    apiKey: '',
    baseId: '',
    tableName: '',
    viewName: ''
  });
  const [airtableUsers, setAirtableUsers] = useState<AirtableUser[]>([]);
  const [loadingAirtable, setLoadingAirtable] = useState(false);
  const [airtableConnected, setAirtableConnected] = useState(false);
  
  // Estados para correos
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [recipientType, setRecipientType] = useState('all'); // 'all', 'filtered', 'manual'
  const [manualEmails, setManualEmails] = useState('');
  
  // Estados para segmentación
  const [segmentation, setSegmentation] = useState({
    selectedField: '',
    filterValue: '',
    filterType: 'equals',
  });
  const [filteredUsers, setFilteredUsers] = useState<AirtableUser[]>([]);
  const [segmentInfo, setSegmentInfo] = useState<{
    field: string;
    values: Array<{ value: string; count: number }>;
    totalUsers: number;
    similarGroups?: SimilarityGroup[];
  } | null>(null);
  
  // Estado para el campo de email
  const [emailField, setEmailField] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [emailSignature, setEmailSignature] = useState(() => {
    return localStorage.getItem('emailSignature') || '';
  });
  const [signatureImageUrl, setSignatureImageUrl] = useState(() => {
    return localStorage.getItem('signatureImageUrl') || '';
  });
  const [improvingEmail, setImprovingEmail] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Effects
  useEffect(() => {
    loadCodes();
  }, []);

  // Cargar configuración guardada de Airtable
  useEffect(() => {
    const savedConfig = localStorage.getItem('airtableConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAirtableConfig(config);
      } catch (e) {
        console.error('Error parsing saved Airtable config');
      }
    }
  }, []);

  // Cargar configuración guardada de email
  useEffect(() => {
    const savedEmailConfig = localStorage.getItem('emailConfig');
    if (savedEmailConfig) {
      try {
        const config = JSON.parse(savedEmailConfig);
        setEmailConfig(config);
        setEmailConfigSaved(true);
      } catch (e) {
        console.error('Error parsing saved email config');
      }
    }
  }, []);

  useEffect(() => {
    const savedSignature = localStorage.getItem('emailSignature');
    if (savedSignature) setEmailSignature(savedSignature);
    const savedImage = localStorage.getItem('signatureImageUrl');
    if (savedImage) setSignatureImageUrl(savedImage);
  }, []);

  // Cargar códigos de invitación
  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);

      // Calcular estadísticas
      const now = new Date();
      const stats = {
        total: data?.length || 0,
        active: data?.filter(code => 
          !code.used && 
          (!code.expires_at || new Date(code.expires_at) > now) &&
          code.current_uses < code.max_uses
        ).length || 0,
        used: data?.filter(code => code.used).length || 0,
        expired: data?.filter(code => 
          code.expires_at && new Date(code.expires_at) <= now
        ).length || 0
      };
      setStats(stats);
    } catch (error: any) {
      setError('Error cargando códigos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async (preset?: { prefix: string; description: string; userType?: string; credits?: number }) => {
    try {
      setError(null);
      
      // Usar preset si está disponible, sino usar newCodeData
      const codeData = preset ? {
        prefix: preset.prefix,
        description: preset.description,
        expiresIn: '30', // valor por defecto para presets
        maxUses: 1, // valor por defecto para presets
        userType: preset.userType || 'Beta',
        credits: preset.credits || 100
      } : newCodeData;
      
      // Calcular fecha de expiración
      const expiresAt = codeData.expiresIn ? 
        new Date(Date.now() + parseInt(codeData.expiresIn) * 24 * 60 * 60 * 1000).toISOString() : 
        null;

      // Generar código usando la función SQL
      const { data: generatedCode, error: codeError } = await supabase
        .rpc('generate_invitation_code', {
          code_prefix: codeData.prefix,
          code_length: 8
        });

      if (codeError) throw codeError;

      // Insertar en la base de datos con los nuevos campos
      const { error: insertError } = await supabase
        .from('invitation_codes')
        .insert({
          code: generatedCode,
          description: codeData.description,
          expires_at: expiresAt,
          max_uses: codeData.maxUses,
          user_type: codeData.userType,
          credits: codeData.credits
        });

      if (insertError) throw insertError;

      setSuccess(`Código generado: ${generatedCode} (${codeData.userType}, ${codeData.credits} créditos)`);
      setOpenDialog(false);
      setNewCodeData({ 
        prefix: 'PRESS', 
        description: '', 
        expiresIn: '30', 
        maxUses: 1,
        userType: 'Beta',
        credits: 100
      });
      loadCodes();
    } catch (error: any) {
      setError('Error generando código: ' + error.message);
    }
  };

  const deleteCode = async (code: InvitationCode) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('invitation_codes')
        .delete()
        .eq('id', code.id);

      if (error) throw error;

      setSuccess(`Código eliminado: ${code.code}`);
      setOpenDeleteDialog(false);
      setCodeToDelete(null);
      loadCodes();
    } catch (error: any) {
      setError('Error eliminando código: ' + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`Código copiado: ${text}`);
  };

  const getStatusChip = (code: InvitationCode) => {
    const now = new Date();
    const isExpired = code.expires_at && new Date(code.expires_at) <= now;
    const isUsed = code.used || code.current_uses >= code.max_uses;

    if (isUsed) {
      return <Chip label="Usado" color="error" size="small" icon={<CancelIcon />} />;
    }
    if (isExpired) {
      return <Chip label="Expirado" color="warning" size="small" icon={<CancelIcon />} />;
    }
    return <Chip label="Activo" color="success" size="small" icon={<CheckIcon />} />;
  };

  const getUserTypeChip = (userType: string) => {
    const typeConfig = USER_TYPES.find(t => t.value === userType);
    return (
      <Chip 
        label={userType} 
        size="small" 
        style={{ 
          backgroundColor: typeConfig?.color || '#gray',
          color: 'white',
          fontWeight: 'bold'
        }}
      />
    );
  };

  // Función para diagnosticar y marcar código como usado manualmente
  const debugMarkCodeAsUsed = async (code: InvitationCode) => {
    try {
      setError(null);
      
      console.log('🔧 DEBUG: Intentando marcar código como usado:', code.code);
      
      // Intentar con RPC primero
      const { data: rpcResult, error: rpcError } = await supabase.rpc('mark_invitation_code_used', {
        invitation_code: code.code,
        user_id: '00000000-0000-0000-0000-000000000000' // Usuario ficticio para prueba
      });
      
      if (rpcError) {
        console.log('❌ DEBUG: Error con RPC:', rpcError);
        
        // Intentar actualización directa
        const { error: directError } = await supabase
          .from('invitation_codes')
          .update({
            used: true,
            used_by: '00000000-0000-0000-0000-000000000000',
            used_at: new Date().toISOString(),
            current_uses: 1
          })
          .eq('code', code.code);
          
        if (directError) {
          console.error('❌ DEBUG: Error con actualización directa:', directError);
          setError(`Error marcando código: ${directError.message}`);
        } else {
          console.log('✅ DEBUG: Marcado exitoso con actualización directa');
          setSuccess(`Código ${code.code} marcado como usado exitosamente (método directo)`);
          loadCodes();
        }
      } else {
        console.log('✅ DEBUG: Marcado exitoso con RPC:', rpcResult);
        setSuccess(`Código ${code.code} marcado como usado exitosamente (RPC)`);
        loadCodes();
      }
    } catch (error: any) {
      console.error('❌ DEBUG: Error general:', error);
      setError(`Error general: ${error.message}`);
    }
  };

  const presetCodes = [
    { 
      prefix: 'CREADOR', 
      description: 'Código para creadores de contenido',
      userType: 'Creador',
      credits: 100
    },
    { 
      prefix: 'SPORTS', 
      description: 'Código Alpha para periodistas deportivos',
      userType: 'Alpha',
      credits: 100
    },
    { 
      prefix: 'PRESS', 
      description: 'Código Alpha para prensa general',
      userType: 'Alpha',
      credits: 100
    },
    { 
      prefix: 'BETA-PRESS', 
      description: 'Código Beta para prensa',
      userType: 'Beta',
      credits: 100
    }
  ];

  // Función para detectar valores similares
  const detectSimilarValues = (values: Array<{ value: string; count: number }>): SimilarityGroup[] => {
    const groups: SimilarityGroup[] = [];
    const processed = new Set<string>();
    
    for (const item of values) {
      if (processed.has(item.value)) continue;
      
      const similar = values.filter(other => 
        other.value !== item.value && 
        !processed.has(other.value) &&
        areSimilar(item.value, other.value)
      );
      
      if (similar.length > 0) {
        const totalCount = item.count + similar.reduce((sum, s) => sum + s.count, 0);
        groups.push({
          mainValue: item.value,
          similar: similar.map(s => s.value),
          totalCount
        });
        
        processed.add(item.value);
        similar.forEach(s => processed.add(s.value));
      }
    }
    
    return groups;
  };

  // Función para determinar si dos valores son similares
  const areSimilar = (value1: string, value2: string): boolean => {
    const v1 = value1.toLowerCase().trim();
    const v2 = value2.toLowerCase().trim();
    
    // Detectar palabras base similares
    const stemWords = ['deport', 'sport', 'politic', 'econom', 'tecnolog', 'salud', 'educac'];
    for (const stem of stemWords) {
      if (v1.includes(stem) && v2.includes(stem)) return true;
    }
    
    // Detectar variaciones comunes
    const variations = [
      ['deporte', 'deportes', 'deportivo', 'deportivos', 'sports', 'sport'],
      ['politica', 'politico', 'politics', 'political'],
      ['economia', 'economico', 'economic', 'economics'],
      ['tecnologia', 'tecnologico', 'technology', 'tech'],
      ['salud', 'medico', 'medicina', 'health', 'medical'],
      ['educacion', 'educativo', 'education', 'educational']
    ];
    
    for (const group of variations) {
      if (group.includes(v1) && group.includes(v2)) return true;
    }
    
    return false;
  };

  // Función inteligente para expandir términos de búsqueda
  const expandFilterTerm = (term: string): string[] => {
    const normalizedTerm = term.toLowerCase().trim();
    const expandedTerms = [normalizedTerm];
    
    // Diccionario de expansiones semánticas
    const semanticExpansions: { [key: string]: string[] } = {
      // Deportes
      'deporte': ['deporte', 'deportes', 'deportivo', 'deportivos', 'sport', 'sports', 'atletico', 'atletismo', 'gimnasia', 'ejercicio'],
      'futbol': ['futbol', 'fútbol', 'football', 'soccer', 'balon', 'pelota'],
      'basquet': ['basquet', 'basketball', 'basquetbol', 'canasta', 'baloncesto'],
      'tenis': ['tenis', 'tennis', 'raqueta'],
      'natacion': ['natacion', 'natación', 'swimming', 'nadar', 'piscina'],
      
      // Política
      'politica': ['politica', 'política', 'politics', 'político', 'politico', 'gobierno', 'estado', 'democracia'],
      'elecciones': ['elecciones', 'electoral', 'voto', 'votar', 'candidato', 'campana'],
      'gobierno': ['gobierno', 'administracion', 'estado', 'ministerio', 'secretaria'],
      
      // Economía
      'economia': ['economia', 'economía', 'economic', 'economics', 'económico', 'economico', 'finanzas', 'dinero'],
      'finanzas': ['finanzas', 'financiero', 'banco', 'credito', 'inversion', 'mercado'],
      'comercio': ['comercio', 'comercial', 'negocio', 'empresa', 'mercado', 'venta'],
      
      // Tecnología
      'tecnologia': ['tecnologia', 'tecnología', 'technology', 'tech', 'tecnológico', 'tecnologico', 'digital', 'informatica'],
      'inteligencia artificial': ['ia', 'ai', 'inteligencia artificial', 'machine learning', 'algoritmo', 'robot'],
      'internet': ['internet', 'web', 'online', 'digital', 'sitio web', 'plataforma'],
      
      // Salud
      'salud': ['salud', 'health', 'medico', 'médico', 'medicina', 'medical', 'hospital', 'clinica'],
      'medicina': ['medicina', 'medical', 'medico', 'doctor', 'farmaco', 'tratamiento'],
      'hospital': ['hospital', 'clinica', 'centro medico', 'sanatorio'],
      
      // Educación
      'educacion': ['educacion', 'educación', 'education', 'educational', 'educativo', 'escuela', 'universidad'],
      'universidad': ['universidad', 'college', 'facultad', 'carrera', 'estudios superiores'],
      'escuela': ['escuela', 'colegio', 'instituto', 'school', 'primaria', 'secundaria'],
      
      // Entretenimiento
      'musica': ['musica', 'música', 'music', 'musical', 'canción', 'cancion', 'artista', 'concierto'],
      'cine': ['cine', 'cinema', 'pelicula', 'película', 'movie', 'film', 'actor', 'director'],
      'television': ['television', 'televisión', 'tv', 'programa', 'serie', 'canal'],
      
      // Ciencia
      'ciencia': ['ciencia', 'science', 'científico', 'cientifico', 'investigacion', 'estudio'],
      'investigacion': ['investigacion', 'investigación', 'research', 'estudio', 'análisis', 'analisis'],
      
      // Medio ambiente
      'ambiente': ['ambiente', 'ambiental', 'ecologia', 'ecológico', 'sostenible', 'verde'],
      'clima': ['clima', 'climático', 'climatico', 'weather', 'temperatura', 'calentamiento'],
      
      // Cultura
      'cultura': ['cultura', 'cultural', 'arte', 'tradicion', 'tradición', 'costumbre'],
      'arte': ['arte', 'artístico', 'artistico', 'pintura', 'escultura', 'museo'],
      
      // Negocios
      'negocio': ['negocio', 'business', 'empresa', 'compañia', 'compania', 'corporacion'],
      'trabajo': ['trabajo', 'empleo', 'job', 'laboral', 'profesion', 'profesión', 'carrera']
    };
    
    // Buscar expansiones directas
    for (const [key, variations] of Object.entries(semanticExpansions)) {
      if (key === normalizedTerm || variations.includes(normalizedTerm)) {
        expandedTerms.push(...variations);
        break;
      }
    }
    
    // Generar variaciones morfológicas básicas
    const morphologicalVariations = generateMorphologicalVariations(normalizedTerm);
    expandedTerms.push(...morphologicalVariations);
    
    // Eliminar duplicados y el término original si ya está incluido
    return [...new Set(expandedTerms)];
  };

  // Función para generar variaciones morfológicas
  const generateMorphologicalVariations = (term: string): string[] => {
    const variations = [];
    
    // Plurales/singulares
    if (term.endsWith('s') && term.length > 3) {
      variations.push(term.slice(0, -1)); // quitar 's'
    } else {
      variations.push(term + 's'); // agregar 's'
    }
    
    if (term.endsWith('es') && term.length > 4) {
      variations.push(term.slice(0, -2)); // quitar 'es'
    }
    
    // Adjetivos masculino/femenino
    if (term.endsWith('o')) {
      variations.push(term.slice(0, -1) + 'a'); // masculino a femenino
      variations.push(term.slice(0, -1) + 'os'); // plural masculino
      variations.push(term.slice(0, -1) + 'as'); // plural femenino
    }
    
    if (term.endsWith('a') && !term.endsWith('ia')) {
      variations.push(term.slice(0, -1) + 'o'); // femenino a masculino
      variations.push(term.slice(0, -1) + 'os'); // plural masculino
      variations.push(term.slice(0, -1) + 'as'); // plural femenino
    }
    
    // Sufijos comunes
    const suffixes = ['ico', 'ica', 'ivo', 'iva', 'ado', 'ada', 'oso', 'osa'];
    for (const suffix of suffixes) {
      if (!term.includes(suffix)) {
        variations.push(term + suffix);
      }
    }
    
    // Prefijos comunes
    const prefixes = ['pre', 'post', 'anti', 'pro', 'sub', 'super'];
    for (const prefix of prefixes) {
      if (!term.startsWith(prefix)) {
        variations.push(prefix + term);
      }
    }
    
    return variations;
  };

  // Función para aplicar filtro de segmentación
  const applySegmentationFilter = () => {
    console.log('🔄 Aplicando filtro normal...');
    console.log('- Campo seleccionado:', segmentation.selectedField);
    console.log('- Valor a filtrar:', segmentation.filterValue);
    console.log('- Tipo de filtro:', segmentation.filterType);
    console.log('- Usuarios disponibles:', airtableUsers.length);
    
    if (!airtableConnected || !segmentation.selectedField || !segmentation.filterValue) {
      setError('Selecciona un campo y valor para filtrar');
      return;
    }

    // Limpiar mensajes anteriores
    setError(null);
    setSuccess(null);

    const filtered = airtableUsers.filter(user => {
      const fieldValue = user.fields[segmentation.selectedField];
      if (!fieldValue) return false;

      const stringValue = String(fieldValue).toLowerCase().trim();
      const filterValue = segmentation.filterValue.toLowerCase().trim();

      console.log(`Comparando: "${stringValue}" con "${filterValue}"`);

      switch (segmentation.filterType) {
        case 'equals':
          return stringValue === filterValue;
        case 'contains':
          return stringValue.includes(filterValue);
        case 'greater':
          return Number(fieldValue) > Number(segmentation.filterValue);
        case 'less':
          return Number(fieldValue) < Number(segmentation.filterValue);
        case 'not_equals':
          return stringValue !== filterValue;
        case 'not_contains':
          return !stringValue.includes(filterValue);
        default:
          return false;
      }
    });

    console.log('✅ Filtro normal completado. Usuarios encontrados:', filtered.length);
    setFilteredUsers(filtered);
    setSuccess(`✅ Filtro normal aplicado: ${filtered.length} usuarios encontrados de ${airtableUsers.length} total`);
  };

  // Función mejorada para aplicar filtro de segmentación con expansión inteligente
  const applyIntelligentFilter = () => {
    console.log('🧠 Aplicando filtro inteligente...');
    console.log('- Campo seleccionado:', segmentation.selectedField);
    console.log('- Valor original:', segmentation.filterValue);
    
    if (!airtableConnected || !segmentation.selectedField || !segmentation.filterValue) {
      setError('Selecciona un campo y valor para filtrar');
      return;
    }

    // Limpiar mensajes anteriores
    setError(null);
    setSuccess(null);

    const expandedTerms = expandFilterTerm(segmentation.filterValue);
    console.log('🔍 Términos expandidos:', expandedTerms);

    const filtered = airtableUsers.filter(user => {
      const fieldValue = user.fields[segmentation.selectedField];
      if (!fieldValue) return false;

      const stringValue = String(fieldValue).toLowerCase().trim();

      // Verificar coincidencia con términos expandidos
      for (const expandedTerm of expandedTerms) {
        const normalizedTerm = expandedTerm.toLowerCase().trim();
        
        switch (segmentation.filterType) {
          case 'equals':
            if (stringValue === normalizedTerm) {
              console.log(`✅ Coincidencia exacta: "${stringValue}" = "${normalizedTerm}"`);
              return true;
            }
            break;
          case 'contains':
            if (stringValue.includes(normalizedTerm)) {
              console.log(`✅ Contiene: "${stringValue}" contiene "${normalizedTerm}"`);
              return true;
            }
            break;
          case 'greater':
            if (Number(fieldValue) > Number(expandedTerm)) return true;
            break;
          case 'less':
            if (Number(fieldValue) < Number(expandedTerm)) return true;
            break;
          case 'not_equals':
            if (stringValue === normalizedTerm) return false;
            break;
          case 'not_contains':
            if (stringValue.includes(normalizedTerm)) return false;
            break;
        }
      }
      
      // Para 'not_equals' y 'not_contains', si no se encontró coincidencia, incluir el usuario
      if (segmentation.filterType === 'not_equals' || segmentation.filterType === 'not_contains') {
        return true;
      }
      
      return false;
    });

    setFilteredUsers(filtered);
    
    // Mostrar qué términos se usaron en la búsqueda
    const matchedTerms = expandedTerms.slice(0, 5).join(', ');
    console.log('🎯 Filtro inteligente completado. Usuarios encontrados:', filtered.length);
    setSuccess(`🧠 Filtro inteligente aplicado con términos: "${matchedTerms}${expandedTerms.length > 5 ? '...' : ''}" 
    → ${filtered.length} usuarios encontrados de ${airtableUsers.length} total`);
  };

  // Función para analizar información de un campo
  const analyzeFieldInfo = (fieldName: string) => {
    if (!airtableConnected || !fieldName) return;

    const fieldValues: { [key: string]: number } = {};
    let totalUsers = 0;

    airtableUsers.forEach(user => {
      const value = user.fields[fieldName];
      if (value !== undefined && value !== null && value !== '') {
        const stringValue = String(value);
        fieldValues[stringValue] = (fieldValues[stringValue] || 0) + 1;
        totalUsers++;
      }
    });

    const sortedValues = Object.entries(fieldValues)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    const similarGroups = detectSimilarValues(sortedValues);

    setSegmentInfo({
      field: fieldName,
      values: sortedValues,
      totalUsers,
      similarGroups
    });
  };

  // Función para conectar con Airtable
  const connectToAirtable = async () => {
    if (!airtableConfig.apiKey || !airtableConfig.baseId || !airtableConfig.tableName) {
      setError('Por favor completa todos los campos de configuración de Airtable');
      return;
    }

    setLoadingAirtable(true);
    setError(null);

    try {
      const url = `https://api.airtable.com/v0/${airtableConfig.baseId}/${airtableConfig.tableName}${
        airtableConfig.viewName ? `?view=${encodeURIComponent(airtableConfig.viewName)}` : ''
      }`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${airtableConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.records && data.records.length > 0) {
        const users: AirtableUser[] = data.records.map((record: any) => ({
          id: record.id,
          fields: record.fields
        }));
        
        setAirtableUsers(users);
        setAirtableConnected(true);
        setSuccess(`Conectado exitosamente! Se encontraron ${users.length} registros.`);
        
        // Detectar automáticamente el campo de email
        const detectedEmailField = detectEmailField();
        if (detectedEmailField) {
          setEmailField(detectedEmailField);
          const validation = validateEmailField(detectedEmailField);
          console.log(`📧 Campo de email detectado automáticamente: "${detectedEmailField}" (${validation.valid} emails válidos)`);
        }
        
        localStorage.setItem('airtableConfig', JSON.stringify(airtableConfig));
      } else {
        setError('No se encontraron registros en la tabla especificada');
      }
    } catch (error: any) {
      setError(`Error conectando con Airtable: ${error.message}`);
      setAirtableConnected(false);
    } finally {
      setLoadingAirtable(false);
    }
  };

  // Función para guardar configuración de email
  const saveEmailConfig = () => {
    localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
    setEmailConfigSaved(true);
    setSuccess('Configuración de email guardada correctamente');
  };

  // Función para probar configuración SMTP
  const testEmailConfig = async () => {
    if (!emailConfig.smtpHost || !emailConfig.fromEmail || !emailConfig.smtpUser) {
      setError('Completa todos los campos obligatorios de configuración SMTP');
      return;
    }

    setLoadingAirtable(true);
    setError(null);

    try {
      console.log('🧪 Probando configuración SMTP...');
      
      const testEmailData = {
        to: 'pablojosea361@gmail.com', // Cambiar de emailConfig.fromEmail a email diferente
        subject: 'Prueba de configuración SMTP - PulseJournal',
        html: `
          <h2>✅ Configuración SMTP funcionando correctamente</h2>
          <p>Este es un email de prueba enviado desde PulseJournal para verificar que tu configuración SMTP está funcionando.</p>
          <p><strong>Configuración utilizada:</strong></p>
          <ul>
            <li>Servidor: ${emailConfig.smtpHost}:${emailConfig.smtpPort}</li>
            <li>Usuario: ${emailConfig.smtpUser}</li>
            <li>De: ${emailConfig.fromName} &lt;${emailConfig.fromEmail}&gt;</li>
          </ul>
          <p>Fecha y hora: ${new Date().toLocaleString()}</p>
        `,
        text: `Configuración SMTP funcionando correctamente. Servidor: ${emailConfig.smtpHost}:${emailConfig.smtpPort}`,
        smtp: {
          host: emailConfig.smtpHost,
          port: parseInt(emailConfig.smtpPort),
          secure: emailConfig.smtpPort === '465',
          auth: {
            user: emailConfig.smtpUser,
            pass: emailConfig.smtpPassword
          }
        },
        from: {
          name: emailConfig.fromName,
          email: emailConfig.fromEmail
        }
      };

      // AQUÍ DEBES IMPLEMENTAR LA LLAMADA REAL A TU API
      const response = await fetch('https://server.standatpd.com/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmailData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error del servidor');
      }

      const result = await response.json();

      // Simulación de prueba
      // await new Promise(resolve => setTimeout(resolve, 2000));
      // 
      // // Simular éxito/fallo aleatorio para testing
      // if (Math.random() < 0.2) { // 20% de probabilidad de error
      //   throw new Error('Error de autenticación SMTP. Verifica usuario y contraseña.');
      // }

      setSuccess(`✅ ¡Configuración SMTP probada exitosamente! Se envió un email de prueba a pablojosea361@gmail.com`);
      
    } catch (error: any) {
      console.error('❌ Error probando SMTP:', error);
      setError(`Error probando configuración SMTP: ${error.message}`);
    } finally {
      setLoadingAirtable(false);
    }
  };

  // Función para obtener campos disponibles
  const getAvailableFields = (): string[] => {
    if (!airtableUsers.length) return [];
    return Object.keys(airtableUsers[0].fields);
  };

  // Función para detectar automáticamente el campo de email
  const detectEmailField = (): string => {
    const fields = getAvailableFields();
    const emailKeywords = ['email', 'correo', 'mail', 'e-mail', 'e_mail', 'gmail', 'address'];
    
    // Buscar campo que contenga palabras clave de email
    for (const field of fields) {
      const fieldLower = field.toLowerCase();
      if (emailKeywords.some(keyword => fieldLower.includes(keyword))) {
        return field;
      }
    }
    
    return '';
  };

  // Función para validar si un campo contiene emails válidos
  const validateEmailField = (fieldName: string): { valid: number; invalid: number; examples: string[] } => {
    if (!airtableUsers.length || !fieldName) return { valid: 0, invalid: 0, examples: [] };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = 0;
    let invalid = 0;
    const examples: string[] = [];
    
    airtableUsers.forEach(user => {
      const fieldValue = user.fields[fieldName];
      if (fieldValue) {
        const email = String(fieldValue).trim();
        if (emailRegex.test(email)) {
          valid++;
          if (examples.length < 3) examples.push(email);
        } else {
          invalid++;
        }
      } else {
        invalid++;
      }
    });
    
    return { valid, invalid, examples };
  };

  // Función para obtener emails de usuarios filtrados
  const getEmailsFromUsers = (users: AirtableUser[]): string[] => {
    if (!emailField) return [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let emails: string[] = [];
    users.forEach(user => {
      const fieldValue = user.fields[emailField];
      if (fieldValue) {
        const email = String(fieldValue).trim();
        if (emailRegex.test(email)) {
          emails.push(email);
        }
      }
    });
    // Si no hay emails válidos y estamos en modo filtrado, intentar obtener de todos los usuarios
    if (emails.length === 0 && users === filteredUsers && airtableUsers.length > 0) {
      airtableUsers.forEach(user => {
        const fieldValue = user.fields[emailField];
        if (fieldValue) {
          const email = String(fieldValue).trim();
          if (emailRegex.test(email)) {
            emails.push(email);
          }
        }
      });
    }
    return emails;
  };

  // Función para enviar correos según segmentación
  const sendSegmentedEmails = async () => {
    let targetEmails: string[] = [];
    let targetDescription = '';
    
    switch (recipientType) {
      case 'all':
        targetEmails = getEmailsFromUsers(airtableUsers);
        targetDescription = `todos los usuarios (${targetEmails.length} emails válidos de ${airtableUsers.length} registros)`;
        break;
      case 'filtered':
        targetEmails = getEmailsFromUsers(filteredUsers);
        targetDescription = `usuarios filtrados (${targetEmails.length} emails válidos de ${filteredUsers.length} registros)`;
        break;
      case 'manual':
        const manualEmailList = manualEmails.split(',').map(e => e.trim()).filter(e => e);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        targetEmails = manualEmailList.filter(email => emailRegex.test(email));
        targetDescription = `correos manuales (${targetEmails.length} emails válidos de ${manualEmailList.length} ingresados)`;
        break;
    }
    
    if (targetEmails.length === 0) {
      if (recipientType === 'manual') {
        setError('No hay emails válidos en la lista manual');
      } else if (!emailField) {
        setError('Selecciona el campo que contiene los emails en Airtable');
      } else {
        setError('No se encontraron emails válidos en el campo seleccionado');
      }
      return;
    }

    if (recipientType !== 'manual' && !emailConfigSaved) {
      setError('Configura y guarda la configuración SMTP antes de enviar');
      return;
    }

    // Validar configuración SMTP antes de enviar
    if (!emailConfig.smtpHost || !emailConfig.fromEmail || !emailConfig.smtpUser) {
      setError('Configuración SMTP incompleta. Verifica servidor, usuario y email del remitente.');
      return;
    }

    setLoadingAirtable(true);
    setError(null);

    try {
      console.log('📧 Iniciando envío de correos...');
      console.log('📧 Destinatarios:', targetEmails);
      console.log('📧 Configuración SMTP:', {
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        user: emailConfig.smtpUser,
        from: emailConfig.fromEmail
      });
      
      // Función para enviar email individual
      const sendSingleEmail = async (email: string, userData?: any): Promise<{ success: boolean; error?: string }> => {
        try {
          let personalizedSubject = emailSubject;
          let personalizedContent = emailTemplate;
          
          // Personalizar contenido si es de Airtable
          if (userData && recipientType !== 'manual') {
            Object.keys(userData.fields).forEach(field => {
              const value = userData.fields[field] || '';
              personalizedSubject = personalizedSubject.replace(new RegExp(`{{${field}}}`, 'g'), value);
              personalizedContent = personalizedContent.replace(new RegExp(`{{${field}}}`, 'g'), value);
            });
          }
          // Agregar firma digital (texto e imagen) igual que en la vista previa
          if (emailSignature || signatureImageUrl) {
            personalizedContent += '<br><br><hr style="margin:16px 0;opacity:0.2;">';
            if (emailSignature) {
              personalizedContent += `<div style='white-space:pre-line;font-family:inherit;'>${emailSignature}</div>`;
            }
            if (signatureImageUrl) {
              personalizedContent += `<div><img src='${signatureImageUrl}' alt='Firma digital' style='max-width:220px;margin-top:8px;border-radius:4px;border:1px solid #eee;'/></div>`;
            }
          }

          // Preparar datos para envío
          const emailData = {
            to: email,
            subject: personalizedSubject,
            html: personalizedContent.replace(/\n/g, '<br>'),
            text: personalizedContent,
            smtp: {
              host: emailConfig.smtpHost,
              port: parseInt(emailConfig.smtpPort),
              secure: emailConfig.smtpPort === '465',
              auth: {
                user: emailConfig.smtpUser,
                pass: emailConfig.smtpPassword
              }
            },
            from: {
              name: emailConfig.fromName,
              email: emailConfig.fromEmail
            }
          };

          console.log(`📤 Enviando a: ${email}`);
          
          // OPCIÓN 1: Llamada a tu API backend
          const response = await fetch('https://server.standatpd.com/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error del servidor');
          }

          const result = await response.json();

          // OPCIÓN 2: Usar EmailJS (servicio frontend)
          // await emailjs.send('service_id', 'template_id', emailData, 'public_key');

          // OPCIÓN 3: Simular envío con validación real (para testing)
          // await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
          // 
          // // Simular ocasionales errores para testing
          // if (Math.random() < 0.05) { // 5% de probabilidad de error
          //   throw new Error('Error simulado de servidor SMTP');
          // }

          console.log(`✅ Email enviado exitosamente a: ${email}`);
          return { success: true };
          
        } catch (error: any) {
          console.error(`❌ Error enviando a ${email}:`, error.message);
          return { success: false, error: error.message };
        }
      };

      // Enviar emails en lotes para evitar spam
      const batchSize = 5; // Enviar 5 emails simultáneamente
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      
      console.log(`📊 Enviando ${targetEmails.length} emails en lotes de ${batchSize}...`);
      
      for (let i = 0; i < targetEmails.length; i += batchSize) {
        const batch = targetEmails.slice(i, i + batchSize);
        console.log(`📦 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(targetEmails.length/batchSize)}...`);
        
        const batchPromises = batch.map(async (email) => {
          // Encontrar datos del usuario para personalización
          let userData = null;
          if (recipientType === 'all') {
            userData = airtableUsers.find(user => user.fields[emailField] === email);
          } else if (recipientType === 'filtered') {
            userData = filteredUsers.find(user => user.fields[emailField] === email);
          }
          
          const result = await sendSingleEmail(email, userData);
          return { email, ...result };
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Pausa entre lotes para no sobrecargar el servidor
        if (i + batchSize < targetEmails.length) {
          console.log('⏳ Pausa entre lotes...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Analizar resultados
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const errors = results.filter(r => !r.success);
      
      console.log(`📊 Resumen de envío:`);
      console.log(`✅ Exitosos: ${successful}`);
      console.log(`❌ Fallidos: ${failed}`);
      if (errors.length > 0) {
        console.log(`🔍 Errores:`, errors);
      }
      
      if (successful > 0) {
        setSuccess(`📧 Envío completado: ${successful} emails enviados exitosamente${failed > 0 ? `, ${failed} fallidos` : ''} a ${targetDescription}
${results.filter(r => r.success).slice(0, 3).map(r => r.email).join(', ')}${successful > 3 ? '...' : ''}`);
      } else {
        setError(`Error: No se pudo enviar ningún email. Verifica tu configuración SMTP.
${errors.slice(0, 2).map(e => e.error).join(', ')}`);
      }
      
    } catch (error: any) {
      console.error('💥 Error general en envío:', error);
      setError(`Error crítico enviando emails: ${error.message}. Verifica tu configuración SMTP y conexión.`);
    } finally {
      setLoadingAirtable(false);
    }
  };

  // Si no es admin, redirigir
  if (adminLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const saveEmailSignature = () => {
    localStorage.setItem('emailSignature', emailSignature);
    setSuccess('Firma digital guardada correctamente');
  };
  const saveSignatureImageUrl = () => {
    localStorage.setItem('signatureImageUrl', signatureImageUrl);
    setSuccess('Imagen de firma guardada correctamente');
  };

  const improveEmailContent = async () => {
    setImprovingEmail(true);
    setError(null);
    try {
      const result = await openAIService.generateImprovedEmail({
        emailContent: emailTemplate,
        emailSignature,
        signatureImageUrl
      });
      setEmailTemplate(result.improved || '');
      setSuccess('Redacción mejorada por IA y firma agregada');
    } catch (e: any) {
      setError('Error mejorando el correo: ' + (e.message || ''));
    } finally {
      setImprovingEmail(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AdminIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Panel de Administración
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gestiona códigos de invitación y comunicaciones automatizadas
        </Typography>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 'medium',
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab 
            icon={<KeyIcon />} 
            label="Códigos de Invitación"
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<EmailIcon />} 
            label="Correos Automatizados"
            iconPosition="start"
            sx={{ gap: 1 }}
          />
        </Tabs>

        {/* Tab 1: Códigos de Invitación */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Códigos
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Activos
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.active}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupsIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Usados
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.used}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CancelIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Expirados
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.expired}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Generadores Rápidos */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Generadores Rápidos
        </Typography>
        <Grid container spacing={2}>
          {presetCodes.map((preset) => (
            <Grid item xs={12} sm={6} md={4} key={preset.prefix}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {preset.prefix}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {preset.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {getUserTypeChip(preset.userType)}
                    <Chip 
                      label={`${preset.credits} créditos`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => generateCode(preset)}>
                    Generar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Tabla de Códigos */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Códigos de Invitación
          </Typography>
          <IconButton onClick={loadCodes}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo Usuario</TableCell>
                <TableCell>Créditos</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Usos</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell>Expira</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay códigos generados
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {code.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell>{getUserTypeChip(code.user_type)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={code.credits} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(code)}</TableCell>
                    <TableCell>
                      {code.current_uses}/{code.max_uses}
                    </TableCell>
                    <TableCell>
                      {new Date(code.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {code.expires_at ? 
                        new Date(code.expires_at).toLocaleDateString() : 
                        'Sin expiración'
                      }
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Copiar código">
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(code.code)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                        {!code.used && (
                                <>
                                  <Tooltip title="Marcar como usado (DEBUG)">
                                    <IconButton 
                                      size="small" 
                                      color="warning"
                                      onClick={() => debugMarkCodeAsUsed(code)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                          <Tooltip title="Eliminar código">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                setCodeToDelete(code);
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                                </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
          </Box>
        </TabPanel>

        {/* Tab 2: Correos Automatizados */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <EmailIcon color="primary" />
              Correos Automatizados
            </Typography>
            
            {/* Configuración de Airtable */}
            <AirtableConfig
              config={airtableConfig}
              onConfigChange={setAirtableConfig}
              onConnect={connectToAirtable}
              connected={airtableConnected}
              loading={loadingAirtable}
              userCount={airtableUsers.length}
            />

            {/* Configuración de Email */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MailIcon color="primary" />
                Configuración de Email SMTP
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Servidor SMTP"
                    value={emailConfig.smtpHost}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpHost: e.target.value})}
                    placeholder="smtp.gmail.com"
                    helperText="Servidor SMTP de tu proveedor de email"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Puerto SMTP"
                    value={emailConfig.smtpPort}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpPort: e.target.value})}
                    placeholder="587"
                    helperText="Puerto del servidor SMTP (587, 465, 25)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Usuario SMTP"
                    value={emailConfig.smtpUser}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpUser: e.target.value})}
                    placeholder="tu-email@gmail.com"
                    helperText="Usuario para autenticación SMTP"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contraseña SMTP"
                    type="password"
                    value={emailConfig.smtpPassword}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpPassword: e.target.value})}
                    placeholder="••••••••••••"
                    helperText="Contraseña o App Password"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Remitente"
                    value={emailConfig.fromName}
                    onChange={(e) => setEmailConfig({...emailConfig, fromName: e.target.value})}
                    placeholder="PulseJournal"
                    helperText="Nombre que aparecerá como remitente"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email del Remitente"
                    type="email"
                    value={emailConfig.fromEmail}
                    onChange={(e) => setEmailConfig({...emailConfig, fromEmail: e.target.value})}
                    placeholder="noreply@pulsejournal.com"
                    helperText="Email que aparecerá como remitente"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveEmailConfig}
                  disabled={!emailConfig.smtpHost || !emailConfig.fromEmail}
                >
                  Guardar Configuración
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={loadingAirtable ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={testEmailConfig}
                  disabled={loadingAirtable || !emailConfig.smtpHost || !emailConfig.fromEmail || !emailConfig.smtpUser}
                >
                  {loadingAirtable ? 'Probando...' : 'Probar SMTP'}
                </Button>
                
                {emailConfigSaved && (
                  <Chip 
                    label="Configuración guardada"
                    color="success"
                    icon={<CheckIcon />}
                  />
                )}
              </Box>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Firma digital (opcional)"
                  value={emailSignature}
                  onChange={e => setEmailSignature(e.target.value)}
                  placeholder="Ej: Pablo Alvarez\nDirector de PulseJournal\nwww.pulsejournal.com"
                  multiline
                  minRows={2}
                  maxRows={4}
                  helperText="Esta firma se agregará automáticamente al final de tus correos."
                />
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={saveEmailSignature}
                  disabled={!emailSignature}
                >
                  Guardar Firma
                </Button>
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="URL de imagen de firma digital (opcional)"
                  value={signatureImageUrl}
                  onChange={e => setSignatureImageUrl(e.target.value)}
                  placeholder="https://.../firma.png"
                  helperText="Pega aquí la URL de tu imagen de firma (PNG/JPG)"
                />
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, ml: 1 }}
                  onClick={saveSignatureImageUrl}
                  disabled={!signatureImageUrl}
                >
                  Guardar Imagen
                </Button>
                {signatureImageUrl && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption">Vista previa de la firma:</Typography>
                    <img src={signatureImageUrl} alt="Firma digital" style={{ maxWidth: 220, display: 'block', marginTop: 8, borderRadius: 4, border: '1px solid #eee' }} />
                  </Box>
                )}
              </Grid>
            </Paper>

            {/* Segmentación de Audiencia */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon color="primary" />
                Segmentación de Audiencia
              </Typography>
              
              {/* Selector de campo para analizar */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Selecciona un campo para analizar</InputLabel>
                    <Select
                      value={segmentation.selectedField}
                      label="Selecciona un campo para analizar"
                      onChange={(e) => {
                        setSegmentation(prev => ({ ...prev, selectedField: e.target.value }));
                        analyzeFieldInfo(e.target.value);
                      }}
                    >
                      {getAvailableFields().map(field => (
                        <MenuItem key={field} value={field}>
                          {field}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  {segmentInfo && (
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Campo "{segmentInfo.field}":</strong> {segmentInfo.totalUsers} usuarios con datos • {segmentInfo.values.length} valores únicos
                        {segmentInfo.similarGroups && segmentInfo.similarGroups.length > 0 && (
                          <> • {segmentInfo.similarGroups.length} grupos similares detectados</>
                        )}
                      </Typography>
                    </Alert>
                  )}
                </Grid>
              </Grid>

              {/* Información detallada del bloque seleccionado */}
              {segmentInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Distribución de valores en "{segmentInfo.field}":
                  </Typography>
                  
                  {/* Mostrar grupos similares detectados */}
                  {segmentInfo.similarGroups && segmentInfo.similarGroups.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="warning.main" gutterBottom>
                        ⚠️ Grupos similares detectados:
                      </Typography>
                      {segmentInfo.similarGroups.map((group, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: 'warning.light', borderColor: 'warning.main' }}>
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              Grupo: "{group.mainValue}" + similares
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Valores similares: {group.similar.join(', ')}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                label={`${group.totalCount} usuarios totales`} 
                                size="small" 
                                color="warning"
                              />
                            </Box>
                          </CardContent>
                          <CardActions sx={{ pt: 0 }}>
                            <Button 
                              size="small" 
                              onClick={() => {
                                setSegmentation(prev => ({ 
                                  ...prev, 
                                  filterValue: group.mainValue,
                                  filterType: 'contains'
                                }));
                              }}
                            >
                              Usar grupo principal
                            </Button>
                          </CardActions>
                        </Card>
                      ))}
                    </Box>
                  )}
                  
                  <Grid container spacing={1}>
                    {segmentInfo.values.slice(0, 12).map((item, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box 
                          sx={{ 
                            p: 2, 
                            border: '1px solid #ddd', 
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => {
                            setSegmentation(prev => ({ 
                              ...prev, 
                              filterValue: item.value,
                              filterType: 'equals'
                            }));
                          }}
                        >
                          <Typography variant="body2" fontWeight="medium" noWrap>
                            {item.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.count} usuarios ({Math.round((item.count / segmentInfo.totalUsers) * 100)}%)
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                    {segmentInfo.values.length > 12 && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Y {segmentInfo.values.length - 12} valores más...
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Filtros de segmentación */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filtrar usuarios:
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Condición</InputLabel>
                    <Select
                      value={segmentation.filterType}
                      label="Condición"
                      onChange={(e) => setSegmentation(prev => ({ ...prev, filterType: e.target.value }))}
                    >
                      <MenuItem value="equals">Igual a</MenuItem>
                      <MenuItem value="contains">Contiene</MenuItem>
                      <MenuItem value="greater">Mayor que</MenuItem>
                      <MenuItem value="less">Menor que</MenuItem>
                      <MenuItem value="not_equals">Excluir (igual a)</MenuItem>
                      <MenuItem value="not_contains">Excluir (contiene)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small" 
                    label="Valor"
                    value={segmentation.filterValue}
                    onChange={(e) => setSegmentation(prev => ({ ...prev, filterValue: e.target.value }))}
                    placeholder="Valor para filtrar"
                    helperText="Ej: deporte, política, tecnología"
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={applySegmentationFilter}
                      disabled={!segmentation.selectedField || !segmentation.filterValue}
                      sx={{ height: '40px' }}
                      startIcon={<AnalyticsIcon />}
                    >
                      Filtro Normal
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      onClick={applyIntelligentFilter}
                      disabled={!segmentation.selectedField || !segmentation.filterValue}
                      sx={{ height: '40px' }}
                      startIcon={<AnalyticsIcon />}
                    >
                      🧠 Filtro Inteligente
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setFilteredUsers([]);
                      setSegmentation(prev => ({ ...prev, filterValue: '' }));
                    }}
                    sx={{ height: '84px' }}
                  >
                    Limpiar Filtro
                  </Button>
                </Grid>
              </Grid>

              {/* Mostrar términos expandidos */}
              {segmentation.filterValue && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    🔍 Vista previa de términos que se buscarán:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {expandFilterTerm(segmentation.filterValue).slice(0, 8).map((term, index) => (
                      <Chip 
                        key={index}
                        label={term}
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          setSegmentation(prev => ({ ...prev, filterValue: term }));
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                    {expandFilterTerm(segmentation.filterValue).length > 8 && (
                      <Chip 
                        label={`+${expandFilterTerm(segmentation.filterValue).length - 8} más`}
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 El filtro inteligente buscará automáticamente estas variaciones y sinónimos
                  </Typography>
                </Box>
              )}

              {/* Resultado del filtro */}
              {filteredUsers.length > 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>✅ Filtro aplicado:</strong> {filteredUsers.length} usuarios encontrados de {airtableUsers.length} total
                  </Typography>
                </Alert>
              )}
            </Paper>

            {/* Formulario de Correo */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Crear y Enviar Correos
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Asunto del Correo"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Ej: Hola {{Nombre}}, bienvenido a PulseJournal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Destinatarios</InputLabel>
                    <Select
                      value={recipientType}
                      label="Tipo de Destinatarios"
                      onChange={(e) => setRecipientType(e.target.value)}
                    >
                      <MenuItem value="all">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GroupIcon color="primary" />
                          Todos los usuarios ({airtableUsers.length})
                        </Box>
                      </MenuItem>
                      <MenuItem value="filtered" disabled={filteredUsers.length === 0}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AnalyticsIcon color="secondary" />
                          Usuarios filtrados ({filteredUsers.length})
                        </Box>
                      </MenuItem>
                      <MenuItem value="manual">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EditIcon color="warning" />
                          Escribir correos manualmente
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Campo para correos manuales */}
                {recipientType === 'manual' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Correos electrónicos (separados por comas)"
                      placeholder="email1@ejemplo.com, email2@ejemplo.com, email3@ejemplo.com"
                      helperText="Escribe los correos electrónicos separados por comas"
                      value={manualEmails}
                      onChange={(e) => setManualEmails(e.target.value)}
                    />
                  </Grid>
                )}
                
                {/* Información de destinatarios */}
                {recipientType !== 'manual' && airtableConnected && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        {recipientType === 'all' 
                          ? `Se enviarán correos a todos los ${airtableUsers.length} usuarios de Airtable`
                          : `Se enviarán correos a ${filteredUsers.length} usuarios filtrados`
                        }
                      </Typography>
                    </Alert>
                  </Grid>
                )}
                
                {/* Variables de Airtable */}
                {airtableConnected && recipientType !== 'manual' && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Variables disponibles de Airtable:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {getAvailableFields().map(field => (
                          <Chip
                            key={field}
                            label={`{{${field}}}`}
                            size="small"
                            onClick={() => {
                              setEmailTemplate(prev => prev + `{{${field}}}`);
                            }}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Haz clic en una variable para agregarla al contenido
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Contenido del Correo"
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                    placeholder={
                      recipientType === 'manual' 
                        ? "Hola,\n\nEste es el contenido de tu correo.\n\nSaludos,\nEl equipo de PulseJournal"
                        : airtableConnected 
                        ? "Hola {{Nombre}},\n\nGracias por registrarte. Tu email {{Email}} ha sido confirmado.\n\nSaludos,\nEl equipo de PulseJournal"
                        : "Escribe el contenido de tu correo aquí..."
                    }
                    helperText={
                      recipientType === 'manual' 
                        ? "Contenido estático sin variables personalizadas"
                        : airtableConnected 
                        ? "Usa las variables de Airtable. Soporta HTML básico."
                        : "Conecta con Airtable para usar variables personalizadas"
                    }
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={improveEmailContent}
                      disabled={improvingEmail || !emailTemplate}
                      startIcon={improvingEmail ? <CircularProgress size={18} /> : <span role="img" aria-label="IA">🤖</span>}
                    >
                      {improvingEmail ? 'Mejorando...' : 'Mejorar'}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Usa IA para mejorar la redacción y agregar la firma digital
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      startIcon={loadingAirtable ? <CircularProgress size={20} /> : <SendIcon />}
                      size="large"
                      onClick={sendSegmentedEmails}
                      disabled={
                        loadingAirtable || 
                        !emailSubject || 
                        !emailTemplate || 
                        (recipientType !== 'manual' && (!airtableConnected || !emailField)) ||
                        !emailConfigSaved ||
                        (recipientType === 'filtered' && filteredUsers.length === 0) ||
                        (recipientType === 'manual' && !manualEmails.trim())
                      }
                      sx={{ minWidth: 200 }}
                    >
                      {loadingAirtable ? 'Enviando...' : (() => {
                        switch (recipientType) {
                          case 'all':
                            const allEmails = getEmailsFromUsers(airtableUsers);
                            return `Enviar a todos (${allEmails.length} emails)`;
                          case 'filtered':
                            const filteredEmails = getEmailsFromUsers(filteredUsers);
                            return `Enviar a filtrados (${filteredEmails.length} emails)`;
                          case 'manual':
                            const manualList = manualEmails.split(',').map(e => e.trim()).filter(e => e);
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            const validManualEmails = manualList.filter(email => emailRegex.test(email));
                            return `Enviar manualmente (${validManualEmails.length} emails)`;
                          default:
                            return 'Enviar';
                        }
                      })()}
                    </Button>
                    
                    {/* Indicadores de estado */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`Airtable: ${airtableConnected ? '✓' : '✗'}`}
                        color={airtableConnected ? 'success' : 'warning'}
                        size="small"
                      />
                      <Chip
                        label={`SMTP: ${emailConfigSaved ? '✓' : '✗'}`}
                        color={emailConfigSaved ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  {(!airtableConnected || !emailConfigSaved || !emailField) && recipientType !== 'manual' && (
                    <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                      {!airtableConnected && 'Conecta Airtable'} 
                      {!airtableConnected && (!emailConfigSaved || !emailField) && ', '}
                      {!emailField && airtableConnected && 'selecciona el campo de email'}
                      {!emailField && !emailConfigSaved && airtableConnected && ' y '}
                      {!emailConfigSaved && 'configura SMTP'} para enviar
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </TabPanel>
      </Paper>

      {/* FAB para crear código personalizado - solo visible en tab de códigos */}
      {activeTab === 0 && (
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>
      )}

      {/* Dialog para código personalizado */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Código Personalizado</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prefijo"
                value={newCodeData.prefix}
                onChange={(e) => setNewCodeData({...newCodeData, prefix: e.target.value.toUpperCase()})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Usos máximos"
                type="number"
                value={newCodeData.maxUses}
                onChange={(e) => setNewCodeData({...newCodeData, maxUses: parseInt(e.target.value)})}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Usuario</InputLabel>
                <Select
                  value={newCodeData.userType}
                  label="Tipo de Usuario"
                  onChange={(e) => setNewCodeData({...newCodeData, userType: e.target.value})}
                >
                  {USER_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: type.color
                          }}
                        />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Créditos"
                type="number"
                value={newCodeData.credits}
                onChange={(e) => setNewCodeData({...newCodeData, credits: parseInt(e.target.value)})}
                inputProps={{ min: 0, max: 10000 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={newCodeData.description}
                onChange={(e) => setNewCodeData({...newCodeData, description: e.target.value})}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Expiración"
                value={newCodeData.expiresIn}
                onChange={(e) => setNewCodeData({...newCodeData, expiresIn: e.target.value})}
              >
                <MenuItem value="">Sin expiración</MenuItem>
                <MenuItem value="7">7 días</MenuItem>
                <MenuItem value="30">30 días</MenuItem>
                <MenuItem value="90">90 días</MenuItem>
                <MenuItem value="365">1 año</MenuItem>
              </TextField>
            </Grid>
            
            {/* Vista previa del código */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Vista previa:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {getUserTypeChip(newCodeData.userType)}
                <Chip 
                  label={`${newCodeData.credits} créditos`} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={`${newCodeData.maxUses} uso${newCodeData.maxUses > 1 ? 's' : ''}`} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={() => generateCode()} variant="contained">
            Generar Código
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {codeToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                ¿Estás seguro de que quieres eliminar este código?
              </Typography>
              <Box sx={{ 
                p: 2, 
                mt: 2, 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Código: {codeToDelete.code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {codeToDelete.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {getUserTypeChip(codeToDelete.user_type)}
                  <Chip 
                    label={`${codeToDelete.credits} créditos`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => codeToDelete && deleteCode(codeToDelete)} 
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configuración de Campo de Email */}
      {airtableConnected && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            Campo de Email de Airtable
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Campo que contiene los emails</InputLabel>
                <Select
                  value={emailField}
                  label="Campo que contiene los emails"
                  onChange={(e) => setEmailField(e.target.value)}
                >
                  {getAvailableFields().map(field => (
                    <MenuItem key={field} value={field}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>{field}</span>
                        {(() => {
                          const validation = validateEmailField(field);
                          return validation.valid > 0 ? (
                            <Chip 
                              label={`${validation.valid} válidos`} 
                              size="small" 
                              color="success"
                            />
                          ) : (
                            <Chip 
                              label="No emails" 
                              size="small" 
                              color="default"
                            />
                          );
                        })()}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                onClick={() => {
                  const detected = detectEmailField();
                  if (detected) {
                    setEmailField(detected);
                    setSuccess(`Campo de email detectado automáticamente: "${detected}"`);
                  } else {
                    setError('No se pudo detectar automáticamente un campo de email');
                  }
                }}
                startIcon={<AnalyticsIcon />}
                sx={{ height: '56px' }}
              >
                Detectar Automáticamente
              </Button>
            </Grid>
          </Grid>

          {/* Validación del campo seleccionado */}
          {emailField && (
            <Box>
              {(() => {
                const validation = validateEmailField(emailField);
                return (
                  <Alert 
                    severity={validation.valid > 0 ? "success" : "warning"}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      <strong>Campo "{emailField}":</strong> {validation.valid} emails válidos, {validation.invalid} inválidos o vacíos
                      {validation.examples.length > 0 && (
                        <>
                          <br />
                          <strong>Ejemplos:</strong> {validation.examples.join(', ')}
                        </>
                      )}
                    </Typography>
                  </Alert>
                );
              })()}
            </Box>
          )}
        </Paper>
      )}

      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Vista previa del correo:</Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafbfc', minHeight: 120 }}>
          {
            (() => {
              // --- Lógica de reemplazo de variables y firma para la vista previa ---
              let previewContent = emailTemplate;
              let previewSignature = emailSignature;
              let previewSignatureImg = signatureImageUrl;
              // 1. Obtener valores de ejemplo para variables
              let exampleFields: Record<string, string> = {
                Nombre: 'Juan Pérez',
                Email: 'juan@email.com',
                Empresa: 'PulseJournal',
                Ciudad: 'Guatemala',
                // Puedes agregar más ejemplos aquí
              };
              // Si hay conexión a Airtable y usuarios, usar el primero
              if (airtableConnected && airtableUsers.length > 0) {
                Object.keys(airtableUsers[0].fields).forEach(field => {
                  exampleFields[field] = String(airtableUsers[0].fields[field]);
                });
              }
              // 2. Reemplazar variables {{campo}} en el contenido
              previewContent = previewContent.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
                return exampleFields[p1.trim()] || match;
              });
              // 3. Agregar firma digital si existe
              if (previewSignature || previewSignatureImg) {
                previewContent += '<br><br><hr style="margin:16px 0;opacity:0.2;">';
                if (previewSignature) {
                  previewContent += `<div style='white-space:pre-line;font-family:inherit;'>${previewSignature}</div>`;
                }
                if (previewSignatureImg) {
                  previewContent += `<div><img src='${previewSignatureImg}' alt='Firma digital' style='max-width:220px;margin-top:8px;border-radius:4px;border:1px solid #eee;'/></div>`;
                }
              }
              return <div dangerouslySetInnerHTML={{ __html: previewContent }} />;
            })()
          }
        </Paper>
      </Grid>

    </Container>
  );
} 