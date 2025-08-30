"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconDashboard,
  IconListDetails,
  IconIdBadge2,
  IconCards,
  IconMessageCircle,
  IconBook2,
} from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
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
      url: "/dashboard/mcq-generator",
      icon: IconListDetails,
      subRoutes: [
        {
          title: "PPT Generator",
          url: "/dashboard/mcq-generator",
        },
      ],
    },
    {
      title: "Flashcards",
      url: "/dashboard/flashcard",
      icon: IconCards,
      subRoutes: [
        {
          title: "Create-Flashcard",
          url: "/dashboard/flashcard/create-flashcard",
        },
        {
          title: "Edit Flashcard",
          url: "/dashboard/flashcard/edit-flashcard",
        },
      ],
    },
    {
      title: "Certificate Maker",
      url: "/dashboard/certificate",
      icon: IconIdBadge2,
    },

    {
      title: "Suggestions",
      url: "/dashboard/suggestions",
      icon: IconMessageCircle,
    },
  ],
  navSecondary: [],
  footerActions: [],
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
              <Link href="/" className="flex items-center gap-3">
                {" "}
                {/* Changed a to Link */}
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-primary-foreground">
                  <Image src="/image.png" alt="Logo" width={24} height={24} />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-semibold">EasyLearning</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    Teacher Tools
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
