import { Photo, type PlaceholderTone } from "./Photo";

/** Editorial header used at the top of inner pages. */
export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageLabel,
  tone = "olive",
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  image?: string | null;
  imageLabel?: string;
  tone?: PlaceholderTone;
}) {
  return (
    <section className="relative isolate flex min-h-[62svh] items-end overflow-hidden pb-14 pt-36 sm:pb-20">
      <Photo src={image} alt={imageLabel ?? ""} label={imageLabel} tone={tone} priority className="absolute inset-0 -z-10 animate-slow-zoom" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-olive/85 via-olive/35 to-olive/10" />
      <div className="container-lux animate-fade-up">
        <p className="eyebrow mb-5 text-champagne">{eyebrow}</p>
        <h1 className="display-xl max-w-4xl text-ivory">{title}</h1>
        {intro && <p className="mt-6 max-w-xl text-base leading-relaxed text-ivory/85 sm:text-lg">{intro}</p>}
      </div>
    </section>
  );
}
