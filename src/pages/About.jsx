import React from "react";
import { Waves, Fish, Info } from "lucide-react";
import TroutIcon from "@/components/TroutIcon";

export default function About() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <TroutIcon className="w-10 h-10 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">About My Fly Guy</h1>
          <p className="text-muted-foreground text-sm">Inventory Manager</p>
        </div>
      </div>

      <div className="prose prose-sm max-w-none text-foreground/90 space-y-4">
        <p>
          My Fly Guy is your ultimate fly fishing gear manager — built to help you organize
          your lines, rods, and reels so you're always ready for your next perfect cast.
        </p>
        <p>
          Keep a detailed inventory of every piece of equipment in your collection, track
          condition and specifications, and pair lines with the rods and reels they belong on.
          Whether you're chasing trout on a quiet stream or swinging for steelhead, My Fly Guy
          keeps your gear in order.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<Waves className="w-5 h-5" />}
          title="Lines"
          description="Track brand, model, weight, grain, head length, and condition for every fly line."
        />
        <FeatureCard
          icon={<Fish className="w-5 h-5" />}
          title="Rods & Reels"
          description="Catalog your rods and reels with full specs and link lines to their setups."
        />
        <FeatureCard
          icon={<Info className="w-5 h-5" />}
          title="Import / Export"
          description="Back up your collection to CSV and bring in existing data with ease."
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