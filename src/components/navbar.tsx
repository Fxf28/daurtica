"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ModeToggle } from "./mode-toggle"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner" // atau bisa menggunakan alert biasa

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const { user } = useUser()

  const navItems = [
    { name: "Beranda", href: "/" },
    { name: "Klasifikasi", href: "/classify" },
    { name: "Peta", href: "/map" },
    { name: "Edukasi", href: "/education" },
    { name: "Tentang Kami", href: "/about" },
    { name: "Dashboard", href: "/dashboard", requiresAuth: true }
  ]

  const handleClose = () => setOpen(false)

  const handleDashboardClick = (e: React.MouseEvent, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      e.preventDefault()
      e.stopPropagation()

      // Tampilkan toast/alert
      toast.error("Silakan login terlebih dahulu untuk mengakses Dashboard")

      // Atau bisa menggunakan alert biasa:
      // alert("Silakan login terlebih dahulu untuk mengakses Dashboard")
    }
  }

  const renderNavItem = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      return (
        <NavigationMenuItem key={item.href}>
          <NavigationMenuLink
            className={`${navigationMenuTriggerStyle()} cursor-not-allowed opacity-60`}
            onClick={(e) => handleDashboardClick(e, true)}
            title="Silakan login untuk mengakses Dashboard"
          >
            {item.name}
          </NavigationMenuLink>
        </NavigationMenuItem>
      )
    }

    return (
      <NavigationMenuItem key={item.href}>
        <NavigationMenuLink
          asChild
          className={`${navigationMenuTriggerStyle()} ${pathname === item.href ? "bg-muted font-semibold" : ""}`}
        >
          <Link href={item.href}>{item.name}</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    )
  }

  const renderMobileNavItem = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      return (
        <motion.li
          key={item.href}
          variants={{
            hidden: { opacity: 0, x: 20 },
            show: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={(e) => handleDashboardClick(e, true)}
            className={`block rounded px-2 py-2 transition w-full text-left cursor-not-allowed opacity-60 ${pathname === item.href ? "bg-muted font-semibold" : "hover:bg-muted/60"}`}
            title="Silakan login untuk mengakses Dashboard"
          >
            {item.name}
          </button>
        </motion.li>
      )
    }

    return (
      <motion.li
        key={item.href}
        variants={{
          hidden: { opacity: 0, x: 20 },
          show: { opacity: 1, x: 0 },
        }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href={item.href}
          className={`block rounded px-2 py-2 hover:bg-muted/60 transition ${pathname === item.href ? "bg-muted font-semibold" : ""}`}
          onClick={handleClose}
        >
          {item.name}
        </Link>
      </motion.li>
    )
  }

  return (
    <nav className="w-full border-b">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold">
          Daurtica
        </Link>

        {/* Desktop Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex gap-4">
            {navItems.map(renderNavItem)}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-3">
          <ModeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="transition-all duration-300 hover:shadow-[0_0_15px_#00ffcc]">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                variant="outline"
                className="transition-all duration-300 hover:shadow-[0_0_15px_#00ffcc]"
              >
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden relative z-50">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md hover:bg-muted transition"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Overlay + Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black"
              onClick={handleClose}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-64 
                        bg-background/70 backdrop-blur-lg 
                        shadow-lg p-4 z-50 flex flex-col border-l"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="self-end mb-4 p-2 rounded-md hover:bg-muted transition"
              >
                <X size={22} />
              </button>

              {/* Menu Items */}
              <motion.ul
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.1 } },
                }}
                className="flex flex-col gap-2"
              >
                {navItems.map(renderMobileNavItem)}
              </motion.ul>

              {/* Divider */}
              <div className="border-t border-white/20 dark:border-gray-700 my-4"></div>

              {/* Bottom Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex flex-col items-center gap-3 mt-auto"
              >
                <ModeToggle />
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button
                      className="w-full transition-all duration-300 hover:shadow-[0_0_15px_#00ffcc]"
                      onClick={handleClose}
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button
                      variant="outline"
                      className="w-full transition-all duration-300 hover:shadow-[0_0_15px_#00ffcc]"
                      onClick={handleClose}
                    >
                      Sign Up
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}