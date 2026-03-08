interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  body: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left"
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div className="mb-4 text-[0.72rem] uppercase tracking-[0.34em] text-white/[0.46]">
        {eyebrow}
      </div>
      <h2 className="font-display text-4xl leading-[0.94] text-white sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.68] sm:text-lg">{body}</p>
    </div>
  );
}
