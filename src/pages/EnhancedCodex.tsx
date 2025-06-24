"use client"

import { useState, useEffect, useCallback } from "react"
import "../types/google.d.ts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/Badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Plus,
  FileText,
  Headphones,
  Video,
  Link,
  Filter,
  Calendar,
  Tag,
  Folder,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  Archive,
  RefreshCw,
  AlertCircle,
  Upload,
  Cloud,
  StickyNote as NoteIcon,
  ChevronDown,
  ChevronUp,
  Mic,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "../context/AuthContext"
import { useGoogleDrive } from "../hooks/useGoogleDrive"
import { supabase, getCodexItemsByUser, createCodexBucket, getUserProjects, Project } from "../services/supabase.ts"

interface CodexItem {
  id: string
  user_id: string
  tipo: string
  titulo: string
  descripcion?: string
  etiquetas: string[]
  proyecto: string
  project_id?: string
  storage_path?: string
  url?: string
  nombre_archivo?: string
  tamano?: number
  fecha: string
  created_at: string
  is_drive?: boolean
  drive_file_id?: string
  audio_transcription?: string // NUEVO: transcripción guardada en la BD
}

interface CodexStats {
  documentos: number
  audios: number
  videos: number
  enlaces: number
  notas: number
}

export default function EnhancedCodex() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [showAllItems, setShowAllItems] = useState(false)
  const [itemsToShow, setItemsToShow] = useState(6)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [codexItems, setCodexItems] = useState<CodexItem[]>([])
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<CodexStats>({
    documentos: 0,
    audios: 0,
    videos: 0,
    enlaces: 0,
    notas: 0
  })
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Optional metadata toggle states
  const [showUploadMetadata, setShowUploadMetadata] = useState(false)
  const [showDriveMetadata, setShowDriveMetadata] = useState(false)
  const [showNoteMetadata, setShowNoteMetadata] = useState(false)
  
  // Form states
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [noteTags, setNoteTags] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  
  // New content type field for all options
  const [contentType, setContentType] = useState("")
  
  // Relations for notes
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<string[]>([])
  const [showRelationSelector, setShowRelationSelector] = useState(false)
  
  // Additional form states for upload and drive
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadTags, setUploadTags] = useState("")
  const [uploadProject, setUploadProject] = useState("")
  
  const [driveTitle, setDriveTitle] = useState("")
  const [driveDescription, setDriveDescription] = useState("")
  const [driveTags, setDriveTags] = useState("")
  const [driveProject, setDriveProject] = useState("")
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  
  // Google Drive states
  const [isDriveConnected, setIsDriveConnected] = useState(false)
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [selectedDriveFile, setSelectedDriveFile] = useState<any>(null)
  
  // Estados para edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CodexItem | null>(null)
  const [editForm, setEditForm] = useState({
    titulo: '',
    descripcion: '',
    etiquetas: '',
    proyecto: ''
  })
  
  // Estados para transcripción
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  
  const { user, session } = useAuth()
  const [googleDriveToken, setGoogleDriveToken] = useState<string | null>(null)
  const [pickerReady, setPickerReady] = useState(false)
  
  // Import del hook useGoogleDrive para mejorar UX
  const { 
    isGoogleUser, 
    token: driveToken, 
    loading: driveLoading, 
    error: driveError, 
    openPicker, 
    autoOpenPickerIfTokenExists,
    hasValidToken,
    canUseDrive 
  } = useGoogleDrive()

  // ------------------------------
  // Feature flags
  // ------------------------------
  const DRIVE_ENABLED = false; // 🚫 Deshabilitado temporalmente subir desde Google Drive
  const NOTE_ENABLED = true; // función notas activada
  const RELATIONS_ENABLED = false; // 🚫 deshabilitar relacionar notas con archivos

  /**
   * Asegura que tenemos un token válido de Google Drive.
   * Si ya lo tenemos, lo devuelve inmediatamente.
   * En caso contrario lanza el flujo de consentimiento y resuelve
   * la promesa cuando el usuario concede acceso y se recibe el token.
   */
  const ensureDriveToken = useCallback(async (): Promise<string> => {
    if (googleDriveToken) return googleDriveToken

    return new Promise((resolve, reject) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        reject(new Error('Google Drive no está configurado correctamente. Falta CLIENT_ID'))
        return
      }

      const tokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        prompt: 'consent', // Siempre mostrar popup
        callback: (resp: any) => {
          if (resp.error || !resp.access_token) {
            reject(new Error(resp.error || 'No se pudo obtener token de Google Drive'))
            return
          }
          setGoogleDriveToken(resp.access_token)
          resolve(resp.access_token)
        }
      })

      if (tokenClient) {
        tokenClient.requestAccessToken()
      } else {
        reject(new Error('No se pudo inicializar Google Identity Services'))
      }
    })
  }, [googleDriveToken])

  // --------------------------------------------------
  // GOOGLE DRIVE: load GIS + Picker scripts once
  // --------------------------------------------------
  useEffect(() => {
    // Load Google Identity Services
    if (!window.google) {
      const gsiScript = document.createElement('script')
      gsiScript.src = 'https://accounts.google.com/gsi/client'
      gsiScript.async = true
      gsiScript.defer = true
      document.body.appendChild(gsiScript)
    }

    // Load GAPI + Picker
    if (!window.gapi) {
      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.onload = () => {
        window.gapi.load('picker', {
          callback: () => {
            if (window.google?.picker) {
              setPickerReady(true)
            }
          },
        })
      }
      document.body.appendChild(gapiScript)
    } else {
      window.gapi.load('picker', {
        callback: () => {
          if (window.google?.picker) setPickerReady(true)
        }
      })
    }
  }, [])

  // --------------------------------------------------
  // Handler: Connect Google Drive (opens consent + picker)
  // --------------------------------------------------
  const handleGoogleDriveAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const apiKey   = import.meta.env.VITE_GOOGLE_API_KEY
    if (!clientId || !apiKey) {
      setError('Google Drive no está configurado correctamente.')
      return
    }

    // If token already present, solo abrir picker
    if (googleDriveToken) {
      if (pickerReady) {
        openGooglePicker(googleDriveToken)
      } else {
        // wait until picker ready then open
        const interval = setInterval(() => {
          if (window.gapi?.picker) {
            clearInterval(interval)
            setPickerReady(true)
            openGooglePicker(googleDriveToken)
          }
        }, 300)
      }
      return
    }

    // Crear token client (popup)
    const tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      prompt: 'consent',
      callback: (response: any) => {
        if (response.error) {
          console.error('Token error:', response.error)
          setError('Error al obtener token de Google Drive')
          return
        }
        setGoogleDriveToken(response.access_token)
        setIsDriveConnected(true)
        if (pickerReady) {
          openGooglePicker(response.access_token)
        } else {
          const waitP = setInterval(() => {
            if (window.gapi?.picker) {
              clearInterval(waitP)
              setPickerReady(true)
              openGooglePicker(response.access_token)
            }
          }, 300)
        }
      }
    })

    if (tokenClient) {
      tokenClient.requestAccessToken()
    } else {
      setError('No se pudo inicializar Google Identity Services')
    }
  }

  // --------------------------------------------------
  // Open Google Picker so user selects file(s)
  // --------------------------------------------------
  const openGooglePicker = (accessToken: string) => {
    if (!window.gapi?.picker) {
      if (!window.google?.picker) {
        setError('Google Picker no está disponible aún. Intenta de nuevo.')
        return
      }
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
      .setOAuthToken(accessToken)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0]
          const consent = window.confirm(
            'Para procesar este archivo necesitamos crear una copia temporal en tu Google Drive que pertenecerá a la aplicación. ¿Deseas continuar?'
          )
          if (!consent) {
            console.log('Usuario canceló la copia del archivo');
            return
          }

          const pickedFile = {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.sizeBytes || 0,
            webViewLink: file.url,
            thumbnailLink: file.iconUrl
          }
          setSelectedDriveFile(pickedFile)
          setDriveTitle(file.name)
          setDriveFiles([pickedFile])

          // Guardar automáticamente el archivo en el Codex tras el consentimiento
          setTimeout(() => {
            handleSaveDriveFile(pickedFile);
          }, 0);
        }
      })
      .build()

    picker.setVisible(true)
  }

  // --------------------------------------------------
  // Handle Drive File Selection
  // --------------------------------------------------
  const handleDriveFileSelect = (file: any) => {
    setSelectedDriveFile(file)
  }

  // Cargar datos del Codex cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      loadCodexData()
      loadUserProjects()
      // Initialize Supabase bucket for file storage
      createCodexBucket()
    }
  }, [user])

  const loadCodexData = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const items = await getCodexItemsByUser(user.id)
      setCodexItems(items)
      calculateStats(items)
    } catch (err) {
      console.error('Error loading codex data:', err)
      setError('Error al cargar los datos del Codex')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProjects = async () => {
    if (!user?.id) return
    
    try {
      const projects = await getUserProjects()
      setUserProjects(projects)
    } catch (err) {
      console.error('Error loading user projects:', err)
    }
  }

  // Función auxiliar para obtener el path de almacenamiento basado en el proyecto
  const getStoragePath = (projectId: string, fileName: string) => {
    if (!projectId || projectId === 'sin-proyecto') {
      return `${user?.id}/${fileName}`
    }
    
    const project = userProjects.find(p => p.id === projectId)
    const projectFolder = project ? project.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'proyecto_sin_nombre'
    return `${user?.id}/proyectos/${projectFolder}/${fileName}`
  }

  const calculateStats = (items: CodexItem[]) => {
    const newStats = {
      documentos: items.filter(item => item.tipo === 'documento').length,
      audios: items.filter(item => item.tipo === 'audio').length,
      videos: items.filter(item => item.tipo === 'video').length,
      enlaces: items.filter(item => item.tipo === 'enlace').length,
      notas: items.filter(item => item.tipo === 'nota').length
    }
    setStats(newStats)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audio":
        return Headphones
      case "video":
        return Video
      case "documento":
        return FileText
      case "enlace":
        return Link
      case "nota":
        return NoteIcon
      default:
        return FileText
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Nuevo":
        return "bg-green-100 text-green-800"
      case "En revisión":
        return "bg-yellow-100 text-yellow-800"
      case "Procesado":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—"
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFilteredItems = () => {
    let filtered = codexItems

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.proyecto.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.etiquetas.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((item) => item.tipo === selectedType)
    }

    // Para el filtro de estado, usamos las etiquetas como proxy del estado
    if (selectedStatus !== "all") {
      filtered = filtered.filter((item) => 
        item.etiquetas.some(tag => tag.toLowerCase().includes(selectedStatus.toLowerCase()))
      )
    }

    return showAllItems ? filtered : filtered.slice(0, itemsToShow)
  }

  const filteredItems = getFilteredItems()
  const hasMoreItems = codexItems.length > itemsToShow && !showAllItems

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return
    
    try {
      const { error } = await supabase
        .from('codex_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user?.id)

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = codexItems.filter(item => item.id !== itemId)
      setCodexItems(updatedItems)
      calculateStats(updatedItems)
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Error al eliminar el elemento')
    }
  }

  // ------------------------------
  // Modal de transcripción
  // ------------------------------
  const [transcriptionModalItem, setTranscriptionModalItem] = useState<CodexItem | null>(null)

  const handleShowTranscription = (item: CodexItem) => {
    if (item.audio_transcription && item.audio_transcription.trim().length > 0) {
      setTranscriptionModalItem(item)
    }
  }

  const handleViewItem = (item: CodexItem) => {
    // Abrir URL o storage preview si existe
    if (item.url) {
      window.open(item.url, '_blank')
    } else if (item.storage_path) {
      // Podrías implementar vista previa si es necesario
    }
  }

  const handleEditItem = (item: CodexItem) => {
    setEditingItem(item)
    
    // Si tiene project_id, usar ese; sino buscar por nombre del proyecto; sino usar "sin-proyecto"
    let projectValue = 'sin-proyecto'
    if (item.project_id) {
      projectValue = item.project_id
    } else if (item.proyecto && item.proyecto !== 'Sin proyecto') {
      // Buscar el proyecto por nombre para obtener el ID
      const foundProject = userProjects.find(p => p.title === item.proyecto)
      projectValue = foundProject ? foundProject.id : 'sin-proyecto'
    }
    
    setEditForm({
      titulo: item.titulo,
      descripcion: item.descripcion || '',
      etiquetas: item.etiquetas.join(', '),
      proyecto: projectValue
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !user?.id) return
    
    setIsSubmitting(true)
    try {
      // Get project information
      const selectedProjectData = (editForm.proyecto && editForm.proyecto !== 'sin-proyecto') ? 
        userProjects.find(p => p.id === editForm.proyecto) : null
      
      const updatedData = {
        titulo: editForm.titulo.trim(),
        descripcion: editForm.descripcion.trim() || null,
        etiquetas: editForm.etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag),
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? editForm.proyecto : null
      }

      const { data, error } = await supabase
        .from('codex_items')
        .update(updatedData)
        .eq('id', editingItem.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = codexItems.map(item => 
        item.id === editingItem.id ? { ...item, ...data } : item
      )
      setCodexItems(updatedItems)
      calculateStats(updatedItems)
      
      setIsEditModalOpen(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Error al actualizar el elemento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadItem = async (item: CodexItem) => {
    if (!item.storage_path) {
      alert('No hay archivo para descargar')
      return
    }

    try {
      const { data, error } = await supabase.storage
        .from('digitalstorage')
        .download(item.storage_path)

      if (error) throw error

      // Crear URL de descarga
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = item.nombre_archivo || item.titulo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading file:', err)
      alert('Error al descargar el archivo')
    }
  }

  const handleDeleteItemConfirm = async (item: CodexItem) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar "${item.titulo}"?`
    if (!confirm(confirmMessage)) return
    
    setIsSubmitting(true)
    try {
      // Si es un archivo subido, eliminarlo del storage también
      if (item.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('digitalstorage')
          .remove([item.storage_path])
        
        if (storageError) {
          console.warn('Error deleting file from storage:', storageError)
          // Continuar con la eliminación de la base de datos aunque falle el storage
        }
      }

      // Eliminar de la base de datos
      const { error } = await supabase
        .from('codex_items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', user?.id)

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = codexItems.filter(i => i.id !== item.id)
      setCodexItems(updatedItems)
      calculateStats(updatedItems)
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Error al eliminar el elemento')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para determinar si un archivo puede ser transcrito
  const canTranscribe = (item: CodexItem) => {
    // Verificar que el archivo tenga una fuente válida (storage o URL)
    if (!item.storage_path && !item.url) return false
    
    // Formatos de audio soportados
    const audioFormats = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a']
    // Formatos de video soportados
    const videoFormats = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v']
    
    // Verificar por extensión de archivo si está disponible
    if (item.nombre_archivo) {
      const ext = item.nombre_archivo.toLowerCase()
      const isAudioVideo = audioFormats.some(format => ext.endsWith(format)) || 
                          videoFormats.some(format => ext.endsWith(format))
      if (isAudioVideo) return true
    }
    
    // Verificar por tipo MIME para archivos de Drive
    if (item.is_drive && item.url) {
      return item.tipo === 'audio' || item.tipo === 'video'
    }
    
    // Fallback: verificar por tipo
    return item.tipo === 'audio' || item.tipo === 'video'
  }

  const handleTranscribeItem = async (item: CodexItem) => {
    if (!user?.id) {
      setError('Usuario no autenticado')
      return
    }

    setIsTranscribing(true)
    setTranscriptionProgress(0)
    setError(null)

    try {
      // Validar datos necesarios para Drive files
      if (item.is_drive && (!item.drive_file_id || !item.url)) {
        throw new Error('Archivo de Google Drive incompleto: falta ID o URL del archivo')
      }

      // Obtener token de Google Drive si el archivo proviene de Drive
      let driveToken: string | null = googleDriveToken
      if (item.is_drive) {
        try {
          driveToken = await ensureDriveToken()
        } catch (tokenErr: any) {
          throw new Error(tokenErr.message || 'No fue posible obtener permisos de Google Drive')
        }
      }

      // Simular progreso inicial
      setTranscriptionProgress(10)

      // Preparar datos para la transcripción
      const transcriptionData = {
        codexItemId: item.id,
        titulo: `Transcripción: ${item.titulo}`,
        descripcion: `Transcripción automática del archivo: ${item.titulo}`,
        etiquetas: `${item.etiquetas.join(',')},transcripcion,gemini-ai`,
        proyecto: item.proyecto,
        project_id: item.project_id,
        // Información específica para archivos de Drive
        is_drive: item.is_drive || false,
        drive_file_id: item.drive_file_id || null,
        file_url: item.url || null,
        // Google Drive API access token para acceder al archivo
        drive_access_token: item.is_drive ? driveToken : null,
        // Generar URL de descarga directa para Drive files (fallback)
        download_url: item.is_drive && item.drive_file_id 
          ? `https://drive.google.com/uc?export=download&id=${item.drive_file_id}`
          : null,
        file_name: item.nombre_archivo || null,
        file_type: item.tipo || null,
        file_size: item.tamano || null,
        // Para archivos de Supabase (compatibilidad hacia atrás)
        storage_path: item.storage_path || null
      }

      console.log('🎤 Iniciando transcripción para:', item.titulo)
      console.log('📁 Es archivo de Drive:', item.is_drive)
      console.log('🆔 Drive File ID:', item.drive_file_id)
      console.log('🔗 URL del archivo (view):', item.url)
      console.log('📥 URL de descarga directa:', transcriptionData.download_url)
      console.log('🔑 Token de Drive disponible:', !!googleDriveToken)
      console.log('🔑 Token de Drive (primeros 20 chars):', googleDriveToken ? googleDriveToken.substring(0, 20) + '...' : 'No disponible')
      console.log('📂 Storage path:', item.storage_path)
      console.log('📄 Nombre archivo:', item.nombre_archivo)
      console.log('📊 Tipo archivo:', item.tipo)
      
      // Usar el endpoint existente, pero el backend detectará si es Drive por is_drive flag
      const endpoint = '/api/transcription/from-codex'
      
      console.log('🔗 URL del endpoint:', `${import.meta.env.VITE_EXTRACTORW_API_URL}${endpoint}`)
      console.log('📤 Datos a enviar:', transcriptionData)
      console.log('🗂️ Tipo de archivo:', item.is_drive ? 'Google Drive' : 'Supabase Storage')
      
      setTranscriptionProgress(30)

      // Obtener token desde Supabase AuthContext o localStorage como respaldo
      let accessToken = session?.access_token || localStorage.getItem('token') || ''
      
      // Si no hay token, forzar re-autenticación
      if (!accessToken) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.')
      }
      
      // Usar siempre el token más fresco de la sesión
      if (session?.access_token) {
        accessToken = session.access_token
      }
      console.log('🔑 Token usado:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NO TOKEN')
      console.log('🔑 Session info:', { hasSession: !!session, userEmail: session?.user?.email })

      // Verificar si el token está próximo a expirar y refrescarlo si es necesario
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        const timeToExpiry = expiresAt.getTime() - now.getTime()
        const fiveMinutes = 5 * 60 * 1000

        console.log('🕐 Token expira en:', Math.round(timeToExpiry / 1000 / 60), 'minutos')

        // Si expira en menos de 5 minutos, intentar refrescar
        if (timeToExpiry < fiveMinutes) {
          console.log('🔄 Token próximo a expirar, refrescando...')
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('❌ Error refrescando sesión:', refreshError)
              throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
            }
            console.log('✅ Sesión refrescada exitosamente')
          } catch (refreshErr) {
            console.error('❌ Error durante el refresh:', refreshErr)
            throw new Error('No se pudo refrescar la sesión. Inicia sesión nuevamente.')
          }
        }
      }

      const response = await fetch(`${import.meta.env.VITE_EXTRACTORW_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(transcriptionData)
      })

      setTranscriptionProgress(70)

      if (!response.ok) {
        console.log(`❌ Response Status: ${response.status} ${response.statusText}`)
        console.log(`❌ Response Headers:`, Object.fromEntries(response.headers.entries()))
        
        let errorMessage = `Error ${response.status}: ${response.statusText}${item.is_drive ? ' (archivo de Google Drive)' : ''}`
        
        try {
          const responseText = await response.text()
          console.log(`❌ Response Body:`, responseText)
          
          if (responseText.trim().startsWith('{')) {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorData.message || errorMessage
          } else {
            errorMessage = `${errorMessage} - Response: ${responseText.substring(0, 100)}`
          }
        } catch (parseError) {
          console.warn('❌ No se pudo parsear respuesta:', parseError)
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      setTranscriptionProgress(90)

      if (result.success) {
        console.log('✅ Transcripción completada:', result.data.codexItem.id)
        
        // Actualizar lista de items del codex
        await loadCodexData()
        
        setTranscriptionProgress(100)
        
        // Mostrar mensaje de éxito
        const sourceType = item.is_drive ? ' (Google Drive)' : ' (Archivo subido)'
        alert(`¡Transcripción completada${sourceType}! ${result.data.metadata.wordsCount} palabras procesadas. Créditos usados: ${result.data.creditsUsed}`)
      } else {
        throw new Error(result.error || 'Error durante la transcripción')
      }

    } catch (err: any) {
      console.error('❌ Error en transcripción:', err)
      console.log('🔍 Datos del item que falló:', {
        id: item.id,
        titulo: item.titulo,
        is_drive: item.is_drive,
        drive_file_id: item.drive_file_id,
        url: item.url,
        storage_path: item.storage_path,
        nombre_archivo: item.nombre_archivo,
        tipo: item.tipo,
        has_drive_token: !!googleDriveToken,
        drive_token_length: googleDriveToken?.length || 0
      })
      
      const sourceType = item.is_drive ? ' archivo de Google Drive' : ' archivo subido'
      let errorMessage = `Error al transcribir${sourceType}: ${err.message}`
      
      // Agregar sugerencias específicas para archivos de Drive
      if (item.is_drive) {
        if (!googleDriveToken) {
          errorMessage += '\n\nSugerencia: Reconecta tu cuenta de Google Drive para obtener acceso a los archivos.'
        } else {
          errorMessage += '\n\nSugerencia: El backend ahora tiene acceso al token de Google Drive para descargar el archivo.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsTranscribing(false)
      setTranscriptionProgress(0)
    }
  }

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      setError('El título y contenido son requeridos')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const tagsArray = noteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      // Add content type to tags if specified
      const finalTags = contentType.trim() ? [...tagsArray, contentType.trim()] : tagsArray
      
      // Obtener información del proyecto seleccionado
      const selectedProjectData = (selectedProject && selectedProject !== 'sin-proyecto') ? userProjects.find(p => p.id === selectedProject) : null
      
      const noteItem = {
        user_id: user?.id,
        tipo: 'nota',
        titulo: noteTitle.trim(),
        descripcion: noteContent.trim(),
        etiquetas: finalTags,
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? selectedProject : null,
        ...(RELATIONS_ENABLED && selectedRelatedItems.length > 0 ? { related_items: selectedRelatedItems } : {}),
        fecha: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('codex_items')
        .insert([noteItem])
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = [...codexItems, data]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Limpiar formulario y cerrar modal
      clearForm()

    } catch (err) {
      console.error('Error saving note:', err)
      setError('Error al guardar la nota')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveLink = async (url: string, title: string, description: string, tags: string[], project: string) => {
    if (!url.trim() || !title.trim()) {
      setError('La URL y el título son requeridos')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const finalTags = contentType.trim() ? [...tags, contentType.trim()] : tags
      
      // Get project information
      const selectedProjectData = (project && project !== 'sin-proyecto') ? userProjects.find(p => p.id === project) : null
      
      const newLink = {
        user_id: user?.id,
        tipo: 'enlace',
        titulo: title.trim(),
        descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${description.trim()}`,
        etiquetas: finalTags,
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? project : null,
        url: url.trim(),
        fecha: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('codex_items')
        .insert([newLink])
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = [...codexItems, data]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Limpiar formulario y cerrar modal
      clearForm()

    } catch (err) {
      console.error('Error saving link:', err)
      setError('Error al guardar el enlace')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Save Drive File
  const handleSaveDriveFile = async (fileParam?: any) => {
    console.log('💾 Guardando archivo de Drive')
    
    const driveFile = fileParam || selectedDriveFile

    if (!driveFile) {
      console.error('❌ No hay archivo de Drive seleccionado')
      setError('Selecciona un archivo de Google Drive')
      return
    }

    // Tomar título por defecto si no se ingresó manualmente
    const effectiveTitle = driveTitle.trim() || driveFile.name

    setIsSubmitting(true)
    setError(null)

    try {
      // --------------------------------------------------
      // 1) Obtener token válido (desde hook)
      // --------------------------------------------------
      let accessToken = driveToken
      if (!accessToken) {
        throw new Error('Necesitas conectar Google Drive antes de guardar el archivo')
      }

      console.log('🔑 Token de Drive obtenido (primeros 20 chars):', accessToken.substring(0, 20) + '...')

      // --------------------------------------------------
      // 2) Descargar archivo de Drive como blob
      // --------------------------------------------------
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media&supportsAllDrives=true`
      console.log('⬇️ Descargando archivo Drive desde:', downloadUrl)

      const downloadResp = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!downloadResp.ok) {
        throw new Error(`Error descargando archivo de Drive (${downloadResp.status})`)
      }

      const fileBlob = await downloadResp.blob()
      console.log('✅ Archivo Drive descargado, tamaño:', fileBlob.size)

      // --------------------------------------------------
      // 3) Subir archivo a Supabase Storage
      // --------------------------------------------------
      const fileExt = driveFile.name.split('.').pop() || 'bin'
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = getStoragePath(driveProject || 'sin-proyecto', uniqueName)

      console.log('⬆️ Subiendo a Supabase Storage en path:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('digitalstorage')
        .upload(filePath, fileBlob, {
          contentType: driveFile.mimeType || 'application/octet-stream'
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('digitalstorage')
        .getPublicUrl(filePath)

      console.log('✅ Archivo subido. URL pública:', urlData.publicUrl)

      // --------------------------------------------------
      // 4) Determinar tipo (audio, video, documento)
      // --------------------------------------------------
      let tipo = 'documento'
      if (driveFile.mimeType?.startsWith('image/')) tipo = 'imagen'
      else if (driveFile.mimeType?.startsWith('video/')) tipo = 'video'
      else if (driveFile.mimeType?.startsWith('audio/')) tipo = 'audio'

      // --------------------------------------------------
      // 5) Preparar metadata y guardar en codex_items
      // --------------------------------------------------
      const tagsArray = driveTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const finalTags = contentType.trim() ? [...tagsArray, contentType.trim()] : tagsArray

      const selectedProjectData = (driveProject && driveProject !== 'sin-proyecto') ? 
        userProjects.find(p => p.id === driveProject) : null

      const codexItem = {
        user_id: user?.id,
        tipo,
        titulo: effectiveTitle,
        descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${driveDescription.trim() || `Archivo importado de Google Drive: ${driveFile.name}`}`,
        etiquetas: finalTags,
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? driveProject : null,
        storage_path: filePath, // Ya está en Supabase
        url: urlData.publicUrl,
        nombre_archivo: driveFile.name,
        tamano: fileBlob.size,
        fecha: new Date().toISOString(),
        is_drive: false, // Ya no necesitamos tratarlo como Drive para transcripción
        drive_file_id: driveFile.id // Guardamos referencia por si acaso
      }

      console.log('💾 Insertando item en codex_items:', codexItem)

      const { data, error } = await supabase
        .from('codex_items')
        .insert([codexItem])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Archivo de Drive guardado en Codex:', data)

      // Actualizar estado local
      const updatedItems = [...codexItems, data]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      clearForm()

    } catch (err: any) {
      console.error('❌ Error guardando archivo de Drive:', err)
      setError(err.message || 'Error al guardar el archivo de Google Drive')
    } finally {
      setIsSubmitting(false)
    }
  }

  // File validation
  const validateFile = (file: File) => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = [
      'image/*',
      'video/*', 
      'audio/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/*'
    ]
    
    if (file.size > maxSize) {
      return `El archivo ${file.name} es muy grande. Máximo 100MB.`
    }
    
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
    
    if (!isValidType) {
      return `Tipo de archivo no permitido: ${file.type}`
    }
    
    return null
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []
    
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })
    
    if (errors.length > 0) {
      setError(errors.join('\n'))
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const validFiles: File[] = []
    const errors: string[] = []
    
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })
    
    if (errors.length > 0) {
      setError(errors.join('\n'))
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload files to Supabase Storage
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos un archivo para subir')
      return
    }

    if (!user?.id) {
      setError('Usuario no autenticado. Por favor, inicia sesión.')
      return
    }

    setIsUploading(true)
    setIsSubmitting(true)
    setError(null)

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        // Generate unique filename and get storage path based on project
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = getStoragePath(uploadProject, fileName)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('digitalstorage')
          .upload(filePath, file, {
            onUploadProgress: (progress) => {
              const percent = (progress.loaded / progress.total) * 100
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: percent
              }))
            }
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('digitalstorage')
          .getPublicUrl(filePath)

        // Determine file type based on MIME type
        let tipo = 'documento'
        if (file.type.startsWith('image/')) tipo = 'imagen'
        else if (file.type.startsWith('video/')) tipo = 'video'
        else if (file.type.startsWith('audio/')) tipo = 'audio'

        // Prepare metadata
        const tagsArray = uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        const finalTags = contentType.trim() ? [...tagsArray, contentType.trim()] : tagsArray

        // Get project information
        const selectedProjectData = (uploadProject && uploadProject !== 'sin-proyecto') ? userProjects.find(p => p.id === uploadProject) : null

        // Save to codex_items table
        const codexItem = {
          user_id: user?.id,
          tipo,
          titulo: uploadTitle.trim() || file.name,
          descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${uploadDescription.trim() || `Archivo subido: ${file.name}`}`,
          etiquetas: finalTags,
          proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
          project_id: selectedProjectData ? uploadProject : null,
          storage_path: filePath,
          url: urlData.publicUrl,
          nombre_archivo: file.name,
          tamano: file.size,
          fecha: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('codex_items')
          .insert([codexItem])
          .select()
          .single()

        if (error) throw error

        return data
      })

      const results = await Promise.all(uploadPromises)
      
      // Update local state
      const updatedItems = [...codexItems, ...results]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Clear form and close modal
      clearForm()
      setSelectedFiles([])
      setUploadProgress({})

    } catch (err) {
      console.error('Error uploading files:', err)
      setError(`Error al subir archivos: ${err.message}`)
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }
  }

  const clearForm = () => {
    setNoteTitle("")
    setNoteContent("")
    setNoteTags("")
    setSelectedProject("")
    setContentType("")
    setSelectedRelatedItems([])
    setShowRelationSelector(false)
    setUploadTitle("")
    setUploadDescription("")
    setUploadTags("")
    setUploadProject("")
    setDriveTitle("")
    setDriveDescription("")
    setDriveTags("")
    setDriveProject("")
    setSelectedSourceType(null)
    setIsModalOpen(false)
    // Reset metadata toggles
    setShowUploadMetadata(false)
    setShowDriveMetadata(false)
    setShowNoteMetadata(false)
    // Reset file states
    setSelectedFiles([])
    setUploadProgress({})
    setIsUploading(false)
    setSelectedDriveFile(null)
    setDriveFiles([])
    setIsDriveConnected(false)
    // Reset edit states
    setIsEditModalOpen(false)
    setEditingItem(null)
    setEditForm({
      titulo: '',
      descripcion: '',
      etiquetas: '',
      proyecto: ''
    })
    // No limpiamos el token del hook useGoogleDrive para mantener la sesión activa
    // El hook maneja su propio estado y limpieza cuando es necesario
  }

  // Predefined content types for suggestions
  const contentTypeSuggestions = [
    "Conferencia de prensa",
    "Entrevista exclusiva",
    "Documento legal",
    "Informe oficial",
    "Testimonio",
    "Declaración pública",
    "Investigación periodística",
    "Filtración",
    "Audio grabado",
    "Video testimonio",
    "Documento confidencial",
    "Expediente judicial",
    "Comunicado oficial",
    "Transcripción",
    "Evidencia documental"
  ]

  const statsConfig = [
    { label: "Documentos", count: stats.documentos, icon: FileText, color: "bg-blue-500", type: "documento" },
    { label: "Audios", count: stats.audios, icon: Headphones, color: "bg-purple-500", type: "audio" },
    { label: "Videos", count: stats.videos, icon: Video, color: "bg-green-500", type: "video" },
    { label: "Enlaces", count: stats.enlaces, icon: Link, color: "bg-orange-500", type: "enlace" },
    { label: "Notas", count: stats.notas, icon: NoteIcon, color: "bg-pink-500", type: "nota" },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Acceso Requerido</h3>
            <p className="text-slate-600">Necesitas iniciar sesión para acceder al Codex.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                <Archive className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Codex</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Tu archivo personal de fuentes, documentos, audios, videos y enlaces. Conecta tu Google Drive para
              comenzar a organizar y analizar tus materiales periodísticos.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {statsConfig.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedType(stat.type)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-3xl font-bold text-slate-900">{stat.count}</p>
                        </div>
                      </div>
                      <div className={`${stat.color} p-3 rounded-xl`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Nueva Fuente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-0">
                <DialogHeader className="p-6 pb-4">
                  <DialogTitle className="text-xl font-semibold text-slate-900">Agregar Nueva Fuente</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Selecciona cómo quieres agregar tu nueva fuente al Codex
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
                  {!selectedSourceType ? (
                    <div className="grid gap-4">
                      {/* Upload from Computer */}
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-blue-200"
                        onClick={() => setSelectedSourceType("upload")}
                      >
                        <CardContent className="flex items-center gap-4 p-6">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <Upload className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">Subir desde Computadora</h3>
                            <p className="text-sm text-slate-600">
                              Sube documentos, audios, videos desde tu dispositivo
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Connect Google Drive */}
                      {DRIVE_ENABLED && (
                        <Card
                          className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-green-200"
                          onClick={() => alert('Función Google Drive deshabilitada temporalmente')}
                        >
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="bg-green-100 p-3 rounded-lg">
                              <Cloud className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">Conectar Google Drive</h3>
                              <p className="text-sm text-slate-600">Función deshabilitada temporalmente</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {NOTE_ENABLED && (
                        <Card
                          className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-purple-200"
                          onClick={() => setSelectedSourceType("note")}
                        >
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="bg-purple-100 p-3 rounded-lg">
                              <NoteIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">Agregar Nota o Término</h3>
                              <p className="text-sm text-slate-600">Crea una nota de texto o define un término clave</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Back button */}
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedSourceType(null)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        ← Volver
                      </Button>

                      {/* Upload Form */}
                      {selectedSourceType === "upload" && (
                        <div className="space-y-4">
                          {/* Main Upload Area */}
                          <div 
                            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                          >
                            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 mb-2">Arrastra y suelta tus archivos aquí</p>
                            <p className="text-sm text-slate-500 mb-4">o</p>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            />
                            <Button 
                              variant="outline" 
                              onClick={() => document.getElementById('file-upload')?.click()}
                            >
                              Seleccionar Archivos
                            </Button>
                          </div>

                          {/* Selected Files List */}
                          {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-slate-700">Archivos seleccionados:</h4>
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{file.name}</p>
                                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {uploadProgress[file.name] && (
                                      <div className="w-16 bg-slate-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${uploadProgress[file.name]}%` }}
                                        />
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSelectedFile(index)}
                                      disabled={isUploading}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Optional Metadata Section */}
                          <div className="border border-slate-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setShowUploadMetadata(!showUploadMetadata)}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">Información adicional</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  Opcional
                                </Badge>
                              </div>
                              {showUploadMetadata ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                            
                            {showUploadMetadata && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <div className="space-y-2">
                                  <Label htmlFor="content-type">Tipo de Contenido</Label>
                                  <Input
                                    id="content-type"
                                    placeholder="Ej: Conferencia de prensa, Entrevista, Documento legal..."
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    list="content-suggestions"
                                  />
                                  <datalist id="content-suggestions">
                                    {contentTypeSuggestions.map((suggestion, index) => (
                                      <option key={index} value={suggestion} />
                                    ))}
                                  </datalist>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-title">Título personalizado</Label>
                                  <Input
                                    id="upload-title"
                                    placeholder="Ej: Conferencia Ministro de Salud - COVID-19"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-description">Descripción</Label>
                                  <Textarea
                                    id="upload-description"
                                    placeholder="Breve descripción del contenido y contexto..."
                                    rows={3}
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-tags">Etiquetas</Label>
                                  <Input
                                    id="upload-tags"
                                    placeholder="Ej: salud, gobierno, covid, oficial"
                                    value={uploadTags}
                                    onChange={(e) => setUploadTags(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-project">Proyecto</Label>
                                  <Select value={uploadProject} onValueChange={setUploadProject}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                                      {userProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Google Drive Form */}
                      {selectedSourceType === "drive" && (
                        <div className="space-y-4">
                          {/* Main Drive Connection */}
                          {!hasValidToken ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                              <Cloud className="h-12 w-12 text-green-600 mx-auto mb-4" />
                              <h3 className="font-semibold text-green-900 mb-2">Conectar con Google Drive</h3>
                              <p className="text-green-700 mb-4">
                                Autoriza el acceso para vincular archivos desde tu Drive
                              </p>
                              {driveError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                  <p className="text-red-700 text-sm">{driveError}</p>
                                </div>
                              )}
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  openPicker((file) => {
                                    const pickedFile = {
                                      id: file.id,
                                      name: file.name,
                                      mimeType: file.mimeType,
                                      size: 0,
                                      webViewLink: file.url,
                                      thumbnailLink: ''
                                    };
                                    setSelectedDriveFile(pickedFile);
                                    setDriveTitle(file.name);
                                    setDriveFiles([pickedFile]);
                                    setIsDriveConnected(true);
                                    
                                    // Guardar automáticamente el archivo en el Codex tras la selección
                                    setTimeout(() => {
                                      handleSaveDriveFile(pickedFile);
                                    }, 0);
                                  });
                                }}
                                disabled={driveLoading || !canUseDrive}
                              >
                                {driveLoading ? (
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Cloud className="h-4 w-4 mr-2" />
                                )}
                                {driveLoading ? 'Conectando...' : 'Conectar Google Drive'}
                              </Button>
                              {!canUseDrive && (
                                <p className="text-orange-600 text-sm mt-2">
                                  Necesitas iniciar sesión con Google para usar esta función
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-green-700">
                                    <Cloud className="h-5 w-5" />
                                    <span className="font-medium">Google Drive conectado</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      openPicker((file) => {
                                        const pickedFile = {
                                          id: file.id,
                                          name: file.name,
                                          mimeType: file.mimeType,
                                          size: 0,
                                          webViewLink: file.url,
                                          thumbnailLink: ''
                                        };
                                        setSelectedDriveFile(pickedFile);
                                        setDriveTitle(file.name);
                                        setDriveFiles([pickedFile]);
                                        
                                        // Guardar automáticamente el archivo en el Codex tras la selección
                                        setTimeout(() => {
                                          handleSaveDriveFile(pickedFile);
                                        }, 0);
                                      });
                                    }}
                                    disabled={driveLoading}
                                  >
                                    {driveLoading ? (
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    Seleccionar otro archivo
                                  </Button>
                                </div>
                              </div>

                              {/* Drive Files List */}
                              {driveFiles.length > 0 && (
                                <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                                    <h4 className="font-medium text-slate-700">Archivo seleccionado:</h4>
                                  </div>
                                  <div className="p-2">
                                    {driveFiles.map((file) => (
                                      <div
                                        key={file.id}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                                      >
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        <div className="flex-1 text-left">
                                          <p className="text-sm font-medium text-slate-700">{file.name}</p>
                                          <p className="text-xs text-slate-500">
                                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño desconocido'} • 
                                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Fecha desconocida'}
                                          </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                          ✓ Seleccionado
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Optional Metadata Section */}
                          <div className="border border-slate-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setShowDriveMetadata(!showDriveMetadata)}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">Información adicional</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  Opcional
                                </Badge>
                              </div>
                              {showDriveMetadata ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                            
                            {showDriveMetadata && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <p className="text-sm text-slate-600">
                                  Completa la información del archivo una vez conectado:
                                </p>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-content-type">Tipo de Contenido</Label>
                                  <Input
                                    id="drive-content-type"
                                    placeholder="Ej: Conferencia de prensa, Entrevista, Documento legal..."
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    list="content-suggestions"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-title">Título personalizado</Label>
                                  <Input
                                    id="drive-title"
                                    placeholder="Ej: Conferencia Ministro de Salud - COVID-19"
                                    value={driveTitle}
                                    onChange={(e) => setDriveTitle(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-description">Descripción</Label>
                                  <Textarea
                                    id="drive-description"
                                    placeholder="Breve descripción del contenido y contexto..."
                                    rows={3}
                                    value={driveDescription}
                                    onChange={(e) => setDriveDescription(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-tags">Etiquetas</Label>
                                  <Input
                                    id="drive-tags"
                                    placeholder="Ej: salud, gobierno, covid, oficial"
                                    value={driveTags}
                                    onChange={(e) => setDriveTags(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-project">Proyecto</Label>
                                  <Select value={driveProject} onValueChange={setDriveProject}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                                      {userProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Note/Term Form */}
                      {selectedSourceType === "note" && (
                        <div className="space-y-4">
                          {/* Required Note Fields */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="note-title">Título *</Label>
                              <Input 
                                id="note-title" 
                                placeholder="Ej: Término clave sobre corrupción municipal"
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="note-content">Contenido *</Label>
                              <Textarea
                                id="note-content"
                                placeholder="Escribe tu nota, definición o término clave aquí..."
                                rows={6}
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          {/* Optional Metadata Section */}
                          <div className="border border-slate-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setShowNoteMetadata(!showNoteMetadata)}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">Información adicional</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  Opcional
                                </Badge>
                              </div>
                              {showNoteMetadata ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                            
                            {showNoteMetadata && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <div className="space-y-2">
                                  <Label htmlFor="note-content-type">Tipo de Contenido</Label>
                                  <Input
                                    id="note-content-type"
                                    placeholder="Ej: Testimonio, Transcripción, Definición legal..."
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    list="content-suggestions"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="note-tags">Etiquetas</Label>
                                  <Input 
                                    id="note-tags" 
                                    placeholder="Ej: definición, corrupción, legal"
                                    value={noteTags}
                                    onChange={(e) => setNoteTags(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="project-select">Proyecto</Label>
                                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                                      {userProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Relations Section */}
                                {RELATIONS_ENABLED && (
                                  <div className="space-y-2 border-t border-slate-200 pt-4">
                                    <div className="flex items-center justify-between">
                                      <Label>Relacionar con archivos</Label>
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setShowRelationSelector(!showRelationSelector)}
                                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                      >
                                        <Link className="h-4 w-4 mr-1" />
                                        Relacionar
                                      </Button>
                                    </div>
                                    
                                    {showRelationSelector && (
                                      <div className="space-y-3 bg-slate-50 p-3 rounded-lg">
                                        <p className="text-sm text-slate-600">
                                          Selecciona archivos de tu Codex para relacionar con esta nota:
                                        </p>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                          {codexItems
                                            .filter(item => item.tipo !== 'nota' && item.id)
                                            .slice(0, 10)
                                            .map((item) => (
                                              <div key={item.id} className="flex items-center gap-2">
                                                <input
                                                  type="checkbox"
                                                  id={`relation-${item.id}`}
                                                  checked={selectedRelatedItems.includes(item.id)}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      setSelectedRelatedItems([...selectedRelatedItems, item.id])
                                                    } else {
                                                      setSelectedRelatedItems(selectedRelatedItems.filter(id => id !== item.id))
                                                    }
                                                  }}
                                                  className="rounded border-slate-300"
                                                />
                                                <label 
                                                  htmlFor={`relation-${item.id}`}
                                                  className="flex-1 text-sm cursor-pointer flex items-center gap-2"
                                                >
                                                  {(() => {
                                                    const IconComponent = getTypeIcon(item.tipo)
                                                    return <IconComponent className="h-3 w-3 text-slate-500" />
                                                  })()}
                                                  <span className="truncate">{item.titulo}</span>
                                                  <span className="text-xs text-slate-400 uppercase">
                                                    {item.tipo}
                                                  </span>
                                                </label>
                                              </div>
                                            ))}
                                        </div>
                                        {selectedRelatedItems.length > 0 && (
                                          <div className="text-xs text-slate-600">
                                            {selectedRelatedItems.length} archivo(s) seleccionado(s)
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <DialogFooter className="p-6 bg-slate-50 border-t -mx-6 -mb-4 mt-4">
                        <Button
                          onClick={clearForm}
                          variant="outline"
                          className="flex-1"
                          disabled={isSubmitting || isUploading}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={
                            isSubmitting || 
                            isUploading ||
                            (selectedSourceType === "note" && (!noteTitle.trim() || !noteContent.trim())) ||
                            (selectedSourceType === "upload" && selectedFiles.length === 0) ||
                            (selectedSourceType === "drive" && (!isDriveConnected || !selectedDriveFile))
                          }
                          onClick={() => {
                            if (selectedSourceType === "note") {
                              handleSaveNote()
                            } else if (selectedSourceType === "upload") {
                              handleUploadFiles()
                            } else if (selectedSourceType === "drive") {
                              handleSaveDriveFile()
                            }
                          }}
                        >
                          {(isSubmitting || isUploading) ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          {selectedSourceType === "upload" && (isUploading ? "Subiendo archivos..." : `Subir ${selectedFiles.length} archivo(s)`)}
                          {selectedSourceType === "drive" && (isSubmitting ? "Guardando..." : "Guardar desde Drive")}
                          {selectedSourceType === "note" && (isSubmitting ? "Guardando..." : "Guardar Nota")}
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-3 rounded-xl"
              onClick={loadCodexData}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              {isLoading ? 'Actualizando...' : 'Explorar Codex'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 max-w-2xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isTranscribing && (
            <div className="mt-4 max-w-2xl mx-auto">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-blue-500 animate-pulse" />
                      <p className="text-blue-600 font-medium">Transcribiendo archivo con Gemini AI...</p>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${transcriptionProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-600">{transcriptionProgress}% completado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por título, proyecto, etiquetas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48 h-12 border-slate-200">
                    <SelectValue placeholder="Tipo de fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="documento">Documentos</SelectItem>
                    <SelectItem value="audio">Audios</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="enlace">Enlaces</SelectItem>
                    <SelectItem value="nota">Notas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48 h-12 border-slate-200">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="revision">En revisión</SelectItem>
                    <SelectItem value="procesado">Procesado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="lg" className="h-12 px-4 border-slate-200">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-96 mx-auto bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="recent" className="rounded-lg">
              Recientes
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-lg">
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-lg">
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="archive" className="rounded-lg">
              Archivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {isLoading ? 'Cargando...' : showAllItems
                  ? `Todos los elementos (${filteredItems.length})`
                  : `Elementos recientes (${filteredItems.length})`}
              </h3>
              {!showAllItems && filteredItems.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAllItems(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Ver todos los elementos
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-600">Cargando elementos del Codex...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay elementos</h3>
                <p className="text-slate-600 mb-4">
                  {codexItems.length === 0 
                    ? "Aún no has agregado elementos a tu Codex." 
                    : "No se encontraron elementos que coincidan con tu búsqueda."
                  }
                </p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer elemento
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const IconComponent = getTypeIcon(item.tipo)
                  return (
                    <Card
                      key={item.id}
                      className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md overflow-hidden"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <IconComponent className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">
                                {item.titulo}
                              </CardTitle>
                              <CardDescription className="text-sm text-slate-500">
                                {formatFileSize(item.tamano)}
                              </CardDescription>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-60 hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewItem(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {(item.storage_path || item.url) && (
                                <DropdownMenuItem onClick={() => handleDownloadItem(item)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar
                                </DropdownMenuItem>
                              )}
                              {canTranscribe(item) && !item.audio_transcription && (
                                <DropdownMenuItem 
                                  onClick={() => handleTranscribeItem(item)}
                                  disabled={isTranscribing}
                                >
                                  <Mic className="h-4 w-4 mr-2" />
                                  {isTranscribing ? 'Transcribiendo...' : 'Transcribir'}
                                </DropdownMenuItem>
                              )}
                              {item.audio_transcription && (
                                <DropdownMenuItem onClick={() => handleShowTranscription(item)}>
                                  <Mic className="h-4 w-4 mr-2" />
                                  Transcripción
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteItemConfirm(item)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 capitalize">
                              {item.tipo}
                            </Badge>
                            {item.is_drive && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                Google Drive
                              </Badge>
                            )}
                          </div>

                          {item.proyecto && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Folder className="h-4 w-4" />
                              <span className="truncate">{item.proyecto}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(item.fecha)}</span>
                          </div>

                          {item.etiquetas && item.etiquetas.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.etiquetas.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  {tag}
                                </Badge>
                              ))}
                              {item.etiquetas.length > 2 && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  +{item.etiquetas.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {item.descripcion && (
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Load More / Show Less Section */}
            {(hasMoreItems || showAllItems) && filteredItems.length > 0 && (
              <div className="flex flex-col items-center gap-4 pt-8 border-t border-slate-200">
                {hasMoreItems && !showAllItems && (
                  <div className="text-center">
                    <p className="text-slate-600 mb-4">
                      Mostrando {itemsToShow} de {codexItems.length} elementos
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setItemsToShow((prev) => Math.min(prev + 6, codexItems.length))}
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Cargar 6 más
                      </Button>
                      <Button
                        onClick={() => setShowAllItems(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Ver todos ({codexItems.length})
                      </Button>
                    </div>
                  </div>
                )}

                {showAllItems && (
                  <div className="text-center">
                    <p className="text-slate-600 mb-4">Mostrando todos los {filteredItems.length} elementos</p>
                    <Button
                      onClick={() => {
                        setShowAllItems(false)
                        setItemsToShow(6)
                      }}
                      variant="outline"
                      className="border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Mostrar menos
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects">
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Vista de Proyectos</h3>
              <p className="text-slate-600">Organiza tus fuentes por proyectos de investigación</p>
            </div>
          </TabsContent>

          <TabsContent value="favorites">
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Elementos Favoritos</h3>
              <p className="text-slate-600">Acceso rápido a tus fuentes más importantes</p>
            </div>
          </TabsContent>

          <TabsContent value="archive">
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Archivo</h3>
              <p className="text-slate-600">Fuentes archivadas y materiales históricos</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Editar Elemento
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Modifica los metadatos de este elemento del Codex
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título *
              </label>
              <Input
                value={editForm.titulo}
                onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                placeholder="Título del elemento"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción
              </label>
              <textarea
                value={editForm.descripcion}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Proyecto *
              </label>
              <Select 
                value={editForm.proyecto} 
                onValueChange={(value) => setEditForm({ ...editForm, proyecto: value })}
              >
                <SelectTrigger className="border-slate-200 focus:border-blue-500">
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                  {userProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Etiquetas
              </label>
              <Input
                value={editForm.etiquetas}
                onChange={(e) => setEditForm({ ...editForm, etiquetas: e.target.value })}
                placeholder="Etiquetas separadas por comas"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Separa las etiquetas con comas
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editForm.titulo.trim() || !editForm.proyecto || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Transcripción */}
      <Dialog open={!!transcriptionModalItem} onOpenChange={() => setTranscriptionModalItem(null)}>
        {transcriptionModalItem && (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-600" />
                Transcripción de "{transcriptionModalItem.titulo}"
              </DialogTitle>
              <DialogDescription>Vista de solo lectura</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto prose">
              {transcriptionModalItem.audio_transcription?.split('\n').map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={() => setTranscriptionModalItem(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
} 