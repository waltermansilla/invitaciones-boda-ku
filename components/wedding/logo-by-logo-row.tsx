type LogoByLogoRowProps = {
  logos: string[]
  byText?: string
  logoWrapClassName?: string
  logoImgClassName?: string
  byClassName?: string
  gapClassName?: string
}

export function LogoByLogoRow({
  logos,
  byText,
  logoWrapClassName = "flex h-14 min-w-[100px] items-center justify-center sm:h-16",
  logoImgClassName = "max-h-full max-w-[160px] object-contain sm:max-w-[180px]",
  byClassName = "shrink-0 text-sm font-light tracking-[0.2em] text-inherit/75 md:text-base",
  gapClassName = "gap-4 sm:gap-6",
}: LogoByLogoRowProps) {
  const items = logos.filter(Boolean)
  if (items.length === 0) return null

  const showInlineBy =
    byText !== "" && items.length >= 2 && typeof byText !== "undefined"

  const LogoCell = ({
    src,
    large,
  }: {
    src: string
    large?: boolean
  }) => (
    <div
      className={
        large
          ? "flex h-16 min-w-[100px] items-center justify-center sm:h-[4.25rem]"
          : logoWrapClassName
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={
          large
            ? "max-h-full max-w-[175px] object-contain sm:max-w-[190px]"
            : logoImgClassName
        }
      />
    </div>
  )

  if (showInlineBy) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-2 py-1 sm:gap-2.5">
        <LogoCell src={items[0]} large />
        <span className={byClassName}>{byText ?? "by"}</span>
        <LogoCell src={items[1]} />
        {items.slice(2).map((src) => (
          <LogoCell key={src} src={src} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`mx-auto flex max-w-md flex-wrap items-center justify-center gap-8 sm:gap-12`}
    >
      {items.map((src) => (
        <LogoCell key={src} src={src} />
      ))}
    </div>
  )
}
