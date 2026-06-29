import React from "react";
import { Camera, Download, Upload, HardDrive } from "lucide-react";
import TroutIcon from "@/components/TroutIcon";
import LineSpoolIcon from "@/components/LineSpoolIcon";
import ReelIcon from "@/components/ReelIcon";
import LureIcon from "@/components/LureIcon";

export default function About() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <TroutIcon className="w-10 h-10 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">About Angler's Log</h1>
          <p className="text-muted-foreground text-sm">Inventory Manager</p>
        </div>
      </div>

      <div className="prose prose-sm max-w-none text-foreground/90 space-y-4">
        <p>
          LineCraft is your complete fly fishing gear management system — the ultimate companion for organizing lines, rods, reels, lures, and all your fishing essentials. Stay perfectly prepared for your next adventure.
        </p>
        <p>
          Manage detailed inventories of every piece of equipment in your collection, track condition, specifications, and finances. Pair lines with rods and reels, log your catches with photos and conditions, and keep everything backed up securely. Built with Apple-inspired design for an intuitive, native feel on every device.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<LineSpoolIcon className="w-5 h-5" />}
          title="Lines"
          description="Track brand, model, weight, grain, head length, rod type, and detailed condition for every fly line."
        />
        <FeatureCard
          icon={<ReelIcon className="w-5 h-5" />}
          title="Rods & Reels"
          description="Catalog rods and reels with full specs, materials, types, and link them to your lines and setups."
        />
        <FeatureCard
          icon={<LureIcon className="w-5 h-5" />}
          title="Lures & Misc"
          description="Manage flies, lures, apparel, tools, and all your fishing accessories with photos and notes."
        />
        <FeatureCard
          icon={<Camera className="w-5 h-5" />}
          title="Catch Logging"
          description="Record every catch with species, location, gear used, water conditions, and multiple photos."
        />
        <FeatureCard
          icon={<HardDrive className="w-5 h-5" />}
          title="Full Backup & Restore"
          description="Backup your entire collection as JSON and restore instantly — all data and photos included."
        />
        <FeatureCard
          icon={<><Download className="w-2.5 h-2.5 inline mr-0.5" /><Upload className="w-2.5 h-2.5 inline" /></>}
          title="Import / Export"
          description="Import gear from CSV templates and export your collection for spreadsheet analysis."
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Built with the Base44 platform.
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-heading font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}