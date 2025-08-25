"use client";
import * as React from "react";
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconFolder,
  IconUsers,
  IconBook2,
  IconPresentation,
  IconIdBadge2,
  IconCards,
  IconSettings,
  IconHelpCircle,
  IconLogout,
} from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Teacher",
    email: "teacher@example.com",
    avatar: "/avatars/teacher.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
    },
    {
      title: "MCQ Generator",
      url: "/mcq-generator",
      icon: IconListDetails,
    },
    {
      title: "PPT Generator",
      url: "/ppt-generator",
      icon: IconPresentation,
    },
    {
      title: "Flashcards",
      url: "/flashcards",
      icon: IconCards,
    },
    {
      title: "Certificate Maker",
      url: "/certificate-maker",
      icon: IconIdBadge2,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelpCircle,
    },
  ],
  footerActions: [
    {
      title: "Logout",
      url: "/logout",
      icon: IconLogout,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className=" ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/" className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconBook2 className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold">Teacher Tools</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    Educational Suite
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarSeparator className="mx-3" />
        <NavSecondary
          items={data.navSecondary}
          title="Account"
          className="mt-auto"
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-4">
        <NavUser user={data.user} />
        <SidebarSeparator className="mx-3 my-2" />
        <SidebarMenu>
          {data.footerActions.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton variant="outline" asChild>
                <a href={item.url} className="text-muted-foreground">
                  <item.icon className="mr-2" />
                  {item.title}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
