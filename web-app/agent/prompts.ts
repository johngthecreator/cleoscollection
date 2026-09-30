const DEDUPE_NOTE = `
  Write your answer once. Before finishing, check that you haven't repeated \
  the same sentence, list, or summary twice in this reply -- if you have, \
  remove the duplicate and send it only once.
  `

export const GET_PRODUCT_DETAIL_FORMAT = `
  Format the product data below for the user. Always include:
  - A link to the product.
  - Current price and original price.
  - Available sizes, and separately, sizes that are NOT available, if that's in the data.
  - Available colors.
  - A short note at the end for anything else notable you noticed in the data \
  (e.g. limited colorways, low stock, a size guide callout) -- only include this \
  if there's actually something worth mentioning, don't force it.`
   + DEDUPE_NOTE + `
  Product data:
  `

export const GRAB_SALES_FORMAT = `
  Format the product data below as a numbered list, one product per line. For \
  each product, show only its name and current price -- do not show the URL \
  to the user. The URLs are included in the data below so you can look up the \
  right one later, once the user picks a number.

  Tell the user they can reply with a product's number to get full details on \
  it (sizes, colors, price breakdown, etc.).

  Return this as plain numbered text, not a table.
  ` + DEDUPE_NOTE + `
  Product data:
  `
