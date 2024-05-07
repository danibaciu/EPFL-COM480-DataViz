GeoJSON taken from the following source:
https://github.com/georgique/world-geojson/tree/develop/countries

However, these are in the wrong orientation. 
Standard GeoJSON is anti-clockwise. 
D3 takes clockwise GeoJSON (https://github.com/d3/d3/issues/2796)
Therefore, these files were converted using the reverser.py script.

