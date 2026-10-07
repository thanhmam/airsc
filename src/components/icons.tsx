import {
  Blocks, Bot, Box, ChartColumn, CreditCard, Database, FileCode2, Layout, Lock, Mail, Palette, Plug, Rocket,
  Search, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles, Users,
  type LucideIcon,
} from "lucide-react";
import type { ResourceType, Safety } from "@/lib/types";

export const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  skill: Sparkles,
  mcp: Plug,
  plugin: Blocks,
  agent: Users,
  rule: FileCode2,
};

export const KIT_ICON: Record<string, LucideIcon> = {
  layout: Layout,
  "credit-card": CreditCard,
  lock: Lock,
  database: Database,
  search: Search,
  rocket: Rocket,
  mail: Mail,
  chart: ChartColumn,
  bot: Bot,
  palette: Palette,
  box: Box,
};

export const SAFETY_ICON: Record<Safety, LucideIcon> = {
  safe: ShieldCheck,
  caution: ShieldQuestion,
  danger: ShieldAlert,
};
