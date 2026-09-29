# Product scraper cron

Apply the web app's Drizzle migration that adds `sale.hosted_image_url` before
starting this job. The Python model reflects the live PostgreSQL table and
does not run migrations itself.

Copy `.env.example` to `.env` and fill in the database, Bright Data, and MinIO
values. Railway should set these as service variables. The MinIO bucket must
already exist. `MINIO_PUBLIC_BASE_URL` is the URL of the **bucket root**, not
the MinIO console. For example, if an object named `sales/123` is reachable at
`https://images.example.com/sale-images/sales/123`, set the base URL to
`https://images.example.com/sale-images`.

Set `IMAGE_ALLOWED_HOSTS` to the exact hostnames found in the scraped image
URLs. Redirect targets must also be included. The script only downloads HTTPS
images from those hosts and accepts JPEG, PNG, WebP, AVIF, and GIF up to 8 MiB.
Before upload, it applies image orientation, limits the longest side to 1,200
pixels, and converts the first frame to WebP at quality 80. Transparent areas
get a white background. Decoded images above 25 million pixels are rejected.
You can inspect existing rows with:

```sql
SELECT DISTINCT lower(split_part(split_part(image_url, '://', 2), '/', 1)) AS host
FROM sale
WHERE image_url IS NOT NULL
ORDER BY host;
```

Install and run locally from `cron/`:

```bash
uv sync
uv run cron.py
```

Each successful seller scrape stores the original image URL in `image_url` and
the MinIO URL in `hosted_image_url`. Object keys are `sales/<sale id>`. Once a
new seller batch commits, the job deletes objects belonging to inactive rows
and clears their hosted URLs. A failed download or upload keeps that seller's
previous batch active. Cleanup can be retried on the next weekly run.
