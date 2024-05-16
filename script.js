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
]).then(function ([geoData, energyData, cityData]) {
    // Process the energy data
    const processedData = energyData.map(d => ({
        country: d.country,
        year: +d.year,
        population: +d.population,
        gdp: +d.gdp,
        biofuel_share_elec: +d.biofuel_share_elec,
        biofuel_share_energy: +d.biofuel_share_energy,
        coal_share_elec: +d.coal_share_elec,
        coal_share_energy: +d.coal_share_energy,
        electricity_share_energy: +d.electricity_share_energy,
        fossil_share_elec: +d.fossil_share_elec,
        fossil_share_energy: +d.fossil_share_energy,
        gas_share_elec: +d.gas_share_elec,
        gas_share_energy: +d.gas_share_energy,
        hydro_share_elec: +d.hydro_share_elec,
        hydro_share_energy: +d.hydro_share_energy,
        low_carbon_share_elec: +d.low_carbon_share_elec,
        low_carbon_share_energy: +d.low_carbon_share_energy,
        nuclear_share_elec: +d.nuclear_share_elec,
        nuclear_share_energy: +d.nuclear_share_energy,
        oil_share_elec: +d.oil_share_elec,
        oil_share_energy: +d.oil_share_energy,
        other_renewables_share_elec: +d.other_renewables_share_elec,
        other_renewables_share_elec_exc_biofuel: +d.other_renewables_share_elec_exc_biofuel,
        other_renewables_share_energy: +d.other_renewables_share_energy,
        renewables_share_elec: +d.renewables_share_elec,
        renewables_share_energy: +d.renewables_share_energy,
        solar_share_elec: +d.solar_share_elec,
        solar_share_energy: +d.solar_share_energy,
        wind_share_elec: +d.wind_share_elec,
        wind_share_energy: +d.wind_share_energy
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
            .on("mouseover", function (event, d) {
                d3.select(this).style("stroke-width", 2).style("stroke", "orange");
                showTooltip(event, `${d.properties.name} - ${metric}: ${d.properties[metric] || "N/A"}`);
            })
            .on("mouseout", function (event, d) {
                d3.select(this).style("stroke-width", 1).style("stroke", "black");
                hideTooltip();
            })
            .on("click", function (event, d) {
                showCountryModal(d.properties, cityData);
            });
    }

    // Call updateMap initially to load the default view
    updateMap(currentYear, currentMetric);

    // Setup UI controls for year and metric
    d3.select("#year-slider").on("input", function () {
        currentYear = +this.value;
        d3.select("#year-display").text(`Year: ${currentYear}`);
        updateMap(currentYear, currentMetric);
    });

    d3.select("#metric-selector").on("change", function (event) {
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

    // Container for the top two-thirds section
    const topContainer = modal.append("div")
        .attr("class", "top-container");

    // Left section for selections
    const selectionContainer = topContainer.append("div")
        .attr("class", "selection-container");

    // Country name at the top of the selection container
    selectionContainer.append("h1").text(properties.name);

    // Year range selector
    const yearRangeContainer = selectionContainer.append("div")
        .attr("id", "year-range-container")
        .style("margin-bottom", "10px");

    yearRangeContainer.append("label")
        .attr("for", "start-year")
        .text("Start Year:");

    const startYearInput = yearRangeContainer.append("input")
        .attr("type", "number")
        .attr("id", "start-year")
        .attr("min", "2000")
        .attr("max", "2020")
        .attr("value", "2000")
        .style("margin-right", "10px");

    yearRangeContainer.append("label")
        .attr("for", "end-year")
        .text("End Year:");

    const endYearInput = yearRangeContainer.append("input")
        .attr("type", "number")
        .attr("id", "end-year")
        .attr("min", "2000")
        .attr("max", "2020")
        .attr("value", "2020");

    // Features title
    selectionContainer.append("h3").text("Features");

    // Feature selector
    const featureSelector = selectionContainer.append("div")
        .attr("id", "feature-selector");

    const features = ['population', 'gdp', 'biofuel_share_elec', 'biofuel_share_energy', 'coal_share_elec', 'coal_share_energy',
        'electricity_share_energy', 'fossil_share_elec', 'fossil_share_energy', 'gas_share_elec', 'gas_share_energy',
        'hydro_share_elec', 'hydro_share_energy', 'low_carbon_share_elec', 'low_carbon_share_energy', 'nuclear_share_elec',
        'nuclear_share_energy', 'oil_share_elec', 'oil_share_energy', 'other_renewables_share_elec', 'other_renewables_share_elec_exc_biofuel',
        'other_renewables_share_energy', 'renewables_share_elec', 'renewables_share_energy', 'solar_share_elec', 'solar_share_energy',
        'wind_share_elec', 'wind_share_energy'];

    features.forEach(feature => {
        featureSelector.append("div")
            .attr("class", "feature-option")
            .style("padding", "5px")
            .style("cursor", "pointer")
            .style("user-select", "none")
            .text(feature)
            .on("click", function () {
                d3.select(this).classed("selected", !d3.select(this).classed("selected"));
            });
    });

    // Formula input section
    const formulaContainer = selectionContainer.append("div")
        .attr("id", "formula-container")
        .style("margin-top", "10px");

    formulaContainer.append("label")
        .attr("for", "formula-input")
        .text("Enter Formula:");

    const formulaInput = formulaContainer.append("input")
        .attr("type", "text")
        .attr("id", "formula-input")
        .attr("placeholder", "e.g., (d.gdp + d.population) / 2");

    const addFormulaButton = formulaContainer.append("button")
        .attr("class", "add-formula-button")
        .text("+")
        .on("click", function () {
            const formula = document.getElementById("formula-input").value;
            addFormula(formula);
        });

    // Formula list section
    const formulaListContainer = selectionContainer.append("div")
        .attr("id", "formula-list-container")
        .style("margin-top", "10px");

    formulaListContainer.append("h3").text("Formulas:");

    const formulaList = formulaListContainer.append("div")
        .attr("id", "formula-list")
        .style("height", "100px")
        .style("overflow-y", "scroll")
        .style("border", "1px solid #ddd")
        .style("padding", "5px");

    // Right section for the map
    const mapContainer = topContainer.append("div")
        .attr("class", "map-container");

    // Load and display the detailed country map
    drawCountryMap(properties, mapContainer, cityData);

    // Bottom section for the plot
    const plotContainer = modal.append("div")
        .attr("class", "plot-container");

    // Container for plot area
    plotContainer.append("div").attr("id", "plot-area")
        .style("width", "100%")
        .style("height", "calc(100% - 50px)");

    // Container for the buttons
    const buttonContainer = plotContainer.append("div")
        .attr("class", "button-container");

    // Plot Selected Features button
    const plotButton = buttonContainer.append("button")
        .attr("class", "plot-button")
        .text("Plot Selected Features")
        .on("click", function () {
            const selectedFeatures = d3.selectAll(".feature-option.selected").nodes().map(node => node.innerText);
            const startYear = +document.getElementById("start-year").value;
            const endYear = +document.getElementById("end-year").value;
            drawPlots(properties.name, selectedFeatures, startYear, endYear);
        });

    // Plot All Features button
    const plotAllButton = buttonContainer.append("button")
        .attr("class", "plot-button")
        .text("Plot All Features")
        .on("click", function () {
            const startYear = +document.getElementById("start-year").value;
            const endYear = +document.getElementById("end-year").value;
            drawPlots(properties.name, features, startYear, endYear);
        });

    // Plot Formula button
    const plotFormulaButton = buttonContainer.append("button")
        .attr("class", "plot-button")
        .text("Plot Formulas")
        .on("click", function () {
            const selectedFormulas = d3.selectAll(".formula-checkbox:checked").nodes().map(node => node.value);
            const startYear = +document.getElementById("start-year").value;
            const endYear = +document.getElementById("end-year").value;
            plotFormulas(properties.name, selectedFormulas, startYear, endYear);
        });

    modal.on("click", function (event) {
        event.stopPropagation();
    });

    modalBackground.on("click", function () {
        modalBackground.remove();
        svgContainer.style("filter", "");
    });

    // Apply the blur effect to the SVG container
    svgContainer.style("filter", "blur(8px)");
}

function drawCountryMap(properties, container, cityData) {
    const countryName = properties.name.toLowerCase();
    const mapSvg = container.append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const countryCities = cityData.filter(d => d.country === properties.name);

    let fn = "map/countries/" + countryName.replaceAll(" ", "_") + ".json";
    Promise.all([
        d3.json(fn)
    ]).then(function ([countryData]) {
        var projection = d3.geoMercator();
        var path = d3.geoPath().projection(projection);
        projection.fitSize([container.node().clientWidth, container.node().clientHeight], countryData);
        mapSvg
            .append("path")
            .attr("d", path(countryData))
            .attr("fill", "grey");

        var Tooltip = container
            .append("div")
            .style("display", "none")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");

        var onMouseMove = function (event) {
            Tooltip.style("display", "block");
            d3.select(this).attr("r", 7);
            if (typeof event !== 'undefined') {
                Tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            }
        };

        var onMouseLeave = function () {
            Tooltip.style("display", "none");
            d3.select(this).attr("r", 5);
        };

        var onMouseOver = function (d) {
            Tooltip.html("City: " + d3.select(this).attr("data-city-name"));
        };

        // Append a circle for each city
        countryCities.forEach(city => {
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

function drawPlots(countryName, selectedFeatures, startYear, endYear) {
    d3.csv("data/filtered_df.csv").then(data => {
        const countryData = data.filter(d => d.country === countryName && d.year >= startYear && d.year <= endYear);

        const traces = selectedFeatures.map(feature => {
            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => +d[feature]),
                mode: 'lines+markers',
                name: feature
            };
        });

        const layout = {
            title: selectedFeatures.length === 1 ? `${countryName} - ${selectedFeatures[0]}` : `${countryName}`,
            xaxis: { title: 'Year' },
            yaxis: { title: 'Value' },
            margin: { t: 40 }
        };

        Plotly.newPlot('plot-area', traces, layout);
    });
}

function plotFormulas(countryName, formulas, startYear, endYear) {
    d3.csv("data/filtered_df.csv").then(data => {
        const countryData = data.filter(d => d.country === countryName && d.year >= startYear && d.year <= endYear);

        try {
            const traces = formulas.map((formula, index) => {
                const calculateFormula = new Function('d', `with (d) { return ${formula}; }`);
                const result = countryData.map(calculateFormula);
                return {
                    x: countryData.map(d => d.year),
                    y: result,
                    mode: 'lines+markers',
                    name: `Formula ${index + 1}`
                };
            });

            const layout = {
                title: `${countryName} - Formulas Result`,
                xaxis: { title: 'Year' },
                yaxis: { title: 'Value' },
                margin: { t: 40 }
            };

            Plotly.newPlot('plot-area', traces, layout);
        } catch (error) {
            alert('Error in formula: ' + error.message);
        }
    });
}

function addFormula(formula) {
    const formulaList = d3.select("#formula-list");

    const formulaItem = formulaList.append("div")
        .attr("class", "formula-item")
        .style("display", "flex")
        .style("align-items", "center");

    formulaItem.append("input")
        .attr("type", "checkbox")
        .attr("class", "formula-checkbox")
        .attr("value", formula);

    formulaItem.append("span")
        .style("margin-left", "10px")
        .text(formula);

    // Clear the formula input
    document.getElementById("formula-input").value = '';
}
