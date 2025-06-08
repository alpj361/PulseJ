import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../context/AuthContext';
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
  Tab,
  FormControlLabel,
  Checkbox
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
  Analytics as AnalyticsIcon,
  // 💳 Nuevos iconos para sistema de créditos
  AccountBalance as CreditsIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  AttachMoney as MoneyIcon,
  // 📊 Iconos para sistema de logs
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
  Error as ErrorIcon,
  BugReport as BugReportIcon,
  // 🔍 Iconos adicionales para logs avanzados
  Search as SearchIcon,
  Clear as ClearIcon,
  Computer as ComputerIcon,
  Visibility as VisibilityIcon
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

// 💳 Nuevas interfaces para sistema de créditos
interface CreditsDashboard {
  general_stats: {
    total_users: number;
    total_credits_in_system: number;
    average_credits_per_user: number;
    total_operations_30d: number;
    total_credits_consumed_30d: number;
    low_credit_users_count: number;
  };
  operation_stats: Array<{
    operation: string;
    count: number;
    credits_consumed: number;
    avg_credits_per_operation: number;
  }>;
  users: Array<{
    id: string;
    email: string;
    user_type: string;
    role: string;
    credits: string | number;
    credits_numeric: number | null;
    is_low_credits: boolean;
    created_at: string;
  }>;
  low_credit_users: Array<{
    email: string;
    credits: number;
    user_type: string;
  }>;
  recent_logs: Array<{
    user_email: string;
    operation: string;
    credits_consumed: number;
    timestamp: string;
    ip_address: string;
    response_time: number;
  }>;
  daily_metrics: Array<{
    date: string;
    operations: number;
    credits_consumed: number;
  }>;
  top_users_by_consumption: Array<{
    email: string;
    operations: number;
    credits: number;
  }>;
  user_type_distribution: Array<{
    user_type: string;
    count: number;
  }>;
}

interface UserCredit {
  id: string;
  email: string;
  user_type: string;
  role: string;
  credits: string | number;
  credits_numeric: number | null;
  is_low_credits: boolean;
  created_at: string;
  updated_at: string;
}

interface OperationLog {
  user_email: string;
  operation: string;
  credits_consumed: number;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  response_time: number;
  request_params: string;
}

// 📊 Interfaces para Sistema de Logs
interface SystemExecutionLog {
  id: number;
  execution_id: string;
  script_name: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  status: 'running' | 'completed' | 'failed' | 'partial';
  trends_found: number;
  tweets_found: number;
  tweets_processed: number;
  tweets_saved: number;
  tweets_failed: number;
  duplicates_skipped: number;
  ai_requests_made: number;
  ai_requests_successful: number;
  ai_requests_failed: number;
  total_tokens_used: number;
  estimated_cost_usd: number;
  categoria_stats: Record<string, number>;
  sentimiento_stats: Record<string, number>;
  intencion_stats: Record<string, number>;
  propagacion_stats: Record<string, number>;
  error_details: Array<{
    timestamp: string;
    error: string;
    context: string;
    stack?: string;
  }>;
  warnings: Array<{
    timestamp: string;
    warning: string;
    context: string;
  }>;
  metadata: Record<string, any>;
}

interface ExecutionSummary {
  execution_id: string;
  script_name: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  status: string;
  tweets_processed: number;
  tweets_saved: number;
  ai_requests_made: number;
  estimated_cost_usd: number;
  success_rate_percent: number;
  ai_success_rate_percent: number;
  cost_per_tweet: number;
}

interface DailyCostStats {
  date: string;
  executions: number;
  total_tweets: number;
  total_cost: number;
  avg_cost_per_execution: number;
  max_cost: number;
  total_ai_requests: number;
}

interface WeeklyPerformanceStats {
  week: string;
  executions: number;
  avg_duration: number;
  avg_tweets_per_execution: number;
  total_cost: number;
  failed_executions: number;
}

interface SystemLogsDashboard {
  executions: ExecutionSummary[];
  daily_costs: DailyCostStats[];
  weekly_performance: WeeklyPerformanceStats[];
  total_stats: {
    total_executions: number;
    total_cost_month: number;
    avg_success_rate: number;
    total_tweets_processed: number;
    avg_cost_per_tweet: number;
  };
}

// 📊 Nuevas interfaces para estadísticas avanzadas de logs
interface LogsStatsResponse {
  success: boolean;
  statistics: {
    overview: {
      total_logs: number;
      user_logs: number;
      system_logs: number;
      success_logs: number;
      error_logs: number;
      total_credits_consumed: number;
      period_days: number;
    };
    by_type: {
      user: {
        total: number;
        success: number;
        errors: number;
        credits_consumed: number;
        operations: Record<string, { count: number; credits: number; errors: number }>;
      };
      system: {
        total: number;
        success: number;
        errors: number;
        credits_consumed: number;
        operations: Record<string, { count: number; credits: number; errors: number }>;
      };
    };
    top_operations: Array<{
      operation: string;
      count: number;
      credits: number;
      errors: number;
      types: string[];
      success_rate: string;
    }>;
    daily_breakdown: Array<{
      date: string;
      user_logs: number;
      system_logs: number;
      success_logs: number;
      error_logs: number;
      credits_consumed: number;
    }>;
    error_summary: Array<{
      operation: string;
      log_type: string;
      timestamp: string;
      user_role: string;
      source: string;
    }>;
    sources: {
      usage_logs: number;
      system_execution_logs: number;
    };
  };
  metadata: {
    period: string;
    generated_at: string;
    generated_by: string;
    timezone: string;
    tables_consulted: string[];
  };
}

