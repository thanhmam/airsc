import { Composition } from "remotion";
import { AirscShort, type ShortProps } from "./AirscShort";
import { DURATION, FPS, HEIGHT, WIDTH, type Lang, type Variant } from "./timeline";

const VARIANTS: Variant[] = ["a", "b", "c"];
const LANGS: Lang[] = ["vi", "en"];

/** Six compositions: short-{a,b,c}-{vi,en}. A = fear hook (recommended), B = result first, C = overwhelm. */
export function Root() {
  return (
    <>
      {VARIANTS.flatMap((variant) =>
        LANGS.map((lang) => (
          <Composition
            key={`${variant}-${lang}`}
            id={`short-${variant}-${lang}`}
            component={AirscShort}
            durationInFrames={DURATION}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{ variant, lang } satisfies ShortProps}
          />
        )),
      )}
    </>
  );
}
