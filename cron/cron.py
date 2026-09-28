from dataclasses import asdict

from sqlalchemy import update
from sqlalchemy.orm import Session

from db import engine
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


def main():
    print("---------- Scraping Started ------------")
    try:
        for seller in SELLERS:
            response = brightdata_scraper(seller["url"])
            parsed_products = seller["parser"](response.text)

            with Session(engine) as session:
                session.execute(
                    update(Sale)
                    .where(Sale.source == seller["source"])
                    .where(Sale.department == seller["department"])
                    .values(is_active=False)
                )

                for product in parsed_products:
                    sale_data = asdict(product)
                    sale_data["department"] = seller["department"]
                    sale_data = {
                        key: value
                        for key, value in sale_data.items()
                        if key in SALE_COLUMN_NAMES
                    }
                    session.add(Sale(**sale_data))
                    print(product.name)

                session.commit()
    finally:
        # Railway cron deployments must exit and release DB connections.
        engine.dispose()
    print("---------- Scraping Done! -----------")


if __name__ == "__main__":
    main()
