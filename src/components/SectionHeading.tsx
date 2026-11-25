import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className={cn("eyebrow mb-4", light && "text-champagne")}>{eyebrow}</p>}
      <h2 className={cn("display-lg", light && "text-ivory")}>{title}</h2>
      {intro && <p className={cn("lead mt-5", light && "text-ivory/75")}>{intro}</p>}
    </Reveal>
  );
}
