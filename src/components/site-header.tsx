"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { IconMoon, IconSun, IconCamper } from "@tabler/icons-react";
import { useHeaderStore } from "@/store/header-store";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { title } = useHeaderStore();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Theme Toggle Dropdown */}
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className="w-9 px-0"
              aria-label="Change theme"
            >
              <IconSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <IconMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Theme Options Dropdown */}
            <div className="absolute right-0 mt-2 w-40 rounded-md border bg-popover shadow-md p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setTheme("light")}
              >
                <IconSun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setTheme("dark")}
              >
                <IconMoon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setTheme("system")}
              >
                <IconCamper className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
