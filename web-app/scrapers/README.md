# Product detail scrapers

These modules port the four product detail parsers from betbetbet. Each
retailer exports a parser for saved HTML and a scraper that fetches a page
through Bright Data before parsing it.

Example:

    import {
      parseNikeProductDetail,
      scrapeNikeProductDetail,
    } from "@/scrapers";

    const parsed = parseNikeProductDetail(savedHtml);
    const live = await scrapeNikeProductDetail(
      "https://www.nike.com/t/example",
      { country: "us" },
    );

Set BRIGHTDATA_API_KEY or BRIGHTDATA_API_TOKEN for authentication, or use
the Bright Data CLI login. The unlocker zone defaults to deal_unlocker,
matching betbetbet; override it with BRIGHTDATA_WEB_UNLOCKER_ZONE or
BRIGHTDATA_UNLOCKER_ZONE. A per-call zone option overrides the environment.

Gymshark and Nike read their embedded __NEXT_DATA__ JSON. Patagonia reads
its product-schema JSON-LD and, like the Python parser, returns an empty
sizes array because static HTML does not expose per-size availability.
Urban Outfitters reads its rendered DOM controls for size, fit, and color
availability.
