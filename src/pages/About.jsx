import React from "react";
import { Camera, Download, Upload, HardDrive } from "lucide-react";
import TroutIcon from "@/components/TroutIcon";
import HorizontalLinesIcon from "@/components/HorizontalLinesIcon";
import ReelDiscIcon from "@/components/ReelDiscIcon";
import BugWingsIcon from "@/components/BugWingsIcon";
import VerticalLinesIcon from "@/components/VerticalLinesIcon";
import { Package } from "lucide-react";

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
          Every serious angler knows the feeling — the perfect rod for the conditions, the right fly tied on, everything working together. Angler's Log is built around that attention to detail.
        </p>
        <p>
          Catalog your entire collection — lines, rods, reels, lures, flies and all your gear — with full specs, condition, photos and value. Pair lines with rods and reels, track what's spooled on what, and know exactly what you own and what it's worth. When you're on the water, log every catch with measurements, gear used and conditions. When you're off it, plan your next trip with moon phase and solunar data alongside local weather.
        </p>
        <p>
          Your data stays yours — export and download your full collection any time.
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