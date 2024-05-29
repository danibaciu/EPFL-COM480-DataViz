import geojson
from os import listdir
from os.path import isfile, join

import geopandas as gpd
from shapely.geometry import shape

def sizeCalculator(geojson_dict):
    # Calculates some form of size. Is not accurate but can compare between different landmasses.
    polygon = shape(geojson_dict)
    gdf = gpd.GeoDataFrame({'geometry': [polygon]})
    gdf.set_crs(epsg=4326, inplace=True)
    gdf = gdf.to_crs(epsg=3395)  # World Mercator projection
    area = gdf.geometry.area[0]
    return area

prompt = "Country: "
country = "test"
while country != "":
    country = input(prompt)
    countryfile = country.lower() + ".json"
    print("Working on " + countryfile)
    if not countryfile.endswith("json"):
        continue

    with open(countryfile) as f:
        gj = geojson.load(f)

    print(country + " has " + str(len(gj["features"])) + " features")
    top_n = int(input("If you wish to include the largest N features, input N here (leave blank for manual selection): "))
    newjson = {
        "type": "FeatureCollection",
        "features": []
    }
    if top_n != "":
        sorted_list = sorted(gj["features"], key=lambda x: sizeCalculator(x['geometry']), reverse=True)
        # sorted_list = sorted(gj["features"], key=lambda x: sum([sizeCalculator(x) for i in range(len(x['geometry']))]), reverse=True)
        newjson["features"] += sorted_list[:top_n]
    else:
        for i in range(len(gj['features'])):
            print(gj['features'][i])
            inc = input("Include? (Y/N)")
            if inc.lower() == "y":
                newjson["features"].append(gj['features'][i])

    newfilename = country.lower() + "_new.json"
    with open(newfilename, "w") as f:
        geojson.dump(newjson, f, separators=(',', ':'))
    print("Dumped new geojson to " + newfilename)

