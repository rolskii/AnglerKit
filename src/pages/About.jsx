import React from "react";
import { Camera, Download, Upload, HardDrive } from "lucide-react";
import TroutIcon from "@/components/TroutIcon";
import { LinesIcon as HorizontalLinesIcon, ReelIcon as ReelDiscIcon, RodIcon as VerticalLinesIcon } from "@/components/GearIcons";
import BugWingsIcon from "@/components/BugWingsIcon";
import { Package } from "lucide-react";

export default function About() {
  return (
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8 max-w-3xl">
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
          Angler's Log is a purpose-built companion for the discerning angler — one place to manage every piece of equipment, record every catch and time every trip around the natural rhythms that move fish.
        </p>
        <p>
          Maintain a detailed inventory of lines, rods, reels, lures, flies, and miscellaneous gear, each captured with specifications, condition, photographs, and value. Connect lines to the rods and reels they're paired with, track what's spooled and what's on a spare, and always know precisely what you own and what it's worth.
        </p>
        <p>
          On the water, log every catch with species, measurements, conditions, and the exact gear that hooked it. Off the water, plan your next outing with lunar phase and solunar feeding tables alongside live local weather.
        </p>
        <p>
          Your records displayed individually in a neat digital card remain entirely yours. You can share them with your friends & family. Or Export and back up your full collection at any time, in a format you control.
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