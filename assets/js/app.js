// D3 Animated Scatter Plot
// Section 1: Pre-Data Setup
// ===========================
// Before we code any data visualizations,
// we need to at least set up the width, height and margins of the graph.
// Note: I also added room for label text as well as text padding,
// though not all graphs will need those specifications.
// Grab the width of the containing box
var box_width = parseInt(d3.select("#scatter_plot").style("width"));
// Designate the height of the graph
var box_height = box_width - box_width / 3.9;
// Margin spacing for graph
var graph_margin = 20;
// space for placing words
var graph_label_area = 110;
// padding for the text at the bottom and left axes
var text_bottom_padding = 40;
var text_left_padding = 40;
// Create the actual canvas for the graph
var svg = d3.select("#scatter_plot").append("svg")
  .attr("width", box_width).attr("height", box_height).attr("class", "chart");
// Set the radius for each dot that will appear in the graph.
// Note: Making this a function allows us to easily call
// it in the mobility section of our code.
var dot_radius;
function getDotRadius() {
  if (box_width <= 530) {  dot_radius = 5; }
  else {  dot_radius = 10;  }
  }
getDotRadius();
// The Labels for our Axes
// A) Bottom Axis
// ==============
// We create a group element to nest our bottom axes labels.
svg.append("g").attr("class", "xText");
// x_axis_group_text will allows us to select the group without excess code.
var x_axis_group_text = d3.select(".xText");
// We give x_axis_group_text a transform property that places it at the bottom of the chart.
// By nesting this attribute in a function, we can easily change the location of the label group
// whenever the width of the window changes.
function xAxisRefreshText() {
  x_axis_group_text.attr( "transform", "translate(" +
      ((box_width - graph_label_area) / 2 + graph_label_area) +
      ", " +
      (box_height - graph_margin - text_bottom_padding) +
      ")"
  );
}
xAxisRefreshText();
// Now we use x_axis_group_text to append three text SVG files, with y coordinates specified to space out the values.
// 1. Poverty
x_axis_group_text.append("text").attr("y", -26).attr("data-name", "poverty")
.attr("data-axis", "x").attr("class", "aText active x").text("In Poverty (%)");
// 2. Age
x_axis_group_text.append("text").attr("y", 0).attr("data-name", "age")
.attr("data-axis", "x").attr("class", "aText inactive x").text("Age (Median)");
// 3. Income
x_axis_group_text.append("text").attr("y", 26).attr("data-name", "income")
.attr("data-axis", "x").attr("class", "aText inactive x").text("Household Income (Median)");
// B) Left Axis
// ============
// Specifying the variables like this allows us to make our transform attributes more readable.
var leftTextX = graph_margin + text_left_padding;
var leftTextY = (box_height + graph_label_area) / 2 - graph_label_area;
// We add a second label group, this time for the axis left of the chart.
svg.append("g").attr("class", "yText");
// yText will allows us to select the group without excess code.
var y_axis_group_text = d3.select(".yText");
// Like before, we nest the group's transform attr in a function
// to make changing it on window change an easy operation.
function yTextRefresh() {
  y_axis_group_text.attr( "transform", "translate(" + leftTextX + ", " + leftTextY + ")rotate(-90)"  );
}
yTextRefresh();
// Now we append the text.
// 1. Obesity
y_axis_group_text.append("text").attr("y", -26).attr("data-name", "obesity")
  .attr("data-axis", "y").attr("class", "aText active y").text("Obese (%)");
// 2. Smokes
y_axis_group_text.append("text").attr("x", 0).attr("data-name", "smokes")
  .attr("data-axis", "y").attr("class", "aText inactive y").text("Smokes (%)");
// 3. Lacks Healthcare
y_axis_group_text.append("text").attr("y", 26).attr("data-name", "healthcare")
  .attr("data-axis", "y").attr("class", "aText inactive y").text("Lacks Healthcare (%)");
// 2. Import our .csv file.
// ========================
// This data file includes state-by-state demographic data from the US Census
// and measurements from health risks obtained
// by the Behavioral Risk Factor Surveillance System.
// Import our CSV data with d3's .csv import method.
d3.csv("assets/data/data.csv").then(function(data) {
  // Visualize the data
  visualizeData(data);
});

