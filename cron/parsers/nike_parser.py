"""Parse product cards out of a saved Nike.com product-grid (PLP) HTML dump.

Usage:
    from nike_parser import parse_products

    with open("nike-shoes.html", encoding="utf-8") as f:
        products = parse_products(f.read())

    for p in products:
        print(p.name, p.current_price, p.url)
"""

from __future__ import annotations

import re

from bs4 import BeautifulSoup
from bs4.element import Tag

from .normalize import NormalizedProduct, require_field, utc_now

_PRICE_RE = re.compile(r"[\d,]+\.?\d*")


def _clean_text(tag: Tag | None) -> str | None:
    if tag is None:
        return None
    text = tag.get_text(" ", strip=True)
    return text or None


def _parse_price(tag: Tag | None) -> float | None:
    if tag is None:
        return None
    text = tag.get_text(" ", strip=True)
    match = _PRICE_RE.search(text)
    if not match:
        return None
    return float(match.group(0).replace(",", ""))


_SRCSET_ENTRY_RE = re.compile(r"(\S+)\s+(\d+)w")


def _build_image_url(img: Tag | None) -> str | None:
    """Construct the largest available product image URL from the card's srcSet.

    Note: entries can't be split on plain "," -- Nike's image URLs embed
    Cloudinary-style transform params (e.g. "c_scale,fl_relative,w_1.0")
    that contain commas themselves, so each "<url> <width>w" pair is pulled
    out with a regex instead.
    """
    if img is None:
        return None
    srcset = img.get("srcSet") or img.get("srcset")
    if srcset:
        candidates = _SRCSET_ENTRY_RE.findall(srcset)
        if candidates:
            return max(candidates, key=lambda c: int(c[1]))[0]
    return img.get("src")


def _extract_colors(card: Tag) -> list[str]:
    colors: list[str] = []
    for swatch in card.select("a.colorway"):
        circle = swatch.select_one(".color-loader__circle")
        style = circle.get("style") if circle else None
        hex_match = re.search(r"background-color:\s*(#[0-9a-fA-F]{3,6})", style or "")
        if hex_match:
            colors.append(hex_match.group(1))
    return colors


def parse_products(html: str) -> list[NormalizedProduct]:
    """Parse every product card out of a Nike.com product-grid page dump."""
    soup = BeautifulSoup(html, "lxml")
    products: list[NormalizedProduct] = []
    scraped_at = utc_now()

    for card in soup.select("div.product-card"):
        link = card.select_one("a.product-card__link-overlay")
        title = card.select_one(".product-card__title")
        image = card.select_one("img.product-card__hero-image")

        current_price_tag = card.select_one('[data-testid="product-price-reduced"]')
        original_price_tag = card.select_one('[data-testid="product-price"]')
        if current_price_tag is None:
            # no discount: the single price tag is both current and original
            current_price_tag = original_price_tag

        url = link.get("href") if link else None
        name = _clean_text(title) or _clean_text(link) or ""
        current_price = _parse_price(current_price_tag)
        original_price = _parse_price(original_price_tag)
        colors = _extract_colors(card)

        try:
            products.append(
                NormalizedProduct(
                    source="nike",
                    name=name,
                    url=require_field(url, "url", "nike", name),
                    scraped_at=scraped_at,
                    image_url=_build_image_url(image),
                    current_price=require_field(
                        current_price, "current_price", "nike", name
                    ),
                    # Nike's listing swatches carry no visible color name,
                    # only a hex value -- that's the best available label,
                    # not a limitation of this parser.
                    original_price=original_price,
                    colors=colors,
                )
            )
        except ValueError as e:
            print(f"skipping incomplete product: {e}")

    return products


if __name__ == "__main__":
    import json
    import sys
    from dataclasses import asdict

    path = sys.argv[1] if len(sys.argv) > 1 else "nike-shoes.html"
    with open(path, encoding="utf-8") as fh:
        html = fh.read()

    parsed = parse_products(html)
    print(f"Found {len(parsed)} products", file=sys.stderr)
    print(json.dumps([asdict(p) for p in parsed], indent=2, default=str))
