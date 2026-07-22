import React from "react";

export default function About() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">About AnglerKit</h1>
        <p className="text-muted-foreground text-sm">An Indispensable Fishing Toolbox</p>
      </div>

      <div className="prose prose-sm max-w-none text-foreground/90 space-y-4">
        <p>
          AnglerKit has grown from a gear tracker into an indispensable fishing toolbox - pairing detailed equipment management with real-time conditions intelligence, so you always know what's in your kit and what the water and sky are doing before you head out.
        </p>
        <p>
          Track moon phases and bite windows, check live weather, and follow real-time river levels and historical trends for your favorite waters. Alongside that, manage detailed inventories of every rod, reel, line and lure - condition, details and values - pair gear for a trip, and log your catches with photos. Everything is backed up securely, with full data export whenever you need it. Built with Apple-inspired design for an intuitive, native feel on every device.
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