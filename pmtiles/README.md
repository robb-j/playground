# pmtiles

## Scripts

```sh
# cd to/this/folder

brew install pmtiles

pmtiles show https://build.protomaps.com/20230918.pmtiles

#
# Format: min_lon,min_lat,max_lon,max_lat
#

# http://bboxfinder.com/#54.730692,-2.072468,55.248329,-1.112537
pmtiles extract https://build.protomaps.com/20230918.pmtiles ncl.pmtiles --bbox=-2.072468,54.730692,-1.112537,55.248329

# http://bboxfinder.com/#49.677682,-13.714371,61.288257,5.552837
pmtiles extract https://build.protomaps.com/20230918.pmtiles uk.pmtiles --bbox=-13.736773,49.692620,5.556850,61.294070

# Serve the app locally
npx http-server .
```

## Links

- https://protomaps.github.io/PMTiles
- https://til.simonwillison.net/gis/pmtiles
- https://maplibre.org/maplibre-gl-js/docs/
- https://docs.protomaps.com/pmtiles/maplibre
- http://localhost:8080/

## Thoughts

- Custom iconography
- Custom styles
