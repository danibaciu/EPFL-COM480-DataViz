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
    d3.csv("data/filtered_df.csv")
]).then(function([geoData, energyData]) {
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
                showCountryModal(d.properties, geoData);
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

function showCountryModal(properties, geoData) {
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
    drawCountryMap(properties, modal, geoData);

}

function drawCountryMap(properties, modal, geoData) {
    const countryName = properties.name;
    // const countryName = properties.name.toLowerCase();
    const mapContainer = modal.append("div").attr("class", "map-container");
    const w = 440,
        h = 300
    const mapSvg = mapContainer.append("svg")
        .attr("width", w)
        .attr("height", h);

    // Filter data
    const filteredFeatures = geoData.features.filter(function(d){
        return d.properties.name === countryName;
    });

    // Find largest landmass of country (to exclude French Guyana, etc)
    // let coords = filteredFeatures[0].geometry.coordinates
    // let largestLandmass = [0, null];

    // coords.forEach(landmass => {
    //     let maxX = Number.NEGATIVE_INFINITY;
    //     let maxY = Number.NEGATIVE_INFINITY;
    //     let minX = Number.POSITIVE_INFINITY;
    //     let minY = Number.POSITIVE_INFINITY;
            
    //     let lm = landmass.length > 1 ? landmass : landmass[0];
        
    //     // Find the maximum and minimum X and Y coordinates
    //     for (const [x, y] of lm) {
    //         maxX = Math.max(maxX, x);
    //         minX = Math.min(minX, x);
    //         maxY = Math.max(maxY, y);
    //         minY = Math.min(minY, y);
    //     }

    //     let w = (maxX - minX)
    //     let h = (maxY - minY);
    //     if(w * h > largestLandmass[0]){
    //         let centerX = (maxX + minX) / 2;
    //         let centerY = (maxY + minY) / 2;
    //         largestLandmass = [w * h, [centerX, centerY], [w, h], lm];
    //     }
    // });


    // Project onto a unit projection first
    // As suggested by Mike Bostock: https://stackoverflow.com/a/14691788/2988879
    var projection = d3.geoMercator()
        .scale(1)
        .translate([0, 0]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    // Compute the bounds of the region, then derive scaling & translation factor
    var b = path.bounds(filteredFeatures[0]),
        s = .95 / Math.max((b[1][0] - b[0][0]) / w, (b[1][1] - b[0][1]) / h),
        t = [(w - s * (b[1][0] + b[0][0])) / 2, (h - s * (b[1][1] + b[0][1])) / 2];
    
    projection
        .scale(s)
        .translate(t);

    // Draw the map
    mapSvg.append("g")
        .selectAll("path")
        .data(filteredFeatures)
        .enter()
        .append("path")
        .attr("fill", "grey")
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        .style("stroke", "none");
}

function drawPlots(properties, modal) {
    const plotContainer = modal.append("div").attr("class", "plot-container");
    plotContainer.append("p").text("GDP Plot: " + properties.gdp);
    plotContainer.append("p").text("Population Plot: " + properties.population);
}
