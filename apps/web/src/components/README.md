# Components

React components used across the web app. Route files in `src/routes/` compose these; they should not import from routes.

## [collection](./collection)

Collection home page UI: the collection summary sentence, loading placeholders, and empty states.

## [layout](./layout)

App-wide chrome and navigation helpers: the app shell, the split-screen auth layout, back links, and the sneaker artwork (`sneaker-art.ts`) shared by the brand mark and silhouette.

## [errors](./errors)

Full-page fallbacks for route errors and unknown URLs.

## [sneakers](./sneakers)

Sneaker display tiles, catalog search, and add/edit forms.

## [wishlist](./wishlist)

Grail tiles, priority pill, and the grail add/edit and move-to-collection forms.

## [theme](./theme)

Theme switching for light, dark, and system preferences.

## [ui](./ui)

[shadcn/ui](https://ui.shadcn.com/) primitives. Prefer extending these over adding one-off styled elements in feature components.
