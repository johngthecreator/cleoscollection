import {
  asArray,
  asRecord,
  numberValue,
  parseJsonScript,
  pythonTruthy,
  stringOrNumber,
  stringValue,
  type BrightDataScrapeOptions,
  scrapeHtml,
} from "./shared";

const BASE_URL = "https://www.gymshark.com";

export interface GymsharkSizeOption {
  size: string;
  sku: string | null;
  inStock: boolean;
  inventoryQuantity: number | null;
  price: number | null;
}

export interface GymsharkProductDetail {
  productId: string | number | null;
  sku: string | null;
  name: string;
  colour: string | null;
  fit: string | null;
  url: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  inStock: boolean;
  rating: number | null;
  sizes: GymsharkSizeOption[];
  sizesInStock: string[];
}

function extractSizes(product: Record<string, unknown>): GymsharkSizeOption[] {
  return asArray(product.availableSizes).flatMap((value) => {
    const size = asRecord(value);
    if (!size) return [];
    return [
      {
        size: stringValue(size.size) ?? "",
        sku: stringValue(size.sku),
        inStock: pythonTruthy(size.inStock),
        inventoryQuantity: numberValue(size.inventoryQuantity),
        price: numberValue(size.price),
      },
    ];
  });
}

export function parseGymsharkProductDetail(
  html: string,
): GymsharkProductDetail | null {
  const root = asRecord(parseJsonScript(html, "script#__NEXT_DATA__"));
  const pageProps = asRecord(asRecord(root?.props)?.pageProps);
  const productData = asRecord(pageProps?.productData);
  const product = asRecord(productData?.product);
  if (!product) return null;

  const featuredValue = asRecord(product.featuredMedia);
  const featuredMedia =
    featuredValue && pythonTruthy(featuredValue)
      ? featuredValue
      : asRecord(asArray(product.media)[0]);
  const ratingData = asRecord(product.rating);
  const rating =
    numberValue(ratingData?.value) ||
    numberValue(ratingData?.average) ||
    numberValue(product.rating);
  const handle = stringValue(product.handle);
  const sizesInStock = asArray(product.sizesInStock).flatMap((value) => {
    const size = stringValue(value);
    return size ? [size] : [];
  });

  return {
    productId: stringOrNumber(product.id),
    sku: stringValue(product.sku),
    name: stringValue(product.title) ?? "",
    colour: stringValue(product.colour),
    fit: stringValue(product.fit),
    url: handle ? BASE_URL + "/products/" + handle : null,
    imageUrl:
      stringValue(featuredMedia?.url) ?? stringValue(featuredMedia?.src),
    currentPrice: numberValue(product.price),
    originalPrice: numberValue(product.compareAtPrice),
    discountPercent: numberValue(product.discountPercentage),
    inStock: pythonTruthy(product.inStock),
    rating,
    sizes: extractSizes(product),
    sizesInStock,
  };
}

export async function scrapeGymsharkProductDetail(
  url: string,
  options?: BrightDataScrapeOptions,
): Promise<GymsharkProductDetail | null> {
  return parseGymsharkProductDetail(await scrapeHtml(url, options));
}
