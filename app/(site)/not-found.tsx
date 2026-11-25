import { ButtonLink } from "@/components/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] items-center bg-olive pt-24 text-center text-ivory">
      <div className="container-lux">
        <p className="eyebrow text-champagne">404</p>
        <h1 className="display-xl mt-4 text-ivory">Somewhere <em className="text-champagne">else</em> entirely.</h1>
        <p className="mx-auto mt-6 max-w-md text-ivory/75">We couldn&apos;t find that page — but there&apos;s plenty more to explore.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/trips" variant="light">Explore Trips</ButtonLink>
          <ButtonLink href="/" variant="outline-light">Back Home</ButtonLink>
        </div>
      </div>
    </section>
  );
}
