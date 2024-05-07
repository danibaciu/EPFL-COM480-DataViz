// Set the dimensions to fill the screen
const width = window.innerWidth, height = window.innerHeight;

// Append the SVG object to the body of the page
const svgContainer = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", (event) => {
        svg.attr("transform", event.transform);
    }));

const svg = svgContainer.append("g");

// Define ocean background
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#a2d5f2"); 

// Map projection
const projection = d3.geoMercator()
    .scale((width - 3) / (2 * Math.PI))
    .translate([width / 2, height / 2]);

// Create a scale for the colors
const colorScale = d3.scaleQuantize()
    .domain([0, 100000000])  
    .range(["#ffedea", "#ffcec5", "#ffad9f", "#ff8a75", "#ff5533", "#e2492d", "#be3d26", "#9a311f", "#782618"]);

// Load external data
Promise.all([
    d3.json("map/world.geojson"),
    d3.csv("data/filtered_df.csv"),
    d3.csv("data/cities.csv")
]).then(function([geoData, energyData, cityData]) {
    // Process the energy data
    const processedData = energyData.map(d => ({
        country: d.country,
        year: +d.year,
        population: +d.population,
        gdp: +d.gdp
    }));

    let currentYear = 2000;  
    let currentMetric = 'population';

    function updateMap(year, metric) {
        const yearData = processedData.filter(d => d.year === year);

        // Join the geo data with the energy data
        const data = geoData.features.map(geo => {
            const energy = yearData.find(p => p.country === geo.properties.name);
            return {
                ...geo,
                properties: { ...geo.properties, ...energy }
            };
        });

        svg.selectAll("path")
            .data(data)
            .join("path")
            .attr("fill", d => d.properties[metric] ? colorScale(d.properties[metric]) : "#ccc")
            .attr("d", d3.geoPath().projection(projection))
            .style("stroke", "black")
            .on("mouseover", function(event, d) {
                d3.select(this).style("stroke-width", 2).style("stroke", "orange");
                showTooltip(event, `${d.properties.name} - ${metric}: ${d.properties[metric] || "N/A"}`);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).style("stroke-width", 1).style("stroke", "black");
                hideTooltip();
            })
            .on("click", function(event, d) {
                showCountryModal(d.properties, cityData);
            });
    }

    // Call updateMap initially to load the default view
    updateMap(currentYear, currentMetric);

    // Setup UI controls for year and metric
    d3.select("#year-slider").on("input", function() {
        currentYear = +this.value;
        d3.select("#year-display").text(`Year: ${currentYear}`);
        updateMap(currentYear, currentMetric);
    });

    d3.select("#metric-selector").on("change", function(event) {
        currentMetric = this.value;
        updateMap(currentYear, currentMetric);
    });
});

// Tooltip functions
function showTooltip(event, text) {
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .html(text)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
}

function hideTooltip() {
    d3.select(".tooltip").remove();
}

function showCountryModal(properties, cityData) {
    d3.selectAll(".modal-background").remove();

    const modalBackground = d3.select("body").append("div")
        .attr("class", "modal-background");

    const modal = modalBackground.append("div")
        .attr("class", "modal");

    modal.append("h1").text(properties.name);

    modal.on("click", function(event) {
        event.stopPropagation();
    });

    modalBackground.on("click", function() {
        modalBackground.remove();
        svgContainer.style("filter", ""); 
    });

    // Apply the blur effect to the SVG container
    svgContainer.style("filter", "blur(8px)");

    // Load and display the detailed country map
    drawCountryMap(properties, modal, cityData);

}

function drawCountryMap(properties, modal, cityData) {
    const countryName = properties.name.toLowerCase();
    const mapContainer = modal.append("div").attr("class", "map-container");
    const w = 440,
        h = 300
    const mapSvg = mapContainer.append("svg")
        .attr("width", w)
        .attr("height", h);

    const countryCities = cityData.filter(d => d.country === properties.name);
    console.log(countryCities);

    let fn = "map/countries/" + countryName.replaceAll(" ", "_") + ".json";
    Promise.all([
        d3.json(fn)
    ]).then(function([countryData]) {
        var projection = d3.geoMercator();
        var path = d3.geoPath().projection(projection);
        projection.fitSize([w,h],countryData);
        mapSvg
            .append("path")
            .attr("d", path(countryData))
            .attr("fill", "grey");

        //
        var Tooltip = mapContainer
            .append("div")
            .style("display", "none")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");
        
        var onMouseMove = function(event) {
            Tooltip.style("display", "block");
            d3.select(this).attr("r", 7)
            if (typeof event !== 'undefined') {
                Tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            }   
        };
        
        var onMouseLeave = function() {
            Tooltip.style("display", "none");
            d3.select(this).attr("r", 5)
        };

        var onMouseOver = function(d) {
            Tooltip.html("City: " + d3.select(this).attr("data-city-name"));
        }

        // Append a circle for each city
        countryCities.forEach(city => {
            console.log(city.city_name)
            mapSvg.append("circle")
                .attr("cx", projection([city.longitude, city.latitude])[0])
                .attr("cy", projection([city.longitude, city.latitude])[1])
                .attr("r", 5)
                .style("fill", "black")
                .attr("data-city-name", city.city_name)
                .on("mouseover", onMouseOver)
                .on("mousemove", onMouseMove)
                .on("mouseleave", onMouseLeave);
            });
    });
}

function drawPlots(properties, modal) {
    const plotContainer = modal.append("div").attr("class", "plot-container");
    plotContainer.append("p").text("GDP Plot: " + properties.gdp);
    plotContainer.append("p").text("Population Plot: " + properties.population);
}
