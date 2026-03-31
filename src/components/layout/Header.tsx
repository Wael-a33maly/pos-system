'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ShoppingCart,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { OpenShiftDialog } from '@/modules/shifts/components/OpenShiftDialog';

interface HeaderProps {
  onToggleSidebar: () => void;
}

// Helper function to validate user ID (must be a valid string)
function isValidUserId(id: string | undefined): boolean {
  if (!id) return false;
  // Valid ID: string with at least 10 characters
  return typeof id === 'string' && id.length >= 10;
}

// Animated notification bell
function NotificationBell({ count }: { count: number }) {
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <motion.div
      animate={count > 0 ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3, repeat: isAnimating ? 0 : Infinity, repeatDelay: 3 }}
      onHoverStart={() => setIsAnimating(true)}
      onHoverEnd={() => setIsAnimating(false)}
    >
      <Bell className={cn("h-5 w-5 transition-transform", count > 0 && "animate-swing")} />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium shadow-lg"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </motion.div>
  );
}

// Theme toggle button
function ThemeButton({
  theme,
  currentTheme,
  icon: Icon,
  onClick,
  label,
}: {
  theme: string;
  currentTheme: string | undefined;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  label: string;
}) {
  const isActive = currentTheme === theme;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center h-8 w-8 rounded-lg transition-colors",
        isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {isActive && (
        <motion.div
          layoutId="theme-indicator"
          className="absolute inset-0 bg-primary rounded-lg"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className="h-4 w-4 relative z-10" />
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, currentShift, notifications, logout } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOpenShiftDialog, setShowOpenShiftDialog] = useState(false);
  const [showReLoginDialog, setShowReLoginDialog] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handlePOSClick = () => {
    // Check if user ID is valid before opening shift dialog
    if (!isValidUserId(user?.id)) {
      setShowReLoginDialog(true);
      return;
    }
    setShowOpenShiftDialog(true);
  };

  const handleReLogin = () => {
    logout();
    setShowReLoginDialog(false);
    router.refresh();
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Call logout API to clear HTTP-only cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear local state
      logout();
      setShowLogoutConfirm(false);
      // Redirect to login page
      router.push('/?page=login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API fails
      logout();
      router.push('/?page=login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="h-full px-4 flex items-center justify-between">
        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* POS Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handlePOSClick}
              className={cn(
                "relative overflow-hidden group",
                "bg-gradient-to-l from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "transition-all duration-300"
              )}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              
              <ShoppingCart className="h-4 w-4 ml-2 relative z-10" />
              <span className="relative z-10 font-semibold">نقطة البيع</span>
              
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-md bg-primary"
                animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>

          {/* Shift Status */}
          <AnimatePresence>
            {currentShift && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="hidden sm:flex"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-2 px-3 py-1.5",
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                    "font-medium"
                  )}
                >
                  <motion.span
                    className="h-2 w-2 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  وردية مفتوحة
                  <Clock className="h-3 w-3 mr-1" />
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-0.5 p-1 bg-muted/30 rounded-xl border border-border/50"
          >
            <ThemeButton
              theme="light"
              currentTheme={theme}
              icon={Sun}
              onClick={() => setTheme('light')}
              label="فاتح"
            />
            <ThemeButton
              theme="dark"
              currentTheme={theme}
              icon={Moon}
              onClick={() => setTheme('dark')}
              label="داكن"
            />
            <ThemeButton
              theme="system"
              currentTheme={theme}
              icon={Monitor}
              onClick={() => setTheme('system')}
              label="تلقائي"
            />
          </motion.div>

          {/* Notifications */}
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-xl hover:bg-muted/50"
              >
                <NotificationBell count={unreadCount} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-0 rounded-xl border-border/50 shadow-xl">
              <div className="p-4 border-b border-border/50 bg-gradient-to-l from-muted/50 to-transparent">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">الإشعارات</h4>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} جديد
                    </Badge>
                  )}
                </div>
              </div>
              <ScrollArea className="h-80">
                {notifications && notifications.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {notifications.slice(0, 5).map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 hover:bg-muted/30 cursor-pointer transition-colors",
                          !notification.isRead && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            !notification.isRead ? "bg-primary/10" : "bg-muted/50"
                          )}>
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    </motion.div>
                    <p className="text-muted-foreground">لا توجد إشعارات</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">ستظهر الإشعارات هنا</p>
                  </motion.div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  className="gap-2 px-2 h-10 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <motion.span
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {user?.name || 'المستخدم'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl border-border/50 shadow-xl">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-semibold block">{user?.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href="/?page=profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  الملف الشخصي
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowLogoutConfirm(true)}
                className="text-destructive focus:text-destructive rounded-lg cursor-pointer"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Open Shift Dialog */}
      <OpenShiftDialog
        open={showOpenShiftDialog}
        onOpenChange={setShowOpenShiftDialog}
        onSuccess={() => router.push('/?mode=pos')}
      />

      {/* Re-login Dialog */}
      <AlertDialog open={showReLoginDialog} onOpenChange={setShowReLoginDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </motion.div>
              جلسة تسجيل الدخول منتهية
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              يرجى تسجيل الدخول مرة أخرى للمتابعة. قد تكون بيانات الجلسة قديمة أو غير صالحة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReLoginDialog(false)} className="rounded-xl">
              إلغاء
            </Button>
            <AlertDialogAction onClick={handleReLogin} className="rounded-xl">
              تسجيل الدخول
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <LogOut className="h-6 w-6 text-destructive" />
              </motion.div>
              تأكيد تسجيل الخروج
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              هل أنت متأكد من تسجيل الخروج؟ سيتم إنهاء الجلسة الحالية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="rounded-xl" disabled={isLoggingOut}>
              إلغاء
            </Button>
            <AlertDialogAction 
              onClick={handleLogout} 
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <LogOut className="h-4 w-4" />
                  </motion.div>
                  جاري الخروج...
                </div>
              ) : (
                'تسجيل الخروج'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
