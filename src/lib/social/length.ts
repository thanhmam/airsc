/** X's weighted length (twitter-text v3): links count 23, most Latin text 1, other code points (★, →, emoji, CJK) 2 */
export function weightedLength(text: string) {
  let n = 0;
  const rest = text.replace(/https?:\/\/\S+/g, () => {
    n += 23;
    return "";
  });
  for (const ch of rest) {
    const c = ch.codePointAt(0)!;
    const light = c <= 4351 || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247);
    n += light ? 1 : 2;
  }
  return n;
}

/** X Premium allows long posts; past this the editor warns */
export const POST_TARGET = 800;
export const POST_MAX = 1000;
