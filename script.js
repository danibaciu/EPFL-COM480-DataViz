// Width and height of the map
const width = 960, height = 600;

// Append the SVG object to the body of the page
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", function (event) {
        svg.attr("transform", event.transform);
    }))
    .append("g");

// Map projection
const projection = d3.geoMercator()
    .scale(150)
    .center([0, 20])
    .translate([width / 2, height / 2]);

// Create a scale for the colors
const colorScale = d3.scaleQuantize()
    .domain([0, 1])
    .range(d3.schemeBlues[9]);

// Load external data
d3.json("data/world.geojson").then(function(data) {

    // Draw the map
    svg.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("fill", d => colorScale(d.properties.developmentIndex || 0))
        .attr("d", d3.geoPath().projection(projection))
        .style("stroke", "black")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "orange");
            showTooltip(event, d.properties.name + " - Index: " + (d.properties.developmentIndex || "N/A"));
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("fill", colorScale(d.properties.developmentIndex || 0));
            hideTooltip();
        })
        .on("click", function(event, d) {
            updateInfoPanel(d.properties);
        });

    // Add a legend
    const legend = svg.append("g")
        .attr("transform", "translate(50,40)");

    legend.selectAll("rect")
        .data(colorScale.range().map(color => {
            const d = colorScale.invertExtent(color);
            if (d[0] == null) d[0] = colorScale.domain()[0];
            if (d[1] == null) d[1] = colorScale.domain()[1];
            return d;
        }))
        .enter().append("rect")
        .attr("height", 8)
        .attr("x", (d, i) => i * 30)
        .attr("y", 0)
        .attr("width", 30)
        .attr("fill", d => colorScale(d[0]));

    // Add tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function showTooltip(event, text) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(text)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    function updateInfoPanel(properties) {
        // Implement this function to update information panel
        console.log("Country selected:", properties.name);
    }
});

