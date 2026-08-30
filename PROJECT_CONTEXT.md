# SLINK Telegram App — Project Context

## Existing infrastructure

Shopify store:
https://slinklab.com

Telegram bot:
@slinklabbot

The Shopify store already exists and contains real products.

The Shopify storefront/theme is a separate project and must not be modified unless explicitly requested.

## Project goal

Build a lightweight Telegram Mini App that allows users to:

1. browse a selected subset of Shopify products;
2. open a product;
3. select variants;
4. add products to a Shopify cart;
5. modify the cart;
6. continue to Shopify Checkout.

## Architecture

Telegram Mini App
↓
Next.js
↓
Shopify Storefront API
↓
Shopify Cart
↓
Shopify Checkout

## Source of truth

Shopify is the only source of truth for:

- products;
- variants;
- prices;
- availability;
- cart;
- checkout.

## Current scope

Do not add functionality outside the scope explicitly described in the project guide.

## Development philosophy

Prefer the simplest implementation that satisfies the current milestone.

Do not add infrastructure in anticipation of hypothetical future needs.
