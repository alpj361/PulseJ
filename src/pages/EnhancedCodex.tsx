"use client"

import { useState, useEffect } from "react"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "../context/AuthContext"
import { supabase, getCodexItemsByUser, createCodexBucket } from "../services/supabase.ts"

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
  
  const { user } = useAuth()

  // Cargar datos del Codex cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      loadCodexData()
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

  const handleViewItem = (item: CodexItem) => {
    if (item.url) {
      window.open(item.url, '_blank')
    }
  }

  const handleEditItem = (item: CodexItem) => {
    setEditingItem(item)
    setEditForm({
      titulo: item.titulo,
      descripcion: item.descripcion || '',
      etiquetas: item.etiquetas.join(', '),
      proyecto: item.proyecto
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !user?.id) return
    
    setIsSubmitting(true)
    try {
      const updatedData = {
        titulo: editForm.titulo.trim(),
        descripcion: editForm.descripcion.trim() || null,
        etiquetas: editForm.etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag),
        proyecto: editForm.proyecto.trim()
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
      
      const newNote = {
        user_id: user?.id,
        tipo: 'nota',
        titulo: noteTitle.trim(),
        descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${noteContent.trim()}`,
        etiquetas: finalTags,
        proyecto: selectedProject || 'Sin proyecto',
        fecha: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('codex_items')
        .insert([newNote])
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
      
      const newLink = {
        user_id: user?.id,
        tipo: 'enlace',
        titulo: title.trim(),
        descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${description.trim()}`,
        etiquetas: finalTags,
        proyecto: project || 'Sin proyecto',
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
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user?.id}/${fileName}`



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

        // Save to codex_items table
        const codexItem = {
          user_id: user?.id,
          tipo,
          titulo: uploadTitle.trim() || file.name,
          descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${uploadDescription.trim() || `Archivo subido: ${file.name}`}`,
          etiquetas: finalTags,
          proyecto: uploadProject || 'Sin proyecto',
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

  // Google Drive Integration
  const initializeGoogleDrive = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      // Silently skip Google Drive initialization if not configured
      return
    }
    
    if (typeof window !== 'undefined' && window.gapi) {
      window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: clientId
        }).then(() => {
          const authInstance = window.gapi.auth2.getAuthInstance()
          if (authInstance) {
            setIsDriveConnected(authInstance.isSignedIn.get())
          }
        }).catch((error) => {
          // Only log error if Google Drive is actually configured
          console.warn('Google Drive API initialization failed:', error.error)
        })
      })
    }
  }

  const handleGoogleDriveAuth = async () => {
    try {
      if (!window.gapi) {
        setError('Google Drive API no está disponible. Recargue la página.')
        return
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        setError('Google Drive no está configurado. Configure VITE_GOOGLE_CLIENT_ID en las variables de entorno.')
        return
      }

      // Asegurarse de que auth2 esté cargado
      if (!window.gapi.auth2) {
        await new Promise((resolve) => {
          window.gapi.load('auth2', resolve)
        })
      }

      let authInstance = window.gapi.auth2.getAuthInstance()
      
      // Si no hay instancia, inicializar
      if (!authInstance) {
        await window.gapi.auth2.init({
          client_id: clientId
        })
        authInstance = window.gapi.auth2.getAuthInstance()
      }

      if (!authInstance) {
        setError('No se pudo inicializar Google Auth')
        return
      }
      
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn({
          scope: 'https://www.googleapis.com/auth/drive.file'
        })
      }

      setIsDriveConnected(true)
      await loadDriveFiles()
      
    } catch (err) {
      console.error('Error connecting to Google Drive:', err)
      setError(`Error al conectar con Google Drive: ${err.message || 'Error desconocido'}`)
    }
  }

  const loadDriveFiles = async () => {
    try {
      if (!window.gapi || !window.gapi.client) {
        await new Promise((resolve) => {
          window.gapi.load('client', resolve)
        })
        
        await window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
        })
      }

      const response = await window.gapi.client.drive.files.list({
        pageSize: 20,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        q: "trashed=false"
      })

      setDriveFiles(response.result.files || [])
    } catch (err) {
      console.error('Error loading Drive files:', err)
      setError('Error al cargar archivos de Google Drive')
    }
  }

  const handleDriveFileSelect = (file: any) => {
    setSelectedDriveFile(file)
    setDriveTitle(file.name)
  }

  const handleSaveDriveFile = async () => {
    if (!selectedDriveFile) {
      setError('Selecciona un archivo de Google Drive')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Determine file type based on MIME type
      let tipo = 'documento'
      if (selectedDriveFile.mimeType.startsWith('image/')) tipo = 'imagen'
      else if (selectedDriveFile.mimeType.startsWith('video/')) tipo = 'video'
      else if (selectedDriveFile.mimeType.startsWith('audio/')) tipo = 'audio'

      // Prepare metadata
      const tagsArray = driveTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const finalTags = contentType.trim() ? [...tagsArray, contentType.trim(), 'google-drive'] : [...tagsArray, 'google-drive']

      const codexItem = {
        user_id: user?.id,
        tipo,
        titulo: driveTitle.trim() || selectedDriveFile.name,
        descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${driveDescription.trim() || `Archivo de Google Drive: ${selectedDriveFile.name}`}`,
        etiquetas: finalTags,
        proyecto: driveProject || 'Sin proyecto',
        url: selectedDriveFile.webViewLink,
        nombre_archivo: selectedDriveFile.name,
        tamano: parseInt(selectedDriveFile.size) || 0,
        is_drive: true,
        drive_file_id: selectedDriveFile.id,
        fecha: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('codex_items')
        .insert([codexItem])
        .select()
        .single()

      if (error) throw error

      // Update local state
      const updatedItems = [...codexItems, data]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Clear form and close modal
      clearForm()
      setSelectedDriveFile(null)
      setDriveFiles([])

    } catch (err) {
      console.error('Error saving Drive file:', err)
      setError(`Error al guardar archivo de Drive: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load Google Drive API on component mount
  useEffect(() => {
    const loadGoogleAPI = () => {
      if (typeof window !== 'undefined' && !window.gapi) {
        const script = document.createElement('script')
        script.src = 'https://apis.google.com/js/api.js'
        script.onload = initializeGoogleDrive
        document.head.appendChild(script)
      } else if (window.gapi) {
        initializeGoogleDrive()
      }
    }

    loadGoogleAPI()
  }, [])

  const clearForm = () => {
    setNoteTitle("")
    setNoteContent("")
    setNoteTags("")
    setSelectedProject("")
    setContentType("")
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
    // Reset edit states
    setIsEditModalOpen(false)
    setEditingItem(null)
    setEditForm({
      titulo: '',
      descripcion: '',
      etiquetas: '',
      proyecto: ''
    })
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
    { label: "Documentos", count: stats.documentos, icon: FileText, color: "bg-blue-500", type: "documento", trend: "+3" },
    { label: "Audios", count: stats.audios, icon: Headphones, color: "bg-purple-500", type: "audio", trend: "+1" },
    { label: "Videos", count: stats.videos, icon: Video, color: "bg-green-500", type: "video", trend: "+2" },
    { label: "Enlaces", count: stats.enlaces, icon: Link, color: "bg-orange-500", type: "enlace", trend: "+5" },
    { label: "Notas", count: stats.notas, icon: NoteIcon, color: "bg-pink-500", type: "nota", trend: "+4" },
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
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            {stat.trend}
                          </Badge>
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-slate-900">Agregar Nueva Fuente</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Selecciona cómo quieres agregar tu nueva fuente al Codex
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
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
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-green-200"
                        onClick={() => setSelectedSourceType("drive")}
                      >
                        <CardContent className="flex items-center gap-4 p-6">
                          <div className="bg-green-100 p-3 rounded-lg">
                            <Cloud className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">Conectar Google Drive</h3>
                            <p className="text-sm text-slate-600">Vincula archivos directamente desde tu Drive</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Add Note/Term */}
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
                                      <SelectItem value="investigacion-corrupcion">Investigación Corrupción</SelectItem>
                                      <SelectItem value="analisis-economico">Análisis Económico</SelectItem>
                                      <SelectItem value="cobertura-electoral">Cobertura Electoral</SelectItem>
                                      <SelectItem value="salud-publica">Salud Pública</SelectItem>
                                      <SelectItem value="seguridad-ciudadana">Seguridad Ciudadana</SelectItem>
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
                          {!isDriveConnected ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                              <Cloud className="h-12 w-12 text-green-600 mx-auto mb-4" />
                              <h3 className="font-semibold text-green-900 mb-2">Conectar con Google Drive</h3>
                              <p className="text-green-700 mb-4">
                                Autoriza el acceso para vincular archivos desde tu Drive
                              </p>
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleGoogleDriveAuth}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Cloud className="h-4 w-4 mr-2" />
                                )}
                                Conectar Google Drive
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-700">
                                  <Cloud className="h-5 w-5" />
                                  <span className="font-medium">Google Drive conectado</span>
                                </div>
                              </div>

                              {/* Drive Files List */}
                              <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                  <h4 className="font-medium text-slate-700">Selecciona un archivo:</h4>
                                </div>
                                {driveFiles.length === 0 ? (
                                  <div className="p-4 text-center text-slate-500">
                                    <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
                                    Cargando archivos...
                                  </div>
                                ) : (
                                  <div className="p-2">
                                    {driveFiles.map((file) => (
                                      <button
                                        key={file.id}
                                        onClick={() => handleDriveFileSelect(file)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${
                                          selectedDriveFile?.id === file.id ? 'bg-blue-50 border border-blue-200' : ''
                                        }`}
                                      >
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        <div className="flex-1 text-left">
                                          <p className="text-sm font-medium text-slate-700">{file.name}</p>
                                          <p className="text-xs text-slate-500">
                                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño desconocido'} • 
                                            {new Date(file.modifiedTime).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
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
                                      <SelectItem value="investigacion-corrupcion">Investigación Corrupción</SelectItem>
                                      <SelectItem value="analisis-economico">Análisis Económico</SelectItem>
                                      <SelectItem value="cobertura-electoral">Cobertura Electoral</SelectItem>
                                      <SelectItem value="salud-publica">Salud Pública</SelectItem>
                                      <SelectItem value="seguridad-ciudadana">Seguridad Ciudadana</SelectItem>
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
                                      <SelectItem value="investigacion-corrupcion">Investigación Corrupción</SelectItem>
                                      <SelectItem value="analisis-economico">Análisis Económico</SelectItem>
                                      <SelectItem value="cobertura-electoral">Cobertura Electoral</SelectItem>
                                      <SelectItem value="salud-publica">Salud Pública</SelectItem>
                                      <SelectItem value="seguridad-ciudadana">Seguridad Ciudadana</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
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
                      </div>
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
                  <SelectItem value="Corrupción Municipal">Corrupción Municipal</SelectItem>
                  <SelectItem value="Transparencia Presupuestal">Transparencia Presupuestal</SelectItem>
                  <SelectItem value="Auditoría de Obras">Auditoría de Obras</SelectItem>
                  <SelectItem value="Contratos Públicos">Contratos Públicos</SelectItem>
                  <SelectItem value="Salud Pública">Salud Pública</SelectItem>
                  <SelectItem value="Seguridad Ciudadana">Seguridad Ciudadana</SelectItem>
                  <SelectItem value="Educación Local">Educación Local</SelectItem>
                  <SelectItem value="Medio Ambiente">Medio Ambiente</SelectItem>
                  <SelectItem value="Desarrollo Social">Desarrollo Social</SelectItem>
                  <SelectItem value="Sin Proyecto">Sin Proyecto</SelectItem>
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
    </div>
  )
} 