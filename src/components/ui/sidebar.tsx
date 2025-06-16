"use client";

import { cn } from "../../lib/utils";
import { ScrollArea } from "./scroll-area";
import { motion } from "framer-motion";
import { Badge } from "./Badge";
import {
  BarChart3,
  Database,
  ActivitySquare,
  Search,
  TrendingUp,
  Layers,
  Bookmark,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./avatar";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Separator } from "./separator";
import { LanguageContext } from "../../context/LanguageContext";
import { useAdmin } from "../../hooks/useAdmin";
import { useAuth } from "../../context/AuthContext";
import { Tooltip } from "@mui/material";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

const translations = {
  es: {
    socialPulse: 'Social Pulse',
    personalPulse: 'Personal Pulse', 
    myPulse: 'My Pulse',
    comingSoon: 'Coming Soon',
    trends: 'Trends',
    news: 'News',
    actividad: 'Actividad',
    sondeos: 'Sondeos',
    codex: 'Codex',
    proyectos: 'Proyectos',
    sources: 'Sources',
    analytics: 'Analytics',
    settings: 'Configuración',
    version: 'Jornal V.0.0462',
    maintenance: 'Maintenance',
    securityMaintenance: 'En mantenimiento por razones de seguridad'
  },
  en: {
    socialPulse: 'Social Pulse',
    personalPulse: 'Personal Pulse',
    myPulse: 'My Pulse', 
    comingSoon: 'Coming Soon',
    trends: 'Trends',
    news: 'News',
    actividad: 'Activity',
    sondeos: 'Polls',
    codex: 'Codex',
    proyectos: 'Projects',
    sources: 'Sources',
    analytics: 'Analytics',
    settings: 'Settings',
    version: 'Jornal V.0.0462',
    maintenance: 'Maintenance',
    securityMaintenance: 'Under maintenance for security reasons'
  },
};

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  disabled?: boolean;
  maintenanceMode?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const { language, setLanguage } = useContext(LanguageContext);
  const { isAdmin } = useAdmin();
  const { user, signOut } = useAuth();

  const t = translations[language];

  const navSections: NavSection[] = [
    {
      title: t.socialPulse,
      items: [
        {
          icon: <TrendingUp className="h-4 w-4" />,
          label: t.trends,
          path: "/dashboard"
        },
        {
          icon: <Bookmark className="h-4 w-4" />,
          label: t.news,
          path: "/news"
        }
      ]
    },
    {
      title: t.personalPulse,
      items: [
        {
          icon: <ActivitySquare className="h-4 w-4" />,
          label: t.actividad,
          path: "/recent"
        },
        {
          icon: <BarChart3 className="h-4 w-4" />,
          label: t.sondeos,
          path: "/sondeos"
        }
      ]
    },
    {
      title: t.myPulse,
      items: [
        {
          icon: <Database className="h-4 w-4" />,
          label: t.codex,
          path: "/codex"
        },
        {
          icon: <Layers className="h-4 w-4" />,
          label: t.proyectos,
          path: "/projectos"
        }
      ]
    },
    {
      title: t.comingSoon,
      items: [
        {
          icon: <Search className="h-4 w-4" />,
          label: t.sources,
          path: "/sources",
          disabled: true
        },
        {
          icon: <BarChart3 className="h-4 w-4" />,
          label: t.analytics,
          path: "/analytics",
          disabled: true
        }
      ]
    }
  ];

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r bg-white dark:bg-black",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-black transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2 px-2" 
                    >
                      <Avatar className='rounded size-4'>
                        <AvatarFallback>P</AvatarFallback>
                      </Avatar>
                      <motion.li
                        variants={variants}
                        className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium">
                              PulseJ
                            </p>
                            {isAdmin && <span className="text-xs">▼</span>}
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  {isAdmin && (
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild>
                        <NavLink
                          to="/admin"
                          className="flex items-center gap-2"
                        >
                          <span className="h-4 w-4">👨‍💼</span>
                          Admin Panel
                        </NavLink>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {navSections.map((section, sectionIndex) => (
                      <div key={section.title} className="mb-4">
                        {!isCollapsed && (
                          <motion.div
                            variants={variants}
                            className="px-2 py-1 mb-2"
                          >
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {section.title}
                            </p>
                          </motion.div>
                        )}
                        
                        {section.items.map((item) => (
                          <div key={item.path}>
                            {item.disabled ? (
                              <div
                                className={cn(
                                  "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5",
                                  item.maintenanceMode 
                                    ? "text-gray-500 cursor-not-allowed bg-gray-50" 
                                    : "text-muted-foreground/50 cursor-not-allowed"
                                )}
                              >
                                {item.icon}
                                <motion.li variants={variants}>
                                  {!isCollapsed && (
                                    <div className="flex items-center gap-2">
                                      <p className="ml-2 text-sm font-medium">{item.label}</p>
                                      {item.maintenanceMode ? (
                                        <Tooltip title={t.securityMaintenance} arrow placement="right">
                                          <Badge
                                            className={cn(
                                              "flex h-fit w-fit items-center gap-1.5 rounded border-none px-1.5 bg-gray-200 text-gray-700"
                                            )}
                                            variant="outline"
                                          >
                                            {t.maintenance}
                                          </Badge>
                                        </Tooltip>
                                      ) : (
                                        <Badge
                                          className={cn(
                                            "flex h-fit w-fit items-center gap-1.5 rounded border-none px-1.5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                          )}
                                          variant="outline"
                                        >
                                          {t.comingSoon}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </motion.li>
                              </div>
                            ) : (
                              <NavLink
                                to={item.path}
                                className={({ isActive }) => cn(
                                  "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                                  isActive && "bg-muted text-blue-600",
                                )}
                              >
                                {item.icon}
                                <motion.li variants={variants}>
                                  {!isCollapsed && (
                                    <p className="ml-2 text-sm font-medium">{item.label}</p>
                                  )}
                                </motion.li>
                              </NavLink>
                            )}
                          </div>
                        ))}
                        
                        {sectionIndex < navSections.length - 1 && (
                          <motion.div variants={variants} className="my-3">
                            {!isCollapsed && <Separator className="w-full" />}
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex flex-col p-2 border-t border-border">
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                        <Avatar className="size-4">
                          <AvatarFallback>
                            {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                             user?.user_metadata?.name?.charAt(0)?.toUpperCase() || 
                             user?.email?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                                                     {!isCollapsed && (
                             <>
                               <p className="text-sm font-medium">
                                 {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario'}
                               </p>
                               <span className="ml-auto text-xs">▼</span>
                             </>
                           )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                                                 <Avatar className="size-6">
                           <AvatarFallback>
                             {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                              user?.user_metadata?.name?.charAt(0)?.toUpperCase() || 
                              user?.email?.charAt(0)?.toUpperCase() || 'U'}
                           </AvatarFallback>
                         </Avatar>
                                                 <div className="flex flex-col text-left">
                           <span className="text-sm font-medium">
                             {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario'}
                           </span>
                           <span className="line-clamp-1 text-xs text-muted-foreground">
                             {user?.email || 'usuario@pulsej.com'}
                           </span>
                         </div>
                      </div>
                      <DropdownMenuSeparator />
                                            <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2"
                      >
                         <NavLink to="/profile">
                           <span className="h-4 w-4">👤</span> Perfil
                         </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2"
                      >
                         <NavLink to="/settings">
                           <span className="h-4 w-4">⚙️</span> {t.settings}
                         </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                                             <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                      >
                        <span className="h-4 w-4">🌐</span> 
                        {language === 'es' ? 'English' : 'Español'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={signOut}
                      >
                        <span className="h-4 w-4">🚪</span> Cerrar sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <motion.div variants={variants} className="mt-2">
                  {!isCollapsed && (
                    <p className="text-xs text-muted-foreground text-center">
                      {t.version}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
} 