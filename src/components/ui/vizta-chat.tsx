"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { 
  MessageSquare, 
  Database, 
  X,
  BarChart3,
  Send
} from 'lucide-react';

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback } from "./avatar";
import { ScrollArea } from "./scroll-area";

// Types
interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
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
    {children || <MessageSquare className="h-5 w-5" />}
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

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simular respuesta
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: "Esta es una respuesta de prueba. En una implementación real, esto vendría de una API de investigación.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <ViztaChat>
      <ViztaChatTrigger />
      <ViztaChatContent>
        <div className="flex flex-col space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-4">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Bienvenido a Vizta Chat</p>
              <p className="text-sm">Haz preguntas para iniciar tu investigación</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3",
                  message.sender === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.sender === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>V</AvatarFallback>
                  </Avatar>
                )}
                <div className="text-sm">
                  <p>{message.content}</p>
                  <time className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </time>
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
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
              <BarChart3 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Vizta está pensando...</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t">
          <Textarea
            placeholder="Escribe tu mensaje..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="min-h-10 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
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