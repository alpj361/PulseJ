"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  X,
  BarChart3,
  MessageCircle,
  Send,
  Clock,
  Hash,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback } from "./avatar";
import { ScrollArea } from "./scroll-area";
import { textToSpeechElevenLabs } from "@/services/elevenLabs";

// Types
interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  toolUsed?: string;
  executionTime?: number;
  tweetsAnalyzed?: number;
}

// Components
const ViztaChat = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>
>(({ ...props }, ref) => (
  <SheetPrimitive.Root {...props} />
));
ViztaChat.displayName = "ViztaChat";

const ViztaChatTrigger = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Trigger
    ref={ref}
    className={cn(
      "fixed right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 focus:outline-none",
      className
    )}
    {...props}
  >
    {children || <MessageCircle className="h-4 w-4" />}
  </SheetPrimitive.Trigger>
));
ViztaChatTrigger.displayName = "ViztaChatTrigger";

const ViztaChatPortal = ({
  ...props
}: SheetPrimitive.DialogPortalProps) => (
  <SheetPrimitive.Portal {...props} />
);
ViztaChatPortal.displayName = "ViztaChatPortal";

const ViztaChatOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
ViztaChatOverlay.displayName = "ViztaChatOverlay";

const ViztaChatContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ViztaChatPortal>
    <ViztaChatOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col gap-4 right-0 inset-y-0 h-full w-3/4 sm:w-[400px] border-l bg-background p-0 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300",
        className
      )}
      {...props}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Vizta Chat</h2>
          <SheetPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </div>
        <ScrollArea className="flex-1 p-6">
          {children}
        </ScrollArea>
      </div>
    </SheetPrimitive.Content>
  </ViztaChatPortal>
));
ViztaChatContent.displayName = "ViztaChatContent";

// Main component
const ViztaChatUI = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("");
  const [audioEnabled, setAudioEnabled] = React.useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Speech recognition
  const [isRecording, setIsRecording] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  // Generar sessionId al montar el componente
  React.useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  // Hablar cuando llegue mensaje del asistente
  React.useEffect(() => {
    if (!audioEnabled) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.sender !== "assistant") return;

    const speak = async () => {
      try {
        setIsSpeaking(true);
        const { url, cleanup } = await textToSpeechElevenLabs(last.content);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => {
          cleanup();
          setIsSpeaking(false);
        };
      } catch (err) {
        console.error("TTS error", err);
        setIsSpeaking(false);
      }
    };

    speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Toggle audio (moved before JSX usage)
  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Importar dinámicamente el servicio
      const { sendViztaChatQuery } = await import('../../services/viztaChat');
      
      // Enviar consulta al backend
      const response = await sendViztaChatQuery(currentInput, sessionId);
      
      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.response,
          sender: "assistant",
          timestamp: new Date(),
          toolUsed: response.toolUsed,
          executionTime: response.executionTime,
          tweetsAnalyzed: response.toolResult?.tweets?.length || 0
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor intenta de nuevo.`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice input
  const handleToggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconocimiento de voz no soportado en este navegador.");
      return;
    }

    // Pedir permiso de micrófono explícitamente para evitar error "network"
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Permiso de micrófono denegado o no disponible", err);
      alert("Debe permitir el acceso al micrófono para dictar mensajes.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      alert("Error con el servicio de reconocimiento de voz: " + e.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  return (
    <ViztaChat>
      <ViztaChatTrigger />
      <ViztaChatContent>
        <div className="flex flex-col space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 text-center p-6 select-none">
              <span className="h-14 w-14 mb-3 text-primary/70 text-4xl font-bold">V</span>
              <h3 className="text-xl font-bold mb-1 text-foreground">¡Hola! Soy Vizta</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Asistente especializado en análisis de redes sociales & tendencias de Guatemala.
              </p>

              {/* Quick prompts */}
              <div className="flex flex-col w-full max-w-xs gap-2">
                <button
                  onClick={() => setInputValue("¿Qué está pasando en Guatemala hoy?")}
                  className="w-full bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 text-blue-800 text-sm font-medium py-2 rounded-xl shadow-sm active:scale-[.98] transition-all"
                >
                  ¿Qué está pasando en Guatemala?
                </button>
                <button
                  onClick={() => setInputValue("Analiza el sentimiento político actual")}
                  className="w-full bg-gradient-to-r from-fuchsia-100 to-pink-50 hover:from-fuchsia-200 hover:to-pink-100 text-pink-800 text-sm font-medium py-2 rounded-xl shadow-sm active:scale-[.98] transition-all"
                >
                  Analizar sentimiento político
                </button>
                <button
                  onClick={() => setInputValue("Muestra las principales tendencias en redes sociales")}
                  className="w-full bg-gradient-to-r from-green-100 to-emerald-50 hover:from-green-200 hover:to-emerald-100 text-green-800 text-sm font-medium py-2 rounded-xl shadow-sm active:scale-[.98] transition-all"
                >
                  Tendencias en redes sociales
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3",
                  message.sender === "user"
                    ? "ml-auto bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 text-white shadow-lg hover:shadow-xl transition-shadow"
                    : "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                )}
              >
                {message.sender === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      <span className="text-xs font-bold">V</span>
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="text-sm">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3 text-foreground">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-semibold mb-1 mt-2 text-foreground">{children}</h3>,
                        p: ({children}) => <p className="mb-2 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="mb-2 ml-4">{children}</ul>,
                        li: ({children}) => <li className="mb-1 leading-relaxed">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <time className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </time>
                    {message.sender === "assistant" && (
                      <div className="flex items-center gap-1">
                        {message.toolUsed && (
                          <span className="text-xs py-0 px-1">
                            {message.toolUsed}
                          </span>
                        )}
                        {message.executionTime && (
                          <span className="text-xs py-0 px-1 bg-blue-50 text-blue-700 flex items-center gap-1">
                            <span className="text-sm">⏱</span>
                            {(message.executionTime / 1000).toFixed(1)}s
                          </span>
                        )}
                        {message.tweetsAnalyzed && (
                          <span className="text-xs py-0 px-1 bg-green-50 text-green-700 flex items-center gap-1">
                            <span className="text-sm">#</span>
                            {message.tweetsAnalyzed} tweets
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-8 w-8 ml-auto">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-3 rounded-lg p-3 bg-white border border-gray-200 shadow-sm">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  <span className="text-xs font-bold">V</span>
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <span className="text-sm text-muted-foreground">
                  Analizando tu consulta...
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Procesando datos y generando respuesta inteligente
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="h-3 w-3 animate-pulse text-blue-500" />
                  <span className="text-xs text-blue-600">
                    Conectando con herramientas de análisis
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t bg-background/50 backdrop-blur-md">
          <div className="flex-1 h-10 bg-gradient-to-br from-blue-500 to-purple-500 p-[1px] rounded-xl">
            <Textarea
              placeholder="Escribe tu mensaje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-full flex-1 resize-none rounded-xl bg-background px-3 py-2 focus-visible:ring-0 focus-visible:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          {((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) && (
            <button
              onClick={handleToggleRecording}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors",
                isRecording ? "bg-red-100 text-red-600" : "bg-white hover:bg-gray-50"
              )}
              title={isRecording ? "Detener grabación" : "Grabar mensaje"}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </div>
      </ViztaChatContent>
    </ViztaChat>
  );
};

export { 
  ViztaChat, 
  ViztaChatTrigger, 
  ViztaChatContent, 
  ViztaChatOverlay, 
  ViztaChatPortal,
  ViztaChatUI 
}; 