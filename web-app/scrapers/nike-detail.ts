import {
  asArray,
  asRecord,
  numberValue,
  parseJsonScript,
  scrapeHtml,
  stringValue,
  type BrightDataScrapeOptions,
} from "./shared";

export interface NikeSizeOption {
  label: string | null;
  localizedLabel: string | null;
  status: string | null;
  available: boolean;
  merchSkuId: string | null;
}

export interface NikeColorwayOption {
  styleColor: string | null;
  colorDescription: string | null;
  price: number | null;
  url: string | null;
  imageUrl: string | null;
  inStock: boolean;
}

export interface NikeProductDetail {
  styleCode: string | null;
  styleColor: string | null;
  name: string;
  subtitle: string | null;
  colorDescription: string | null;
  url: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  sizes: NikeSizeOption[];
  colorways: NikeColorwayOption[];
}

function extractSizes(selectedProduct: Record<string, unknown>): NikeSizeOption[] {
  return asArray(selectedProduct.sizes).flatMap((value) => {
    const size = asRecord(value);
    if (!size) return [];

    const status = stringValue(size.status);
    return [
      {
        label: stringValue(size.label),
        localizedLabel: stringValue(size.localizedLabel),
        status,
        available: status === "ACTIVE",
        merchSkuId: stringValue(size.merchSkuId),
      },
    ];
  });
}

function extractColorways(pageProps: Record<string, unknown>): NikeColorwayOption[] {
  const productsByStyle = new Map<string, Record<string, unknown>>();
  for (const groupValue of asArray(pageProps.productGroups)) {
    const products = asRecord(asRecord(groupValue)?.products);
    for (const [styleColor, productValue] of Object.entries(products ?? {})) {
      const product = asRecord(productValue);
      if (product) productsByStyle.set(styleColor, product);
    }
  }

  return asArray(pageProps.colorwayImages).flatMap((value) => {
    const colorway = asRecord(value);
    if (!colorway) return [];

    const styleColor = stringValue(colorway.styleColor);
    const product = styleColor ? productsByStyle.get(styleColor) : undefined;
    const prices = asRecord(product?.prices);

    return [
      {
        styleColor,
        colorDescription: stringValue(colorway.colorDescription),
        price: numberValue(prices?.currentPrice),
        url: stringValue(colorway.pdpUrl),
        imageUrl: stringValue(colorway.squarishImg),
        inStock: !["BUYABLE_NOTIFY_ME", "UNBUYABLE"].includes(
          String(colorway.statusModifier ?? ""),
        ),
      },
    ];
  });
}

export function parseNikeProductDetail(html: string): NikeProductDetail | null {
  const root = asRecord(parseJsonScript(html, "script#__NEXT_DATA__"));
  const pageProps = asRecord(asRecord(root?.props)?.pageProps);
  const selectedProduct = asRecord(pageProps?.selectedProduct);
  if (!pageProps || !selectedProduct) return null;

  const prices = asRecord(selectedProduct.prices);
  const info = asRecord(selectedProduct.productInfo);
  const pdpUrl = asRecord(selectedProduct.pdpUrl);
  const colorways = extractColorways(pageProps);
  const selectedStyleColor = stringValue(selectedProduct.styleColor);
  const selectedColorway = colorways.find(
    (colorway) => colorway.styleColor === selectedStyleColor,
  );

  return {
    styleCode: stringValue(selectedProduct.styleCode),
    styleColor: selectedStyleColor,
    name: stringValue(info?.title) ?? "",
    subtitle: stringValue(info?.subtitle),
    colorDescription: stringValue(selectedProduct.colorDescription),
    url: stringValue(pdpUrl?.url) ?? stringValue(info?.url),
    imageUrl: selectedColorway?.imageUrl ?? null,
    currentPrice: numberValue(prices?.currentPrice),
    originalPrice: numberValue(prices?.initialPrice),
    discountPercent: numberValue(prices?.discountPercentage),
    sizes: extractSizes(selectedProduct),
    colorways,
  };
}

export async function scrapeNikeProductDetail(
  url: string,
  options?: BrightDataScrapeOptions,
): Promise<NikeProductDetail | null> {
  return parseNikeProductDetail(await scrapeHtml(url, options));
}
