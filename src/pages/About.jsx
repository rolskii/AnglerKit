import React from "react";
import TroutIcon from "@/components/TroutIcon";

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
          Angler's Log is your complete fishing gear management system - the ultimate companion for organizing lines, rods, reels, lures and all your fishing essentials.
        </p>
        <p>
          Manage detailed inventories of every piece of equipment in your collection, condition, specifications and values. Pair lines with rods & reels, log your catches with photos and keep everything backed up securely while allowing you to download all of your data. Built with Apple-inspired design for an intuitive, native feel on every device.
        </p>
      </div>


      <div className="rounded-lg border-0 bg-primary/10 p-4 text-sm text-muted-foreground">
        Built with the Base44 platform.
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-lg border-0 bg-primary/10 p-4 space-y-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-heading font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}