interface EnhancedLog {
  id?: string;
  user_id?: string;
  user_email: string;
  user_role: string;
  operation: string;
  log_type: 'user' | 'system';
  credits_consumed: number;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  request_data: any;
  error_data?: any;
  is_system: boolean;
  is_success: boolean;
  formatted_time: string;
  source_table: string;
  execution_time?: string;
  system_metrics?: {
    trends_found?: number;
    tweets_found?: number;
    tweets_processed?: number;
    tweets_saved?: number;
    tweets_failed?: number;
    ai_requests_made?: number;
    ai_requests_successful?: number;
    estimated_cost_usd?: number;
  };
}

interface LogsFiltersAdvanced {
  user_email: string;
  operation: string;
  log_type: 'all' | 'user' | 'system';
  success: 'all' | 'true' | 'false';
  days: number;
  limit: number;
  offset: number;
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
  const { session } = useAuth();
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

  // 💳 Estados para sistema de créditos
  const [creditsDashboard, setCreditsDashboard] = useState<CreditsDashboard | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);
  const [openAddCreditsDialog, setOpenAddCreditsDialog] = useState(false);
  const [addCreditsAmount, setAddCreditsAmount] = useState<number>(0);
  const [usersFilters, setUsersFilters] = useState({
    user_type: '',
    role: '',
    low_credits: false,
    order_by: 'created_at',
    order_direction: 'desc'
  });
  const [logsFilters, setLogsFilters] = useState({
    user_email: '',
    operation: '',
    days: 7
  });

  // 💳 Estados para mostrar gráficos
  const [signatureImageUrl, setSignatureImageUrl] = useState(() => {
    return localStorage.getItem('signatureImageUrl') || '';
  });
  const [improvingEmail, setImprovingEmail] = useState(false);

  // 📊 Estados para Sistema de Logs
  const [systemLogsDashboard, setSystemLogsDashboard] = useState<SystemLogsDashboard | null>(null);
  const [loadingSystemLogs, setLoadingSystemLogs] = useState(false);
  const [systemExecutions, setSystemExecutions] = useState<ExecutionSummary[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCostStats[]>([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState<WeeklyPerformanceStats[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<SystemExecutionLog | null>(null);
  const [openExecutionDialog, setOpenExecutionDialog] = useState(false);
  const [systemLogsFilters, setSystemLogsFilters] = useState({
    script_name: '',
    status: '',
    days: 7
  });

  // 🔄 Estados para Re-análisis de Tweets
  const [reanalyzingTweets, setReanalyzingTweets] = useState(false);
  const [reanalysisOptions, setReanalysisOptions] = useState({
    limit: 20,
    force_all: false,
    only_failed: false
  });
  const [openReanalysisDialog, setOpenReanalysisDialog] = useState(false);
  const [reanalysisResult, setReanalysisResult] = useState<any>(null);

  // 📊 Estados para estadísticas avanzadas de logs
  const [logsStatsData, setLogsStatsData] = useState<LogsStatsResponse | null>(null);
  const [enhancedLogs, setEnhancedLogs] = useState<EnhancedLog[]>([]);
  const [loadingLogsStats, setLoadingLogsStats] = useState(false);
  const [loadingAdvancedLogs, setLoadingAdvancedLogs] = useState(false);
  const [logsFiltersAdvanced, setLogsFiltersAdvanced] = useState<LogsFiltersAdvanced>({
    user_email: '',
    operation: '',
    log_type: 'all',
    success: 'all',
    days: 7,
    limit: 50,
    offset: 0
  });
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<EnhancedLog | null>(null);
  const [openLogDetailsDialog, setOpenLogDetailsDialog] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Effects
  useEffect(() => {
    loadCodes();
  }, []);

  // 💳 Cargar datos de créditos cuando se cambie a esas pestañas
  useEffect(() => {
    if (activeTab === 2) { // Dashboard Créditos
      loadCreditsDashboard();
    } else if (activeTab === 3) { // Gestión Usuarios
      loadUsersWithFilters();
      loadLogsWithFilters();
    } else if (activeTab === 4) { // Sistema de Logs
      loadSystemLogsDashboard();
    } else if (activeTab === 5) { // Logs Avanzados
      loadAdvancedLogsStats(); // Cargar estadísticas avanzadas
      loadAdvancedLogs(); // Cargar logs detallados
    }
  }, [activeTab]);

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

  // 🔍 Debug useEffect para sesión
  useEffect(() => {
    console.log('🔍 [AdminPanel] Session Debug:', {
      session: session,
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      accessToken: session?.access_token,
      user: session?.user,
      userEmail: session?.user?.email
    });
  }, [session]);

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
    if (!emailTemplate.trim()) {
      setError('Por favor ingresa contenido de email para mejorar');
      return;
    }

    setImprovingEmail(true);
    try {
      // Crear un prompt mejorado para el contenido del email
      const improvedContent = `Versión mejorada de: ${emailTemplate}

Este contenido ha sido optimizado para mejor claridad y profesionalismo.`;
      setEmailTemplate(improvedContent);
      setSuccess('¡Contenido del email mejorado!');
    } catch (error) {
      console.error('Error mejorando email:', error);
      setError('Error al mejorar el contenido del email');
    } finally {
      setImprovingEmail(false);
    }
  };

  // 💳 ============ FUNCIONES PARA SISTEMA DE CRÉDITOS ============

  // Obtener token de autorización
  const getAuthToken = () => {
    // Debug: verificar sesión completa
    console.log('🔍 Debug getAuthToken - session completa:', session);
    console.log('🔍 Debug getAuthToken - session?.access_token:', session?.access_token);
    console.log('🔍 Debug getAuthToken - session?.user:', session?.user);
    
    // Usar el token de la sesión de Supabase
    // El token está en session.access_token según la documentación de Supabase
    const token = session?.access_token;
    if (!token) {
      console.error('❌ No se encontró token en session?.access_token');
      console.log('🔍 Estructura de session disponible:', Object.keys(session || {}));
      setError('Token de autorización no encontrado. Por favor inicia sesión nuevamente.');
      return null;
    }
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');
    return token;
  };

  // Cargar dashboard de créditos
  const loadCreditsDashboard = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoadingCredits(true);
    try {
      const response = await fetch('https://server.standatpd.com/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCreditsDashboard(data);
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        setError(`Error cargando dashboard: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setError('Error de conexión al cargar dashboard de créditos');
    } finally {
      setLoadingCredits(false);
    }
  };

  // Cargar usuarios con filtros
  const loadUsersWithFilters = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoadingCredits(true);
    try {
      const params = new URLSearchParams();
      if (usersFilters.user_type) params.append('user_type', usersFilters.user_type);
      if (usersFilters.role) params.append('role', usersFilters.role);
      if (usersFilters.low_credits) params.append('low_credits', 'true');
      params.append('order_by', usersFilters.order_by);
      params.append('order_direction', usersFilters.order_direction);
      params.append('limit', '50');

      const response = await fetch(`https://server.standatpd.com/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        setError(`Error cargando usuarios: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError('Error de conexión al cargar usuarios');
    } finally {
      setLoadingCredits(false);
    }
  };

  // Cargar logs con filtros
  const loadLogsWithFilters = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoadingCredits(true);
    try {
      const params = new URLSearchParams();
      if (logsFilters.user_email) params.append('user_email', logsFilters.user_email);
      if (logsFilters.operation) params.append('operation', logsFilters.operation);
      params.append('days', logsFilters.days.toString());
      params.append('limit', '50');

      const response = await fetch(`https://server.standatpd.com/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        const errorData = await response.json();
        setError(`Error cargando logs: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
      setError('Error de conexión al cargar logs');
    } finally {
      setLoadingCredits(false);
    }
  };

  // Agregar créditos a usuario
  const addCreditsToUser = async () => {
    if (!selectedUser || addCreditsAmount <= 0) {
      setError('Por favor selecciona un usuario y un monto válido');
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('https://server.standatpd.com/api/credits/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_email: selectedUser.email,
          credits_to_add: addCreditsAmount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`✅ ${data.message}`);
        setOpenAddCreditsDialog(false);
        setAddCreditsAmount(0);
        setSelectedUser(null);
        // Recargar datos
        await loadCreditsDashboard();
      } else {
        const errorData = await response.json();
        setError(`Error agregando créditos: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error agregando créditos:', error);
      setError('Error de conexión al agregar créditos');
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear número con separadores de miles
  const formatNumber = (num: number) => {
    return num.toLocaleString('es-ES');
  };

  // 📊 Funciones para estadísticas avanzadas de logs


  const loadAdvancedLogs = async () => {
    await loadUserLogs();
  };

  const resetLogsFilters = () => {
    resetUserLogsFilters();
  };

  const applyErrorsFilter = () => {
    applyUserErrorsFilter();
  };

  // 💳 ============ FIN FUNCIONES CRÉDITOS ============

  // 📊 Funciones para Sistema de Logs (conectando directamente a Supabase)
  const loadSystemLogsDashboard = async () => {
    try {
      setLoadingSystemLogs(true);
      setError(null);

      // Conectar directamente a Supabase (mismas credenciales que NewsCron)
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://qqshdccpmypelhmyqnut.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxc2hkY2NwbXlwZWxobXlxbnV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAzNjcxMSwiZXhwIjoyMDYxNjEyNzExfQ.BaJ_z3Gp2pUnmYEDpfNTCIxpHloSjmxi43aKwm-93ZI'
      );

      // Obtener datos del dashboard
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        { data: executions, error: executionsError },
        { data: dailyCosts, error: dailyCostsError },
        { data: weeklyPerformance, error: weeklyError }
      ] = await Promise.all([
        supabase
          .from('admin_execution_summary')
          .select('*')
          .gte('started_at', thirtyDaysAgo.toISOString())
          .order('started_at', { ascending: false })
          .limit(20),
        supabase
          .from('daily_cost_stats')
          .select('*')
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(30),
        supabase
          .from('weekly_performance_stats')
          .select('*')
          .order('week', { ascending: false })
          .limit(8)
      ]);

      if (executionsError) throw executionsError;
      if (dailyCostsError) throw dailyCostsError;
      if (weeklyError) throw weeklyError;

      // Calcular estadísticas generales
      const totalExecutions = executions?.length || 0;
      const completedExecutions = executions?.filter(e => e.status === 'completed') || [];
      const totalCost = completedExecutions.reduce((sum, e) => sum + parseFloat(e.estimated_cost_usd || 0), 0);
      const totalTweets = completedExecutions.reduce((sum, e) => sum + (e.tweets_processed || 0), 0);
      const avgSuccessRate = totalExecutions > 0 
        ? completedExecutions.reduce((sum, e) => sum + (e.success_rate_percent || 0), 0) / completedExecutions.length 
        : 0;

      const dashboard = {
        executions: executions || [],
        daily_costs: dailyCosts || [],
        weekly_performance: weeklyPerformance || [],
        total_stats: {
          total_executions: totalExecutions,
          total_cost_month: totalCost,
          avg_success_rate: avgSuccessRate,
          total_tweets_processed: totalTweets,
          avg_cost_per_tweet: totalTweets > 0 ? totalCost / totalTweets : 0
        }
      };

      setSystemLogsDashboard(dashboard);
      setSystemExecutions(executions || []);
      setDailyCosts(dailyCosts || []);
      setWeeklyPerformance(weeklyPerformance || []);

    } catch (error: any) {
      console.error('Error cargando dashboard de logs:', error);
      setError('Error cargando datos del sistema de logs: ' + error.message);
    } finally {
      setLoadingSystemLogs(false);
    }
  };

  const loadExecutionDetails = async (executionId: string) => {
    try {
      setError(null);

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://qqshdccpmypelhmyqnut.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxc2hkY2NwbXlwZWxobXlxbnV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAzNjcxMSwiZXhwIjoyMDYxNjEyNzExfQ.BaJ_z3Gp2pUnmYEDpfNTCIxpHloSjmxi43aKwm-93ZI'
      );

      const { data, error } = await supabase
        .from('system_execution_logs')
        .select('*')
        .eq('execution_id', executionId)
        .single();

      if (error) throw error;

      setSelectedExecution(data);
      setOpenExecutionDialog(true);

    } catch (error: any) {
      console.error('Error cargando detalles de ejecución:', error);
      setError('Error cargando detalles de ejecución: ' + error.message);
    }
  };

  const getStatusChipForExecution = (status: string) => {
    const statusConfig = {
      completed: { color: 'success' as const, label: 'Completado' },
      failed: { color: 'error' as const, label: 'Fallido' },
      running: { color: 'info' as const, label: 'Ejecutando' },
      partial: { color: 'warning' as const, label: 'Parcial' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { color: 'default' as const, label: status };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // 🔄 Función para re-analizar tweets
  const reanalyzeTweets = async () => {
    if (!session?.access_token) {
      setError('Token de autorización no disponible');
      return;
    }

    setReanalyzingTweets(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 Iniciando re-análisis de tweets...', reanalysisOptions);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reanalyze-tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(reanalysisOptions)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${data.error}`);
      }

      console.log('✅ Re-análisis completado:', data);
      
      setReanalysisResult(data);
      setSuccess(
        `Re-análisis completado exitosamente. ` +
        `${data.results?.tweets_processed || reanalysisOptions.limit} tweets procesados, ` +
        `${data.results?.tweets_updated || 0} actualizados. ` +
        `Tasa de éxito: ${data.results?.success_rate || 'No disponible'}.`
      );
      
      // Cerrar el diálogo y refrescar datos
      setOpenReanalysisDialog(false);
      
      // Refrescar dashboard del sistema si está cargado
      if (systemLogsDashboard) {
        loadSystemLogsDashboard();
      }

    } catch (error: any) {
      console.error('❌ Error en re-análisis:', error);
      setError(`Error al re-analizar tweets: ${error.message}`);
    } finally {
      setReanalyzingTweets(false);
    }
  };

  // 📊 Funciones para estadísticas avanzadas de logs - SOLO USUARIOS
  const loadAdvancedLogsStats = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoadingLogsStats(true);
    try {
      const params = new URLSearchParams();
      params.append('days', logsFiltersAdvanced.days.toString());
      params.append('log_type', 'user'); // Solo logs de usuario

      const response = await fetch(`https://server.standatpd.com/api/admin/logs/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogsStatsData(data);
      } else {
        const errorData = await response.json();
        setError(`Error cargando estadísticas de logs de usuario: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error cargando estadísticas de logs de usuario:', error);
      setError('Error de conexión al cargar estadísticas de logs de usuario');
    } finally {
      setLoadingLogsStats(false);
    }
  };

  const loadUserLogs = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoadingAdvancedLogs(true);
    try {
      const params = new URLSearchParams();
      if (logsFiltersAdvanced.user_email) params.append('user_email', logsFiltersAdvanced.user_email);
      if (logsFiltersAdvanced.operation && logsFiltersAdvanced.operation !== 'all') params.append('operation', logsFiltersAdvanced.operation);
      params.append('log_type', 'user'); // Forzar solo logs de usuario
      if (logsFiltersAdvanced.success !== 'all') params.append('success', logsFiltersAdvanced.success);
      params.append('days', logsFiltersAdvanced.days.toString());
      params.append('limit', logsFiltersAdvanced.limit.toString());
      params.append('offset', logsFiltersAdvanced.offset.toString());

      const response = await fetch(`https://server.standatpd.com/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar solo logs de usuario por seguridad adicional
        const userOnlyLogs = (data.logs || []).filter((log: EnhancedLog) => log.log_type === 'user');
        setEnhancedLogs(userOnlyLogs);
      } else {
        const errorData = await response.json();
        setError(`Error cargando logs de usuario: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error cargando logs de usuario:', error);
      setError('Error de conexión al cargar logs de usuario');
    } finally {
      setLoadingAdvancedLogs(false);
    }
  };

  const resetUserLogsFilters = () => {
    setLogsFiltersAdvanced({
      user_email: '',
      operation: '',
      log_type: 'user', // Solo usuario
      success: 'all',
      days: 7,
      limit: 50,
      offset: 0
    });
    setShowErrorsOnly(false);
  };

  const applyUserErrorsFilter = () => {
    setLogsFiltersAdvanced(prev => ({
      ...prev,
      success: 'false',
      log_type: 'user' // Asegurar que sigue siendo solo usuario
    }));
    setShowErrorsOnly(true);
    loadUserLogs();
  };

  // 📋 Obtener lista de usuarios para el filtro (reutilizando la variable existente)
  
  const loadAvailableUsers = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('https://server.standatpd.com/api/admin/users?limit=200', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const emails = data.users.map((user: any) => user.email).sort();
        setAvailableUsers(emails);
      }
    } catch (error) {
      console.error('Error cargando lista de usuarios:', error);
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
          <Tab 
            icon={<CreditsIcon />} 
            label="Dashboard Créditos"
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<PersonIcon />} 
            label="Gestión Usuarios"
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="Sistema de Logs"
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<ErrorIcon />} 
            label="Logs Avanzados"
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

        {/* Tab 3: Dashboard Créditos */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditsIcon color="primary" />
              Dashboard de Créditos
            </Typography>
            
            {loadingCredits ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : creditsDashboard ? (
              <>
                {/* Estadísticas Generales */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={2}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GroupsIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Total Usuarios
                            </Typography>
                            <Typography variant="h5" component="div">
                              {formatNumber(creditsDashboard.general_stats.total_users)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MoneyIcon sx={{ mr: 2, color: 'success.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Créditos Totales
                            </Typography>
                            <Typography variant="h5" component="div">
                              {formatNumber(creditsDashboard.general_stats.total_credits_in_system)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon sx={{ mr: 2, color: 'info.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Promedio/Usuario
                            </Typography>
                            <Typography variant="h5" component="div">
                              {formatNumber(creditsDashboard.general_stats.average_credits_per_user)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AnalyticsIcon sx={{ mr: 2, color: 'purple' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Operaciones (30d)
                            </Typography>
                            <Typography variant="h5" component="div">
                              {formatNumber(creditsDashboard.general_stats.total_operations_30d)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MoneyIcon sx={{ mr: 2, color: 'error.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Consumidos (30d)
                            </Typography>
                            <Typography variant="h5" component="div">
                              {formatNumber(creditsDashboard.general_stats.total_credits_consumed_30d)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WarningIcon sx={{ mr: 2, color: 'warning.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Créditos Bajos
                            </Typography>
                            <Typography variant="h5" component="div">
                              {creditsDashboard.general_stats.low_credit_users_count}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Estadísticas por Operación */}
                <Paper sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Estadísticas por Operación (últimos 30 días)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Operación</TableCell>
                          <TableCell align="right">Usos</TableCell>
                          <TableCell align="right">Créditos Consumidos</TableCell>
                          <TableCell align="right">Promedio/Operación</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {creditsDashboard.operation_stats.map((stat) => (
                          <TableRow key={stat.operation}>
                            <TableCell component="th" scope="row">
                              <Typography variant="body2" fontFamily="monospace">
                                {stat.operation}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{formatNumber(stat.count)}</TableCell>
                            <TableCell align="right">{formatNumber(stat.credits_consumed)}</TableCell>
                            <TableCell align="right">{stat.avg_credits_per_operation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Usuarios con Créditos Bajos */}
                {creditsDashboard.low_credit_users.length > 0 && (
                  <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon />
                      Usuarios con Créditos Bajos (≤10)
                    </Typography>
                    <Grid container spacing={2}>
                      {creditsDashboard.low_credit_users.map((user, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card variant="outlined" sx={{ borderColor: 'warning.main' }}>
                            <CardContent>
                              <Typography variant="body2" fontWeight="bold">
                                {user.email}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.user_type}
                              </Typography>
                              <Typography variant="h6" color="warning.main">
                                {user.credits} créditos
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}

                {/* Actividad Reciente */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Actividad Reciente
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Usuario</TableCell>
                          <TableCell>Operación</TableCell>
                          <TableCell align="right">Créditos</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell align="right">Tiempo (ms)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {creditsDashboard.recent_logs.slice(0, 10).map((log, index) => (
                          <TableRow key={index}>
                            <TableCell>{log.user_email}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {log.operation}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={`-${log.credits_consumed}`} 
                                size="small" 
                                color="error"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{formatDate(log.timestamp)}</TableCell>
                            <TableCell align="right">{log.response_time}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </>
            ) : (
              <Alert severity="info">
                No hay datos de créditos disponibles. El sistema puede estar inicializándose.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Tab 4: Gestión Usuarios */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Gestión de Usuarios y Créditos
            </Typography>

            {/* Tabla de Usuarios */}
            <Paper sx={{ mb: 4 }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Usuarios del Sistema ({users.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={loadUsersWithFilters}
                  startIcon={<RefreshIcon />}
                  size="small"
                >
                  Actualizar
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell align="right">Créditos</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Registro</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingCredits ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No hay usuarios que mostrar
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.user_type} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role} 
                              size="small" 
                              color={user.role === 'admin' ? 'error' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="h6" 
                              color={user.is_low_credits ? 'warning.main' : 'inherit'}
                            >
                              {user.credits}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {user.is_low_credits && (
                              <Chip 
                                label="Créditos Bajos" 
                                size="small" 
                                color="warning"
                                icon={<WarningIcon />}
                              />
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell align="center">
                            {user.role !== 'admin' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenAddCreditsDialog(true);
                                }}
                                startIcon={<MoneyIcon />}
                              >
                                Agregar
                              </Button>
                            )}
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

        {/* Tab 5: Sistema de Logs */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" />
              Sistema de Logs y Monitoreo
            </Typography>

            {loadingSystemLogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : systemLogsDashboard ? (
              <>
                {/* Estadísticas Generales */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ShowChartIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Total Ejecuciones
                            </Typography>
                            <Typography variant="h5" component="div">
                              {systemLogsDashboard.total_stats.total_executions}
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
                          <MoneyIcon sx={{ mr: 2, color: 'warning.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Costo Total (Mes)
                            </Typography>
                            <Typography variant="h5" component="div">
                              {formatCurrency(systemLogsDashboard.total_stats.total_cost_month)}
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
                              Tasa de Éxito
                            </Typography>
                            <Typography variant="h5" component="div">
                              {systemLogsDashboard.total_stats.avg_success_rate.toFixed(1)}%
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
                          <TrendingUpIcon sx={{ mr: 2, color: 'info.main' }} />
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Tweets Procesados
                            </Typography>
                            <Typography variant="h5" component="div">
                              {formatNumber(systemLogsDashboard.total_stats.total_tweets_processed)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Tabla de Ejecuciones Recientes */}
                <Paper sx={{ mb: 4 }}>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Ejecuciones Recientes ({systemExecutions.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setOpenReanalysisDialog(true)}
                        startIcon={<RefreshIcon />}
                        size="small"
                        disabled={reanalyzingTweets}
                        color="secondary"
                      >
                        Re-analizar Tweets
                      </Button>
                      <Button
                        variant="contained"
                        onClick={loadSystemLogsDashboard}
                        startIcon={<RefreshIcon />}
                        size="small"
                      >
                        Actualizar
                      </Button>
                    </Box>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha/Hora</TableCell>
                          <TableCell>Script</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell align="right">Duración</TableCell>
                          <TableCell align="right">Tweets</TableCell>
                          <TableCell align="right">Costo</TableCell>
                          <TableCell align="right">Éxito %</TableCell>
                          <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {systemExecutions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center">
                              No hay ejecuciones registradas
                            </TableCell>
                          </TableRow>
                        ) : (
                          systemExecutions.map((execution) => (
                            <TableRow key={execution.execution_id}>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(execution.started_at)}
                                </Typography>
                                {execution.completed_at && (
                                  <Typography variant="caption" color="text.secondary">
                                    Terminó: {formatDate(execution.completed_at)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={execution.script_name} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                {getStatusChipForExecution(execution.status)}
                              </TableCell>
                              <TableCell align="right">
                                {execution.duration_seconds ? formatDuration(execution.duration_seconds) : '-'}
                              </TableCell>
                              <TableCell align="right">
                                <Box>
                                  <Typography variant="body2">
                                    {execution.tweets_saved}/{execution.tweets_processed}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    guardados/procesados
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography 
                                  variant="body2" 
                                  color={execution.estimated_cost_usd > 0.1 ? 'warning.main' : 'inherit'}
                                >
                                  {formatCurrency(execution.estimated_cost_usd)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography 
                                  variant="body2"
                                  color={execution.success_rate_percent < 80 ? 'warning.main' : 'success.main'}
                                >
                                  {execution.success_rate_percent.toFixed(1)}%
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => loadExecutionDetails(execution.execution_id)}
                                  startIcon={<TimelineIcon />}
                                >
                                  Detalles
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Gráficos de Costos y Performance */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon color="warning" />
                        Costos Diarios (Últimos 7 días)
                      </Typography>
                      {dailyCosts.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell align="right">Ejecuciones</TableCell>
                                <TableCell align="right">Tweets</TableCell>
                                <TableCell align="right">Costo</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dailyCosts.map((day) => (
                                <TableRow key={day.date}>
                                  <TableCell>{day.date}</TableCell>
                                  <TableCell align="right">{day.executions}</TableCell>
                                  <TableCell align="right">{day.total_tweets}</TableCell>
                                  <TableCell align="right">{formatCurrency(day.total_cost)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography color="text.secondary">No hay datos de costos disponibles</Typography>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShowChartIcon color="info" />
                        Performance Semanal
                      </Typography>
                      {weeklyPerformance.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Semana</TableCell>
                                <TableCell align="right">Ejecuciones</TableCell>
                                <TableCell align="right">Duración Prom.</TableCell>
                                <TableCell align="right">Fallos</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {weeklyPerformance.map((week) => (
                                <TableRow key={week.week}>
                                  <TableCell>{week.week}</TableCell>
                                  <TableCell align="right">{week.executions}</TableCell>
                                  <TableCell align="right">{formatDuration(week.avg_duration)}</TableCell>
                                  <TableCell align="right">
                                    <Typography color={week.failed_executions > 0 ? 'error.main' : 'inherit'}>
                                      {week.failed_executions}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography color="text.secondary">No hay datos de performance disponibles</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay datos del sistema de logs disponibles. El sistema puede estar inicializándose.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Tab 6: Logs Avanzados */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Logs de Usuario - Análisis Avanzado
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Esta vista muestra únicamente los logs de operaciones de usuario (usage_logs). 
              Los logs del sistema están disponibles en la pestaña "Sistema de Logs".
            </Alert>

            {/* Filtros Avanzados */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filtros de Búsqueda
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={logsFiltersAdvanced.days}
                      label="Período"
                      onChange={(e) => setLogsFiltersAdvanced(prev => ({
                        ...prev,
                        days: Number(e.target.value)
                      }))}
                    >
                      <MenuItem value={1}>Último día</MenuItem>
                      <MenuItem value={7}>Última semana</MenuItem>
                      <MenuItem value={14}>2 semanas</MenuItem>
                      <MenuItem value={30}>Último mes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Usuario Específico</InputLabel>
                    <Select
                      value={logsFiltersAdvanced.user_email}
                      label="Usuario Específico"
                      onChange={(e) => setLogsFiltersAdvanced(prev => ({
                        ...prev,
                        user_email: e.target.value
                      }))}
                    >
                      <MenuItem value="">Todos los usuarios</MenuItem>
                      {availableUsers.map((email) => (
                        <MenuItem key={email} value={email}>
                          {email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={logsFiltersAdvanced.success}
                      label="Estado"
                      onChange={(e) => setLogsFiltersAdvanced(prev => ({
                        ...prev,
                        success: e.target.value as 'all' | 'true' | 'false'
                      }))}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="true">Exitosos</MenuItem>
                      <MenuItem value="false">Con errores</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Usuario/Email"
                    value={logsFiltersAdvanced.user_email}
                    onChange={(e) => setLogsFiltersAdvanced(prev => ({
                      ...prev,
                      user_email: e.target.value
                    }))}
                    placeholder="Filtrar por email..."
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Operación"
                    value={logsFiltersAdvanced.operation}
                    onChange={(e) => setLogsFiltersAdvanced(prev => ({
                      ...prev,
                      operation: e.target.value
                    }))}
                    placeholder="Ej: /api/processTrends"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={loadAdvancedLogsStats}
                      startIcon={<SearchIcon />}
                      disabled={loadingLogsStats}
                    >
                      Buscar
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={resetLogsFilters}
                      startIcon={<ClearIcon />}
                    >
                      Limpiar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={applyErrorsFilter}
                      startIcon={<ErrorIcon />}
                    >
                      Solo Errores
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Estadísticas de Logs */}
            {logsStatsData && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssessmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            Total Logs
                          </Typography>
                          <Typography variant="h5" component="div">
                            {logsStatsData.statistics.overview.total_logs}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 2, color: 'info.main' }} />
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            Usuario
                          </Typography>
                          <Typography variant="h5" component="div">
                            {logsStatsData.statistics.overview.user_logs}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ComputerIcon sx={{ mr: 2, color: 'secondary.main' }} />
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            Sistema
                          </Typography>
                          <Typography variant="h5" component="div">
                            {logsStatsData.statistics.overview.system_logs}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckIcon sx={{ mr: 2, color: 'success.main' }} />
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            Exitosos
                          </Typography>
                          <Typography variant="h5" component="div">
                            {logsStatsData.statistics.overview.success_logs}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ErrorIcon sx={{ mr: 2, color: 'error.main' }} />
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            Errores
                          </Typography>
                          <Typography variant="h5" component="div">
                            {logsStatsData.statistics.overview.error_logs}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon sx={{ mr: 2, color: 'warning.main' }} />
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            Créditos
                          </Typography>
                          <Typography variant="h5" component="div">
                            {logsStatsData.statistics.overview.total_credits_consumed}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Top Operaciones */}
            {logsStatsData && logsStatsData.statistics.top_operations.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Operaciones ({logsStatsData.statistics.overview.period_days} días)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Operación</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Errores</TableCell>
                        <TableCell align="right">Créditos</TableCell>
                        <TableCell align="right">Tasa Éxito</TableCell>
                        <TableCell align="center">Tipos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logsStatsData.statistics.top_operations.slice(0, 10).map((op, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {op.operation}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{op.count}</TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={op.errors > 0 ? 'error.main' : 'text.secondary'}
                            >
                              {op.errors}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{op.credits}</TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2"
                              color={parseFloat(op.success_rate) < 80 ? 'error.main' : 'success.main'}
                            >
                              {op.success_rate}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {op.types.map((type) => (
                                <Chip 
                                  key={type} 
                                  label={type} 
                                  size="small" 
                                  variant="outlined"
                                  color={type === 'user' ? 'info' : 'secondary'}
                                />
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Tabla de Logs Detallados */}
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Logs Detallados {enhancedLogs && `(${enhancedLogs.length})`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={loadAdvancedLogs}
                    startIcon={<RefreshIcon />}
                    size="small"
                    disabled={loadingAdvancedLogs}
                  >
                    Actualizar
                  </Button>
                </Box>
              </Box>

              {loadingAdvancedLogs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : enhancedLogs && enhancedLogs.length > 0 ? (
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha/Hora</TableCell>
                        <TableCell>Usuario/Tipo</TableCell>
                        <TableCell>Operación</TableCell>
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="right">Créditos</TableCell>
                        <TableCell align="right">Tiempo</TableCell>
                        <TableCell align="center">Detalles</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enhancedLogs.map((log: EnhancedLog, index: number) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            backgroundColor: !log.is_success ? 'error.light' : 'inherit',
                            opacity: !log.is_success ? 0.9 : 1
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {log.formatted_time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {log.is_system ? 'SISTEMA' : log.user_email}
                              </Typography>
                              <Chip 
                                label={log.log_type.toUpperCase()} 
                                size="small" 
                                variant="outlined"
                                color={log.log_type === 'user' ? 'info' : 'secondary'}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              fontFamily="monospace"
                              sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {log.operation}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {log.is_success ? (
                              <CheckIcon color="success" />
                            ) : (
                              <ErrorIcon color="error" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2"
                              color={log.credits_consumed > 0 ? 'warning.main' : 'text.secondary'}
                            >
                              {log.credits_consumed}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {log.execution_time || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                // Mostrar detalles del log en un dialog
                                console.log('Ver detalles del log:', log);
                              }}
                              startIcon={<VisibilityIcon />}
                            >
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No se encontraron logs con los filtros aplicados
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Resumen de Errores Recientes */}
            {logsStatsData && logsStatsData.statistics.error_summary.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Errores Recientes ({logsStatsData.statistics.error_summary.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {logsStatsData.statistics.error_summary.slice(0, 5).map((error, index) => (
                    <Alert key={index} severity="error" variant="outlined">
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {error.operation} - {error.log_type.toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(error.timestamp).toLocaleString('es-ES')} | {error.user_role} | {error.source}
                        </Typography>
                      </Box>
                    </Alert>
                  ))}
                  {logsStatsData.statistics.error_summary.length > 5 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      ... y {logsStatsData.statistics.error_summary.length - 5} errores más
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}
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

      {/* 💳 Dialog para Agregar Créditos */}
      <Dialog open={openAddCreditsDialog} onClose={() => setOpenAddCreditsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Agregar Créditos a Usuario
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Usuario:</strong> {selectedUser.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Créditos actuales:</strong> {selectedUser.credits}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Créditos a agregar"
                value={addCreditsAmount}
                onChange={(e) => setAddCreditsAmount(Number(e.target.value))}
                inputProps={{ min: 1, max: 1000 }}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddCreditsDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={addCreditsToUser} 
            variant="contained"
            disabled={addCreditsAmount <= 0}
          >
            Agregar Créditos
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Detalles de Ejecución */}
      <Dialog 
        open={openExecutionDialog} 
        onClose={() => setOpenExecutionDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon color="primary" />
            Detalles de Ejecución
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedExecution && (
            <Box sx={{ pt: 2 }}>
              {/* Información General */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Información General
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      ID de Ejecución
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {selectedExecution.execution_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Script
                    </Typography>
                    <Typography variant="body1">
                      {selectedExecution.script_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Estado
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getStatusChipForExecution(selectedExecution.status)}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Duración
                    </Typography>
                    <Typography variant="body1">
                      {selectedExecution.duration_seconds ? formatDuration(selectedExecution.duration_seconds) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Métricas de Procesamiento */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Métricas de Procesamiento
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {selectedExecution.trends_found}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Trends Encontrados
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {selectedExecution.tweets_processed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tweets Procesados
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {selectedExecution.tweets_saved}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tweets Guardados
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {selectedExecution.tweets_failed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tweets Fallidos
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Métricas de IA */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Métricas de IA y Costos
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {selectedExecution.ai_requests_made}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Requests IA
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {formatNumber(selectedExecution.total_tokens_used)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tokens Usados
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {formatCurrency(selectedExecution.estimated_cost_usd)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Costo Estimado
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography 
                        variant="h4" 
                        color={selectedExecution.ai_requests_successful / selectedExecution.ai_requests_made * 100 < 80 ? 'error.main' : 'success.main'}
                      >
                        {((selectedExecution.ai_requests_successful / selectedExecution.ai_requests_made) * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tasa Éxito IA
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Estadísticas de Análisis */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Distribución de Sentimientos
                    </Typography>
                    {Object.entries(selectedExecution.sentimiento_stats || {}).map(([sentimiento, count]) => (
                      <Box key={sentimiento} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{sentimiento}</Typography>
                        <Typography variant="body2" fontWeight="bold">{count}</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Distribución de Categorías
                    </Typography>
                    {Object.entries(selectedExecution.categoria_stats || {}).map(([categoria, count]) => (
                      <Box key={categoria} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{categoria}</Typography>
                        <Typography variant="body2" fontWeight="bold">{count}</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>

              {/* Errores y Advertencias */}
              {(selectedExecution.error_details.length > 0 || selectedExecution.warnings.length > 0) && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Errores y Advertencias
                  </Typography>
                  
                  {selectedExecution.error_details.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="error.main" gutterBottom>
                        Errores ({selectedExecution.error_details.length})
                      </Typography>
                      {selectedExecution.error_details.slice(0, 5).map((error, index) => (
                        <Alert key={index} severity="error" sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {error.timestamp}
                          </Typography>
                          <Typography variant="body2">
                            <strong>{error.context}:</strong> {error.error}
                          </Typography>
                        </Alert>
                      ))}
                      {selectedExecution.error_details.length > 5 && (
                        <Typography variant="caption" color="text.secondary">
                          ... y {selectedExecution.error_details.length - 5} errores más
                        </Typography>
                      )}
                    </Box>
                  )}

                  {selectedExecution.warnings.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="warning.main" gutterBottom>
                        Advertencias ({selectedExecution.warnings.length})
                      </Typography>
                      {selectedExecution.warnings.slice(0, 3).map((warning, index) => (
                        <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {warning.timestamp}
                          </Typography>
                          <Typography variant="body2">
                            <strong>{warning.context}:</strong> {warning.warning}
                          </Typography>
                        </Alert>
                      ))}
                      {selectedExecution.warnings.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          ... y {selectedExecution.warnings.length - 3} advertencias más
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExecutionDialog(false)}>
            Cerrar
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

      {/* Diálogo para Re-análisis de Tweets */}
      <Dialog 
        open={openReanalysisDialog} 
        onClose={() => setOpenReanalysisDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RefreshIcon color="primary" />
          Re-análisis de Tweets
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Esta función re-analizará los tweets más recientes para actualizar los datos de sentimiento, 
            categorías e intención comunicativa. El proceso se ejecuta en el VPS y puede tomar algunos minutos.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de Tweets a Procesar"
                type="number"
                value={reanalysisOptions.limit}
                onChange={(e) => setReanalysisOptions(prev => ({ 
                  ...prev, 
                  limit: Math.max(1, Math.min(100, parseInt(e.target.value) || 20))
                }))}
                inputProps={{ min: 1, max: 100 }}
                helperText="Número de tweets más recientes a re-analizar (máximo 100)"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                                 control={
                   <Checkbox
                     checked={reanalysisOptions.force_all}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReanalysisOptions(prev => ({ 
                       ...prev, 
                       force_all: e.target.checked 
                     }))}
                   />
                 }
                label="Forzar re-análisis de todos"
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Si está marcado, re-analizará incluso tweets que ya tienen análisis completo
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                                 control={
                   <Checkbox
                     checked={reanalysisOptions.only_failed}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReanalysisOptions(prev => ({ 
                       ...prev, 
                       only_failed: e.target.checked 
                     }))}
                   />
                 }
                label="Solo tweets con errores"
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Si está marcado, solo procesará tweets que fallaron en análisis anteriores
              </Typography>
            </Grid>
          </Grid>

          {reanalysisResult && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Último resultado:</strong><br/>
                Tweets procesados: {reanalysisResult.results?.tweets_processed || 0}<br/>
                Tweets actualizados: {reanalysisResult.results?.tweets_updated || 0}<br/>
                Tiempo de ejecución: {reanalysisResult.results?.execution_time || 'No disponible'}
              </Typography>
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setOpenReanalysisDialog(false)}
            disabled={reanalyzingTweets}
          >
            Cancelar
          </Button>
          <Button 
            onClick={reanalyzeTweets} 
            variant="contained"
            disabled={reanalyzingTweets}
            startIcon={reanalyzingTweets ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {reanalyzingTweets ? 'Procesando...' : 'Iniciar Re-análisis'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
} 