// 3. Create our visualization function
// ====================================
// We called a "visualizeData" function on the data obtained with d3's .csv method.
// This function handles the visual manipulation of all elements dependent on the data.
function visualizeData(theData) {
  // PART 1: Essential Local Variables and Functions
  // =================================
  // current_x_axis_data and current_y_axis_data will determine what data gets represented in each axis.
  // We designate our defaults here, which carry the same names
  // as the headings in their matching .csv data file.
  var current_x_axis_data = "poverty";
  var current_y_axis_data = "obesity";
  // We also save empty variables for our the min and max values of x and y.
  // this will allow us to alter the values in functions and remove repetitious code.
  var xAxisMin;
  var xAxisMax;
  var yAxisMin;
  var yAxisMax;
  // This function allows us to set up tooltip rules (see d3-tip.js).
  var set_toolTip = d3.tip().attr("class", "d3-tip").offset([40, -60]).html(function(d) {
      // x key
      var x_key;
      // Grab the state name.
      var stateName = "<div>" + d.state + "</div>";
      // Snatch the y value's key and value.
      var y_key_val = "<div>" + current_y_axis_data + ": " + d[current_y_axis_data] + "%</div>";
      // If the x key is poverty
      if (current_x_axis_data === "poverty") {
        // Grab the x key and a version of the value formatted to show percentage
        x_key = "<div>" + current_x_axis_data + ": " + d[current_x_axis_data] + "%</div>";
      }
      else {
        // Otherwise
        // Grab the x key and a version of the value formatted to include commas after every third digit.
        x_key = "<div>" +
          current_x_axis_data +
          ": " +
          parseFloat(d[current_x_axis_data]).toLocaleString("en") +
          "</div>";
      }
      // Display what we capture.
      return stateName + x_key + y_key_val;
    });
  // Call the toolTip function.
  svg.call(set_toolTip);

  // PART 2: D.R.Y!
  // ==============
  // These functions remove some repitition from later code.
  // This will be more obvious in parts 3 and 4.

  // a. change the min and max for x
  function xAxisMinMax() {
    // min will grab the smallest datum from the selected column.
    xAxisMin = d3.min(theData, function(d) {
      return parseFloat(d[current_x_axis_data]) * 0.90;
    });

    // .max will grab the largest datum from the selected column.
    xAxisMax = d3.max(theData, function(d) {
      return parseFloat(d[current_x_axis_data]) * 1.10;
    });
  }

  // b. change the min and max for y
  function yAxisMinMax() {
    // min will grab the smallest datum from the selected column.
    yAxisMin = d3.min(theData, function(d) {
      return parseFloat(d[current_y_axis_data]) * 0.90;
    });

    // .max will grab the largest datum from the selected column.
    yAxisMax = d3.max(theData, function(d) {
      return parseFloat(d[current_y_axis_data]) * 1.10;
    });
  }

  // c. change the classes (and appearance) of label text when clicked.
  function changeLabels(axis, clickedText) {
    // Switch the currently active to inactive.
    d3.selectAll(".aText").filter("." + axis)
      .filter(".active").classed("active", false).classed("inactive", true);
    // Switch the text just clicked to active.
    clickedText.classed("inactive", false).classed("active", true);
  }

  // Part 3: Instantiate the Scatter Plot
  // ====================================
  // This will add the first placement of our data and axes to the scatter plot.

  // First grab the min and max values of x and y.
  xAxisMinMax();
  yAxisMinMax();
  // With the min and max values now defined, we can create our scales.
  // Notice in the range method how we include the margin and word area.
  // This tells d3 to place our circles in an area starting after the margin and word area.
  var xAxesScale = d3.scaleLinear().domain([xAxisMin, xAxisMax])
    .range([graph_margin + graph_label_area, box_width - graph_margin]);
  var yAxesScale = d3.scaleLinear().domain([yAxisMin, yAxisMax])
    // Height is inverses due to how d3 calc's y-axis placement
    .range([box_height - graph_margin - graph_label_area, graph_margin]);

  // We pass the scales into the axis methods to create the axes.
  // Note: D3 4.0 made this a lot less cumbersome then before. Kudos to mbostock.
  var xAxis = d3.axisBottom(xAxesScale);
  var yAxis = d3.axisLeft(yAxesScale);
  // Determine x and y tick counts.
  // Note: Saved as a function for easy mobile updates.
  function getTickCount() {
    if (box_width <= 500) {
       xAxis.ticks(5); yAxis.ticks(5);
    }
    else {
      xAxis.ticks(10); yAxis.ticks(10);
    }
  }
  getTickCount();

  // We append the axes in group elements. By calling them, we include
  // all of the numbers, borders and ticks.
  // The transform attribute specifies where to place the axes.
  svg.append("g").call(xAxis).attr("class", "xAxis")
    .attr("transform", "translate(0," + (box_height - graph_margin - graph_label_area) + ")");
  svg.append("g").call(yAxis).attr("class", "yAxis")
    .attr("transform", "translate(" + (graph_margin + graph_label_area) + ", 0)");
  // Now let's make a grouping for our dots and their labels.
  var theDots = svg.selectAll("g theCircles").data(theData).enter();
  // We append the circles for each row of data (or each state, in this case).
  theDots.append("circle")
    // These attr's specify location, size and class.
    .attr("cx", function(d) {   return xAxesScale(d[current_x_axis_data]); })
    .attr("cy", function(d) {  return yAxesScale(d[current_y_axis_data]);   })
    .attr("r", dot_radius).attr("class", function(d) { return "stateCircle " + d.abbr;})
    // Hover rules
    .on("mouseover", function(d) {
      // Show the tooltip
      set_toolTip.show(d, this);
      // Highlight the state circle's border
      d3.select(this).style("stroke", "#323232");
    })
    .on("mouseout", function(d) {
      // Remove the tooltip
      set_toolTip.hide(d);
      // Remove highlight
      d3.select(this).style("stroke", "#e3e3e3");
    });

  // With the circles on our graph, we need matching labels.
  // Let's grab the state abbreviations from our data
  // and place them in the center of our dots.
  theDots.append("text")
    // We return the abbreviation to .text, which makes the text the abbreviation.
    .text(function(d) { return d.abbr; })
    // Now place the text using our scale.
    .attr("dx", function(d) { return xAxesScale(d[current_x_axis_data]); }) 
    .attr("dy", function(d) {
      // When the size of the text is the radius,
      // adding a third of the radius to the height
      // pushes it into the middle of the circle.
      return yAxesScale(d[current_y_axis_data]) + dot_radius / 2.5;
    })
    .attr("font-size", dot_radius).attr("class", "stateText")
    // Hover Rules
    .on("mouseover", function(d) {
      // Show the tooltip
      set_toolTip.show(d);
      // Highlight the state circle's border
      d3.select("." + d.abbr).style("stroke", "#323232");
    })
    .on("mouseout", function(d) {
      // Remove tooltip
      set_toolTip.hide(d);
      // Remove highlight
      d3.select("." + d.abbr).style("stroke", "#e3e3e3");
    });

  // Part 4: Make the Graph Dynamic
  // ==========================
  // This section will allow the user to click on any label
  // and display the data it references.

  // Select all axis text and add this d3 click event.
  d3.selectAll(".aText").on("click", function() {
    // Make sure we save a selection of the clicked text,
    // so we can reference it without typing out the invoker each time.
    var self = d3.select(this);
    // We only want to run this on inactive labels.
    // It's a waste of the processor to execute the function
    // if the data is already displayed on the graph.
    if (self.classed("inactive")) {
      // Grab the name and axis saved in label.
      var axis = self.attr("data-axis");
      var data_name = self.attr("data-name");
      // When x is the saved axis, execute this:
      if (axis === "x") {
        // Make current_x_axis_data the same as the data name.
        current_x_axis_data = data_name;
        // Change the min and max of the x-axis
        xAxisMinMax();
        // Update the domain of x.
        xAxesScale.domain([xAxisMin, xAxisMax]);
        // Now use a transition when we update the xAxis.
        svg.select(".xAxis").transition().duration(300).call(xAxis);
        // With the axis changed, let's update the location of the state circles.
        d3.selectAll("circle").each(function() {
          // Each state circle gets a transition for it's new attribute.
          // This will lend the circle a motion tween
          // from it's original spot to the new location.
          d3.select(this).transition()
            .attr("cx", function(d) { return xAxesScale(d[current_x_axis_data]);  })
            .duration(300); });
        // We need change the location of the state texts, too.
        d3.selectAll(".stateText").each(function() {
          // We give each state text the same motion tween as the matching circle.
          d3.select(this).transition()
            .attr("dx", function(d) { return xAxesScale(d[current_x_axis_data]); })
            .duration(300);  });
        // Finally, change the classes of the last active label and the clicked label.
        changeLabels(axis, self);
      }
      else {
        // When y is the saved axis, execute this:
        // Make current_y_axis_data the same as the data name.
        current_y_axis_data = data_name;
        // Change the min and max of the y-axis.
        yAxisMinMax();
        // Update the domain of y.
        yAxesScale.domain([yAxisMin, yAxisMax]);
        // Update Y Axis
        svg.select(".yAxis").transition().duration(300).call(yAxis);
        // With the axis changed, let's update the location of the state circles.
        d3.selectAll("circle").each(function() {
          // Each state circle gets a transition for it's new attribute.
          // This will lend the circle a motion tween
          // from it's original spot to the new location.
          d3.select(this).transition()
            .attr("cy", function(d) { return yAxesScale(d[current_y_axis_data]);  })
            .duration(300);
        });

        // We need change the location of the state texts, too.
        d3.selectAll(".stateText").each(function() {
          // We give each state text the same motion tween as the matching circle.
          d3.select(this).transition()
            .attr("dy", function(d) { return yAxesScale(d[current_y_axis_data]) + dot_radius / 3; })
            .duration(300);  });
        // Finally, change the classes of the last active label and the clicked label.
           changeLabels(axis, self);
      }
    }
  });
  // Part 5: Mobile Responsive
  // =========================
  // With d3, we can call a resizeWindow function whenever the window dimensions change.
  // This make's it possible to add true mobile-responsiveness to our charts.
  d3.select(window).on("resize", resizeWindow);
  // One caveat: we need to specify what specific parts of the chart need size and position changes.
  function resizeWindow() {
    // Redefine the width, height and leftTextY (the three variables dependent on the width of the window).
    box_width = parseInt(d3.select("#scatter_plot").style("width"));
    box_height = box_width - box_width / 3.9;
    leftTextY = (box_height + graph_label_area) / 2 - graph_label_area;
    // Apply the width and height to the svg canvas.
    svg.attr("width", box_width).attr("height", box_height);
    // Change the xAxesScale and yAxesScale ranges
    xAxesScale.range([graph_margin + graph_label_area, box_width - graph_margin]);
    yAxesScale.range([box_height - graph_margin - graph_label_area, graph_margin]);
    // With the scales changes, update the axes (and the height of the x-axis)
    svg.select(".xAxis").call(xAxis).attr("transform", "translate(0," + (box_height - graph_margin - graph_label_area) + ")");
    svg.select(".yAxis").call(yAxis);
    // Update the ticks on each axis.
    getTickCount();
    // Update the labels.
    xAxisRefreshText();
    yTextRefresh();
    // Update the radius of each dot.
    getDotRadius();
    // With the axis changed, let's update the location and radius of the state circles.
    d3.selectAll("circle").attr("cy", function(d) { return yAxesScale(d[current_y_axis_data]);  })
      .attr("cx", function(d) {  return xAxesScale(d[current_x_axis_data]);  })
      .attr("r", function() {  return dot_radius;  });
    // We need change the location and size of the state texts, too.
    d3.selectAll(".stateText").attr("dy", function(d) {
        return yAxesScale(d[current_y_axis_data]) + dot_radius / 3;})
      .attr("dx", function(d) {return xAxesScale(d[current_x_axis_data]);})
      .attr("r", dot_radius / 3);
  }
}
