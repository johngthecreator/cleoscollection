import { load } from "cheerio";
import {
  asRecord,
  numberValue,
  stringValue,
  type BrightDataScrapeOptions,
  scrapeHtml,
} from "./shared";

export interface PatagoniaColorwayOption {
  colorCode: string | null;
  colorName: string | null;
  name: string | null;
  price: number | null;
  url: string | null;
  imageUrl: string | null;
  inStock: boolean;
}

export interface PatagoniaProductDetail {
  productId: string | null;
  name: string;
  url: string | null;
  imageUrl: string | null;
  colorCode: string | null;
  currentPrice: number | null;
  brand: string | null;
  rating: number | null;
  reviewCount: number | null;
  inStock: boolean;
  colorways: PatagoniaColorwayOption[];
  sizes: never[];
}

function loadProductSchema(html: string): Record<string, unknown>[] {
  const raw = load(html)('script#product-schema').first().html();
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return (Array.isArray(parsed) ? parsed : [parsed]).flatMap((value) => {
      const record = asRecord(value);
      return record ? [record] : [];
    });
  } catch {
    return [];
  }
}

export function parsePatagoniaProductDetail(
  html: string,
): PatagoniaProductDetail | null {
  const $ = load(html);
  const schemaItems = loadProductSchema(html);
  const group = schemaItems.find((item) => item["@type"] === "ProductGroup");
  const variants = schemaItems.filter((item) => item["@type"] === "Product");
  if (!group || variants.length === 0) return null;

  const productId =
    stringValue($("[data-pid]").first().attr("data-pid")) ??
    stringValue(group.productGroupID);
  const aggregateRating = asRecord(group.aggregateRating);
  const colorways = variants.map((variant): PatagoniaColorwayOption => {
    const offer = asRecord(variant.offers);
    const sku = stringValue(variant.sku);
    return {
      colorCode: sku?.split("-").at(-1) || null,
      colorName: stringValue(variant.color),
      name: stringValue(variant.name),
      price: numberValue(offer?.price),
      url: stringValue(offer?.url),
      imageUrl: stringValue(variant.image),
      inStock: String(offer?.availability ?? "").includes("InStock"),
    };
  });

  const primary = variants[0];
  const primaryOffer = asRecord(primary.offers);
  const brand = asRecord(group.brand);

  return {
    productId,
    name: stringValue(primary.name) ?? stringValue(group.name) ?? "",
    url: stringValue(primaryOffer?.url) ?? stringValue(group.url),
    imageUrl: stringValue(primary.image) ?? stringValue(group.image),
    colorCode: colorways[0]?.colorCode ?? null,
    currentPrice: numberValue(primaryOffer?.price),
    brand: stringValue(brand?.name),
    rating: numberValue(aggregateRating?.ratingValue),
    reviewCount: numberValue(aggregateRating?.reviewCount),
    inStock: String(primaryOffer?.availability ?? "").includes("InStock"),
    colorways,
    // The saved PDP HTML has no per-size availability; see the Python parser.
    sizes: [],
  };
}

export async function scrapePatagoniaProductDetail(
  url: string,
  options?: BrightDataScrapeOptions,
): Promise<PatagoniaProductDetail | null> {
  return parsePatagoniaProductDetail(await scrapeHtml(url, options));
}
