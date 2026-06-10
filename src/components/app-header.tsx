"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { navLinks } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import { SendIcon, BellIcon } from "lucide-react";

const activeItem = navLinks.find((item) => item.isActive);

export function AppHeader() {
	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-4 md:px-6"
			)}
		>
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="h-5 data-[orientation=vertical]:self-center opacity-20"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-1">
				<Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
					<SendIcon />
				</Button>
				<Button aria-label="Notifications" size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
					<BellIcon />
				</Button>
				<NavUser />
			</div>
		</header>
	);
}
