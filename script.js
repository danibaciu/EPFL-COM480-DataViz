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

// Map projection
const projection = d3.geoMercator()
    .scale((width - 3) / (2 * Math.PI)) // Adjust the scale
    .translate([width / 2, height / 2]);

// Create a scale for the colors
const colorScale = d3.scaleQuantize()
    .domain([0, 100000000])  // Example domain for population, adjust based on actual data
    .range(d3.schemeBlues[9]);

// Load external data
Promise.all([
    d3.json("map/world.geojson"),
    d3.csv("data/filtered_df.csv")
]).then(function([geoData, energyData]) {
    // Process the energy data
    const processedData = energyData.map(d => ({
        country: d.country,
        year: +d.year,
        population: +d.population,
        gdp: +d.gdp
    }));

    let currentYear = 2000;  // Start from the year 2000
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
            });
    }

    // Slider for year selection
    d3.select("#year-slider").on("input", function() {
        currentYear = +this.value;
        d3.select("#year-display").text(`Year: ${currentYear}`);
        updateMap(currentYear, currentMetric);
    });

    // Dropdown for metric selection
    d3.select("#metric-selector").on("change", function(event) {
        currentMetric = this.value;
        updateMap(currentYear, currentMetric);
    });

    // Initialize the map
    updateMap(currentYear, currentMetric);
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
