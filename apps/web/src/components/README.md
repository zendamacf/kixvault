# Components

React components used across the web app. Route files in `src/routes/` compose these; they should not import from routes.

## [collection](./collection)

Collection home page UI: summary stats, loading placeholders, and empty states.

## [layout](./layout)

App-wide chrome and navigation helpers.

## [sneakers](./sneakers)

Sneaker display, catalog search, and add/edit forms.

## [theme](./theme)

Theme switching for light, dark, and system preferences.

## [ui](./ui)

[shadcn/ui](https://ui.shadcn.com/) primitives. Prefer extending these over adding one-off styled elements in feature components.
