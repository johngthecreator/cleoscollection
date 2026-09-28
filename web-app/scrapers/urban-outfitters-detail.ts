import { load } from "cheerio";
import {
  cleanText,
  parsePrice,
  type BrightDataScrapeOptions,
  scrapeHtml,
} from "./shared";

const PRICE_PATTERN = /[\d,]+\.\d{2}/;
const ID_COLOR_PATTERN = /\/([0-9]{5,})_([A-Za-z0-9]+)/;
const IMAGE_QUERY =
  "$medium$&fit=constrain&fmt=webp&hei=1046&qlt=80&wid=698";

export interface UrbanOutfittersSizeOption {
  label: string;
  value: string | null;
  available: boolean;
}

export interface UrbanOutfittersFitOption {
  label: string;
  value: string | null;
  available: boolean;
}

export interface UrbanOutfittersColorSwatch {
  label: string | null;
  colorCode: null;
  available: boolean;
}

export interface UrbanOutfittersProductDetail {
  productId: string | null;
  name: string;
  url: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  promoText: string | null;
  selectedColor: string | null;
  sizes: UrbanOutfittersSizeOption[];
  fits: UrbanOutfittersFitOption[];
  colors: UrbanOutfittersColorSwatch[];
}

function buildImageUrl(rawSrc: string | undefined): string | null {
  if (!rawSrc) return null;
  return rawSrc.split("?", 1)[0] + "?" + IMAGE_QUERY;
}

function extractOptions(
  $: ReturnType<typeof load>,
  fieldsetSelector: string,
  inputName: string,
): Array<{ label: string; value: string | null; available: boolean }> {
  const options: Array<{
    label: string;
    value: string | null;
    available: boolean;
  }> = [];

  $(fieldsetSelector)
    .first()
    .find("li")
    .each((_index, item) => {
      const radio = $(item).find("input[name='" + inputName + "']").first();
      const label = $(item).find("label").first();
      if (radio.length === 0 || label.length === 0) return;

      const labelCopy = label.clone();
      labelCopy.find(".u-pwa-screen-reader-only").remove();
      options.push({
        label: labelCopy.text().replace(/\s+/g, " ").trim(),
        value: radio.attr("value") ?? null,
        available: radio.attr("data-qa-is-available") === "true",
      });
    });

  return options;
}

export function parseUrbanOutfittersProductDetail(
  html: string,
): UrbanOutfittersProductDetail | null {
  const $ = load(html);
  const titleMeta = $('meta[property="og:title"]').first();
  if (titleMeta.length === 0) return null;

  const priceBlock = $(".c-pwa-product-price").first();
  const rawImage = $('meta[property="og:image"]').first().attr("content");
  const idAndColor = rawImage?.match(ID_COLOR_PATTERN);
  const colors: UrbanOutfittersColorSwatch[] = [];

  $('fieldset[data-qa-color]')
    .first()
    .find("label.c-pwa-custom-radio__label")
    .each((_index, label) => {
      const image = $(label).find("img[data-qa-swatch]").first();
      if (image.length === 0) return;
      colors.push({
        label: image.attr("alt") ?? null,
        colorCode: null,
        available: image.attr("isoutofstock") !== "true",
      });
    });

  return {
    productId: idAndColor?.[1] ?? null,
    name: titleMeta.attr("content") ?? "",
    url: $('meta[property="og:url"]').first().attr("content") ?? null,
    imageUrl: buildImageUrl(rawImage),
    currentPrice: parsePrice(
      priceBlock.find(".c-pwa-product-price__current").first(),
      PRICE_PATTERN,
    ),
    originalPrice: parsePrice(
      priceBlock.find(".c-pwa-product-price__original").first(),
      PRICE_PATTERN,
    ),
    promoText: cleanText(priceBlock.find(".c-pwa-product-promos").first()),
    selectedColor: cleanText($(".c-pwa-sku-selection__color-value").first()),
    sizes: extractOptions($, "fieldset[data-qa-size]", "selectedSize"),
    fits: extractOptions(
      $,
      "fieldset.c-pwa-sku-selection__fits-outer",
      "selectedFit",
    ),
    colors,
  };
}

export async function scrapeUrbanOutfittersProductDetail(
  url: string,
  options?: BrightDataScrapeOptions,
): Promise<UrbanOutfittersProductDetail | null> {
  return parseUrbanOutfittersProductDetail(await scrapeHtml(url, options));
}
