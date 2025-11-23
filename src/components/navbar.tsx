// src/components/navbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./mode-toggle";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type NavItem = {
  name: string;
  href: string;
  requiresAuth?: boolean;
};

const navItems: NavItem[] = [
  { name: "Beranda", href: "/" },
  { name: "Klasifikasi", href: "/classify" },
  { name: "Peta", href: "/map" },
  { name: "Edukasi", href: "/education" },
  { name: "Tentang Kami", href: "/about" },
  { name: "Dashboard", href: "/dashboard", requiresAuth: true },
];

export function Navbar(): React.JSX.Element {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const { user } = useUser();
  const shouldReduceMotion = useReducedMotion();

  // Set mounted state untuk menghindari hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle scroll effect - hanya dijalankan di client
  React.useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

  // Transition used across animations, respects reduced motion
  const transition = React.useMemo(() => {
    if (shouldReduceMotion) {
      return { duration: 0.0 };
    }
    return { duration: 0.32, ease: [0.42, 0, 0.58, 1] as [number, number, number, number] };
  }, [shouldReduceMotion]);

  const mobileListVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      x: 0,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06, ...transition },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : 12 },
    show: { opacity: 1, x: 0, transition },
  };

  const handleClose = React.useCallback(() => setOpen(false), []);

  const handleDashboardClick = (e: React.MouseEvent, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault();
      e.stopPropagation();
      toast.error("Silakan login terlebih dahulu untuk mengakses Dashboard");
    } else {
      setOpen(false);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    if (item.requiresAuth && !user) {
      return (
        <NavigationMenuItem key={item.href}>
          <NavigationMenuLink
            className={`${navigationMenuTriggerStyle()} cursor-not-allowed opacity-60`}
            title="Silakan login untuk mengakses Dashboard"
            onClick={(e) => handleDashboardClick(e, true)}
            aria-disabled
          >
            {item.name}
          </NavigationMenuLink>
        </NavigationMenuItem>
      );
    }

    return (
      <NavigationMenuItem key={item.href}>
        <NavigationMenuLink
          asChild
          className={`${navigationMenuTriggerStyle()} ${isActive ? "bg-muted font-semibold" : ""}`}
        >
          <Link href={item.href}>{item.name}</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  };

  const renderMobileNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;

    if (item.requiresAuth && !user) {
      return (
        <motion.li
          key={item.href}
          variants={mobileItemVariants}
          className="list-none"
        >
          <button
            onClick={(e) => handleDashboardClick(e, true)}
            className={`block rounded-lg px-4 py-3 transition-all w-full text-left cursor-not-allowed opacity-60 border border-transparent ${isActive ? "bg-primary/10 text-primary font-semibold border-primary/20" : "hover:bg-muted/60"}`}
            title="Silakan login untuk mengakses Dashboard"
            aria-disabled
          >
            {item.name}
          </button>
        </motion.li>
      );
    }

    return (
      <motion.li key={item.href} variants={mobileItemVariants} className="list-none">
        <Link
          href={item.href}
          onClick={() => handleClose()}
          className={`block rounded-lg px-4 py-3 transition-all w-full text-left border border-transparent ${isActive ? "bg-primary/10 text-primary font-semibold border-primary/20" : "hover:bg-muted/60 hover:border-muted-foreground/20"}`}
        >
          {item.name}
        </Link>
      </motion.li>
    );
  };

  // Gunakan class yang konsisten antara server dan client
  const navClass = `w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-[1000] transition-all duration-200 ${isMounted && isScrolled ? 'shadow-sm bg-background/95' : ''
    }`;

  return (
    <>
      {/* Main Navbar */}
      <nav className={navClass}>
        <div className="flex items-center justify-between px-4 py-3 md:px-8 max-w-7xl mx-auto">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-bold tracking-tight flex-shrink-0"
            aria-label="Daurtica — Beranda"
            onClick={() => setOpen(false)}
          >
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Daurtica
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <NavigationMenu>
              <NavigationMenuList className="flex gap-2">
                {navItems.map(renderNavItem)}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-3">
            <ModeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="transition-all duration-200 hover:shadow-sm" size="sm">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline" className="transition-all duration-200 hover:shadow-sm" size="sm">Sign Up</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden relative z-[1050] flex items-center gap-2">
            <ModeToggle />
            <button
              onClick={() => setOpen((s) => !s)}
              className="p-2 rounded-lg hover:bg-muted transition-all active:scale-95"
              aria-expanded={open}
              aria-label={open ? "Tutup menu" : "Buka menu"}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay & Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
              transition={transition}
              className="fixed inset-0 bg-black z-[1051]"
              onClick={handleClose}
              aria-hidden
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={transition}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background/95 backdrop-blur-xl shadow-xl p-6 z-[1052] border-l flex flex-col"
              aria-label="Mobile navigation"
              style={{
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))',
                paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="text-xl font-bold">Menu</div>
                <button
                  onClick={handleClose}
                  aria-label="Tutup menu"
                  className="p-2 rounded-lg hover:bg-muted transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1">
                <motion.ul
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={mobileListVariants}
                  className="flex flex-col gap-2"
                >
                  {navItems.map(renderMobileNavItem)}
                </motion.ul>

                <div className="border-t my-6" />

                {/* Auth Section */}
                <div className="flex flex-col gap-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button
                        onClick={handleClose}
                        className="w-full py-3 font-medium"
                        size="lg"
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        className="w-full py-3 font-medium"
                        size="lg"
                      >
                        Sign Up
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Akun</span>
                      <UserButton />
                    </div>
                  </SignedIn>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}