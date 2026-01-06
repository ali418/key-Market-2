export const buildPoeticDescription = (product) => {
  const name = product?.name_ar || product?.name || '';
  const base = product?.description_ar || product?.description || '';
  if (base && base.trim().length >= 30) return base;
  const motifs = ['عبق الماضي', 'أناقة الحاضر', 'لمسة راقية', 'سحر يلامس الروح'];
  const pick = motifs[Math.floor(Math.random() * motifs.length)];
  return `${name ? name + '، ' : ''}${pick} تمتزج بتفاصيل دقيقة تمنحك تجربة فريدة تدوم.`;
};