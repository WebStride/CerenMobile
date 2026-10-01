import type { ImageSourcePropType } from 'react-native';

/** Ceren company logo — placeholder when product/category has no image URL */
export const COMPANY_LOGO = require('../assets/images/HomeLogo.png');

export function isValidRemoteImageUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    (value.startsWith('http://') || value.startsWith('https://'))
  );
}

/** Remote URI when valid; otherwise company logo (never random/banana fallbacks). */
export function resolveProductImageSource(
  image: string | number | null | undefined,
): ImageSourcePropType {
  if (typeof image === 'number') {
    return image;
  }
  if (isValidRemoteImageUrl(image)) {
    return { uri: image.trim() };
  }
  return COMPANY_LOGO;
}

export function resolveCategoryImageSource(
  categoryImage: string | null | undefined,
): ImageSourcePropType {
  if (isValidRemoteImageUrl(categoryImage)) {
    return { uri: categoryImage!.trim() };
  }
  return COMPANY_LOGO;
}
