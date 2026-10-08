/**
 * Airsc logo from the official kit (public/brand). Letters are outlined, so no font is needed.
 * tone="auto" follows the site theme: Violet tile + white "AI" on light, Violet 400 tile with "AI" cut out on dark.
 * Kit rules: logo at least 20px tall, symbol at least 16px; keep half the tile height clear on every side.
 */
const TILE =
  "M268 0H1017.2A67 67 0 0 1 1064.6 19.6L1320.4 275.4A67 67 0 0 1 1340 322.8V1072A268 268 0 0 1 1072 1340H268A268 268 0 0 1 0 1072V268A268 268 0 0 1 268 0Z";
const AI = "M205 1025H342L400 858H681L739 1025H876L620 315H461ZM439 745 540 447 642 745ZM980 315V1025H1111V315Z";
const RSC =
  "M1490 495V1025H1620V723C1620 638 1655 596 1740 596H1791V495H1741C1673 495 1634 529 1614 598L1611 495ZM2199 664 2330 658C2313 550 2224 482 2099 482C1958 482 1871 546 1871 650C1871 750 1960 783 2090 809C2144 821 2202 829 2203 880C2203 923 2150 939 2108 939C2041 939 2000 905 1990 850L1859 857C1867 969 1965 1037 2110 1037C2234 1037 2336 988 2336 883C2336 781 2255 743 2111 719C2059 710 2006 691 2005 648C2004 606 2043 580 2092 580C2142 580 2190 612 2199 664ZM2781 690 2914 683C2900 559 2795 483 2668 483C2510 483 2406 592 2406 760C2406 928 2510 1037 2668 1037C2799 1037 2903 958 2918 830L2784 824C2774 895 2727 932 2668 932C2586 932 2539 869 2539 760C2539 651 2586 588 2668 588C2724 588 2771 624 2781 690Z";

const TONES = {
  auto: { tile: "var(--accent)", ai: "var(--logo-ai)", word: "currentColor" },
  light: { tile: "#5a3df0", ai: "#ffffff", word: "#111113" },
  dark: { tile: "#8f7bff", ai: "transparent", word: "#f1f1ee" },
};

export function Logo({
  symbol = false,
  tone = "auto",
  className,
  style,
  title = "Airsc",
}: {
  symbol?: boolean;
  tone?: keyof typeof TONES;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const c = TONES[tone];
  return (
    <svg
      viewBox={symbol ? "0 0 1340 1340" : "0 0 2918 1340"}
      role="img"
      aria-label={title}
      className={className}
      style={style}
    >
      <path fill={c.tile} fillRule="evenodd" d={TILE + AI} />
      <path fill={c.ai} d={AI} />
      {!symbol && <path fill={c.word} d={RSC} />}
    </svg>
  );
}
