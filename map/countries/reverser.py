import geojson
from os import listdir
from os.path import isfile, join

onlyfiles = [f for f in listdir(".") if isfile(join(".", f))]
print(onlyfiles)

for countryfile in onlyfiles:
    print("Working on " + countryfile)
    if not countryfile.endswith("json"):
        continue

    with open(countryfile) as f:
        gj = geojson.load(f)

    for i in range(len(gj['features'])):
        for j in range(len(gj['features'][i]['geometry']['coordinates'])):
            gj['features'][i]['geometry']['coordinates'][j].reverse()

    with open(countryfile, "w") as f:
        geojson.dump(gj, f)
