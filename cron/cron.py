from dataclasses import asdict
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urljoin

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from db import engine
from image_storage import ImageStorage
from models import Sale
from parsers import (
    parse_allsaints_products,
    parse_gymshark_products,
    parse_nike_products,
    parse_patagonia_products,
    parse_urbanoutfitters_products,
)
from utils import brightdata_scraper

SALE_COLUMN_NAMES = set(Sale.__table__.columns.keys())

SELLERS = [
    {
        "url": "https://www.urbanoutfitters.com/mens-clothing-sale",
        "parser": parse_urbanoutfitters_products,
        "department": "men",
        "source": "urban_outfitters",
    },
    {
        "url": "https://www.urbanoutfitters.com/womens-clothing-sale",
        "parser": parse_urbanoutfitters_products,
        "department": "women",
        "source": "urban_outfitters",
    },
    {
        "url": "https://www.nike.com/w/mens-sale-3yaepznik1",
        "parser": parse_nike_products,
        "department": "men",
        "source": "nike",
    },
    {
        "url": "https://www.nike.com/w/womens-sale-3yaepz5e1x6",
        "parser": parse_nike_products,
        "department": "women",
        "source": "nike",
    },
    {
        "url": "https://www.gymshark.com/collections/last-chance/mens",
        "parser": parse_gymshark_products,
        "department": "men",
        "source": "gymshark",
    },
    {
        "url": "https://www.gymshark.com/collections/last-chance/womens",
        "parser": parse_gymshark_products,
        "department": "women",
        "source": "gymshark",
    },
    {
        "url": "https://www.patagonia.com/shop/web-specials/mens",
        "parser": parse_patagonia_products,
        "department": "men",
        "source": "patagonia",
    },
    {
        "url": "https://www.patagonia.com/shop/web-specials/womens",
        "parser": parse_patagonia_products,
        "department": "women",
        "source": "patagonia",
    },
    {
        "url": "https://www.allsaints.com/us/men/sale?start=96&sz=24",
        "parser": parse_allsaints_products,
        "department": "men",
        "source": "allsaints",
    },
    {
        "url": "https://www.allsaints.com/us/women/sale?start=96&sz=24",
        "parser": parse_allsaints_products,
        "department": "women",
        "source": "allsaints",
    },
]


def cleanup_inactive_images(storage: ImageStorage, source: str, department: str) -> None:
    """Delete old objects only after this seller's replacement batch has committed."""
    with Session(engine) as session:
        stale_sales = session.scalars(
            select(Sale)
            .where(Sale.source == source)
            .where(Sale.department == department)
            .where(Sale.is_active.is_(False))
            .where(Sale.hosted_image_url.is_not(None))
        ).all()

        for sale in stale_sales:
            storage.delete_image(sale.id)
            sale.hosted_image_url = None

        # An interrupted cleanup is safe to retry; deleting a missing object is harmless.
        session.commit()
        print(f"Removed {len(stale_sales)} old images for {source}/{department}")


def refresh_seller(seller: dict, storage: ImageStorage) -> None:
    response = brightdata_scraper(seller["url"])
    response.raise_for_status()
    parsed_products = seller["parser"](response.text)
    if not parsed_products:
        raise RuntimeError(
            f"No products parsed for {seller['source']}/{seller['department']}; "
            "keeping the previous batch active"
        )

    # Download before opening a DB transaction; source CDNs can be slow or fail.
    with TemporaryDirectory(prefix="sale-images-") as temporary_dir:
        source_image_urls = [
            urljoin(seller["url"], product.image_url) if product.image_url else None
            for product in parsed_products
        ]
        prepared_images = []
        downloaded_by_url = {}
        for index, image_url in enumerate(source_image_urls):
            if image_url:
                if image_url not in downloaded_by_url:
                    body, _ = storage.download_image(image_url)
                    body = storage.optimize_image(body)
                    path = Path(temporary_dir) / str(index)
                    path.write_bytes(body)
                    downloaded_by_url[image_url] = (path, "image/webp")
                prepared_images.append(downloaded_by_url[image_url])
            else:
                prepared_images.append(None)

        uploaded_ids: list[int] = []
        with Session(engine) as session:
            try:
                session.execute(
                    update(Sale)
                    .where(Sale.source == seller["source"])
                    .where(Sale.department == seller["department"])
                    .values(is_active=False)
                )

                new_sales = []
                for product, image_url in zip(parsed_products, source_image_urls):
                    sale_data = asdict(product)
                    sale_data["department"] = seller["department"]
                    sale_data["image_url"] = image_url
                    sale_data = {
                        key: value
                        for key, value in sale_data.items()
                        if key in SALE_COLUMN_NAMES
                    }
                    sale = Sale(**sale_data)
                    session.add(sale)
                    new_sales.append(sale)

                # PostgreSQL assigns the identity IDs before any object is uploaded.
                session.flush()
                for sale, prepared in zip(new_sales, prepared_images):
                    if prepared is not None:
                        path, content_type = prepared
                        uploaded_ids.append(sale.id)
                        with path.open("rb") as image_file:
                            sale.hosted_image_url = storage.upload_image(
                                sale.id, image_file, content_type
                            )
                    print(sale.name)

                session.commit()
            except Exception:
                session.rollback()
                for sale_id in uploaded_ids:
                    try:
                        storage.delete_image(sale_id)
                    except Exception as cleanup_error:
                        print(f"Could not remove uncommitted image {sale_id}: {cleanup_error}")
                raise

    cleanup_inactive_images(storage, seller["source"], seller["department"])


def main():
    print("---------- Scraping Started ------------")
    failures = []
    storage = None
    try:
        storage = ImageStorage()
        for seller in SELLERS:
            try:
                refresh_seller(seller, storage)
            except Exception as error:
                label = f"{seller['source']}/{seller['department']}"
                failures.append(label)
                print(f"Failed {label}: {error}")
    finally:
        if storage is not None:
            storage.close()
        # Railway cron deployments must exit and release DB connections.
        engine.dispose()

    if failures:
        raise RuntimeError(f"Scraping failed for: {', '.join(failures)}")
    print("---------- Scraping Done! -----------")


if __name__ == "__main__":
    main()
