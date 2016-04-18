var barChart = function(userConfig) {

    //default config for chart
    var config = {
        chart: {
            divID: "body",
            height: 300,
            width: 700
        },
        "seriesData": [],
        xAxis: {
            title: {
                text: ''
            }
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        colors: []

    };

    //merge dafault and userspecific config
    config = extend(config, userConfig);


    var seriesData = config.seriesData;

    if (seriesData.length == 0) {
        alert("Please provide data for stack group bar chart !!");
        return;
    }

    var finalDataForChart = [];
    var tempSeriesArr = [];
    var maxNoOfSamples = 0;
    seriesData.forEach(function(series) {
        maxNoOfSamples = Math.max(maxNoOfSamples, series.data.length);
    });

    //format data for use in chart
    for (var si = 0; si < seriesData.length; si++) {
        tempSeriesArr = [];
        tempSeriesArr = seriesData[si]['data'].map(function(m, i) {
            return {
                x: i,
                y: m,
                seriesName: seriesData[si]['name']
            };
        });
        if (tempSeriesArr.length < maxNoOfSamples) {
            
            for (var r = tempSeriesArr.length; r < maxNoOfSamples; r++) {
                tempSeriesArr.push({
                    x: r,
                    y: 0
                });
            }
        }

        finalDataForChart.push(tempSeriesArr);
    }

    var n = seriesData.length,
        m = maxNoOfSamples,
        stack = d3.layout.stack();



    //d3 stack layout call for calculation x and y for bar rectangles
    var layers = stack(finalDataForChart),
        yGroupMax = d3.max(layers, function(layer) {
            return d3.max(layer, function(d) {
                return d.y;
            });
        }),
        yStackMax = d3.max(layers, function(layer) {
            return d3.max(layer, function(d) {
                return d.y0 + d.y;
            });
        }),
        yStackMin = d3.min(layers, function(layer) {
            return d3.min(layer, function(d) {
                return d.y0 + d.y;
            });
        });;

    var margin = { top: 20, right: 10, bottom: 30, left: 45 }

    var widthForLegends = 0;
    margin.right = margin.right + widthForLegends;


    var width = config.chart.width - margin.left - margin.right,
        height = config.chart.height - margin.top - margin.bottom;



    //scale for x-axis
    var x = d3.scale.ordinal()
        .domain(d3.range(m))
        .rangeRoundBands([0, width], .3);
    
    //scale for y-axis
    yStackMin = yStackMin * 0.8;
    var y = d3.scale.log()
        .domain([yStackMin, yStackMax])
        .range([height, 0]);

    //color function to be used in bar rectangles
    var colorFn = '';
    if (config.colors == undefined || config.colors == '' || config.colors.length == 0) {
        colorFn = d3.scale
            .linear()
            .domain([0, n - 1])
            .range(["#ccd68b", "#374005"]);
    } else {
        colorFn = d3.scale
            .ordinal()
            .domain([0, n - 1])
            .range(config.colors);
    }

    //x axis function 
    var xAxis = d3.svg.axis()
        .scale(x)
        .tickSize(0)
        .tickPadding(6)
        .orient("bottom")
        .tickFormat(function(d,i){
            return config.rawData[i]['currency'];
        });

    //y axis function 
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickValues([yStackMax * .01, yStackMax * .03, yStackMax * .1, yStackMax * .35, yStackMax])
        .tickFormat(function(d, i) {
            return d.toFixed(2);
        });




    d3.select(config.chart.divID + " svg").remove();


    //draw svg for chart
    var svg = d3.select(config.chart.divID)
        .append("svg")
        .classed("barChart", true)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //layer group for each series in data
    var layer = svg.selectAll(".layer")
        .data(layers)
        .enter()
        .append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) {
            return colorFn(i);
        });

    // draw bars rectangles for each layer
    var rect = layer.selectAll("rect")
        .data(function(d) {
            return d;
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return x(d.x);
        })
        .attr("y", height)
        .attr("width", x.rangeBand())
        .attr("height", 0);

    //transition effect
    rect.transition()
        .delay(function(d, i) {
            return i * 10;
        })
        .attr("y", function(d) {
            return y(d.y0 + d.y);
        })
        .attr("height", function(d) {
            // return y(d.y0) - y(d.y0 + d.y);
            return y(yStackMin) - y(d.y0 + d.y);
        });

    //draw x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    //draw y-axis
    var yAxisGroupSelector = svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .call(yAxis);

    //write x-axis label
    svg.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")
        .style("text-anchor", "middle")
        .text(config.xAxis.title.text);



    //write y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(config.yAxis.title.text);




    //add legends based on series data
   /*
    var seriesNamesArr = config.seriesData.map(function(m) {
        return m["name"];
    });
    var legend = svg.selectAll('g.legendEntry')
        .data(seriesNamesArr)
        .enter()
        .append('g')
        .attr('class', 'legendEntry');

    legend
        .append('rect')
        .attr("x", width)
        .attr("y", function(d, i) {
            return i * 10 - margin.top + (i ? i * 5 : 0);
        })
        .attr("width", 20)
        .attr("height", 10)
        .style("fill", function(d, i) {
            return colorFn(i);
        });


    legend
        .append('text')
        .attr("x", width + 30)
        .attr("y", function(d, i) {
            return i * 10 - margin.top + (i ? i * 5 : 0);
        })
        .attr("dy", "0.8em")
        .attr("font-size", "12px")
        .text(function(d, i) {
            return d;
        });

*/

    //tooltip
    var chartToolTip = d3.dynamicTip()
        .attr('class', 'd3-tip-barChart-' + parseInt(Math.random() * 100000))
        // .direction('e')
        .offset([-10, 0])
        .html(function(d,i) {
            var tooltipHtml = '<div class="chartTooltipContentDiv">';
            tooltipHtml += "<table>";
            // tooltipHtml += "<tr><th>Series</th><th>Value</th></tr>";

            if (currentChartType == 'grouped') {
                tooltipHtml += "<tr><td>" + d['seriesName'] + "</td><td>" + d['y'] + "</td></tr>";
            } else {
                finalDataForChart.forEach(function(layerData) {
                    tooltipHtml += "<tr><td>" + config.rawData[i]['currency'] + "</td><td>" + sep1000(layerData[d['x']]['y'].toFixed(2)) + "</td></tr>";
                });
            }

            tooltipHtml += "</table>";
            tooltipHtml += "</div>";
            return tooltipHtml;
        });

    svg.call(chartToolTip);
    rect
        .on('mouseover', chartToolTip.show)
        .on('mouseout', chartToolTip.hide);

    //change chart type on change in radio selection
    d3.selectAll("input[name='barChartSelectType']").on("change", change);
    var currentChartType = '';

    //function to detech type of chart to render
    function change() {

        if (this.value === "grouped")
            transitionGrouped();
        else
            transitionStacked();
    }

    //transition chart from stack to grouped
    function transitionGrouped() {
        currentChartType = 'grouped';
        y.domain([0, yGroupMax]);

        rect.transition()
            .duration(500)
            .delay(function(d, i) {
                return i * 10;
            })
            .attr("x", function(d, i, j) {
                return x(d.x) + x.rangeBand() / n * j;
            })
            .attr("width", x.rangeBand() / n)
            .transition()
            .attr("y", function(d) {
                return y(d.y);
            })
            .attr("height", function(d) {
                return height - y(d.y);
            });

        //update y axis
        yAxisGroupSelector
            .transition()
            .duration(500)
            .call(yAxis);
    }

    //transition chart from grouped to stack
    function transitionStacked() {
        currentChartType = 'stacked';
        y.domain([0, yStackMax]);
        rect.transition()
            .duration(500)
            .delay(function(d, i) {
                return i * 10;
            })
            .attr("y", function(d) {
                return y(d.y0 + d.y);
            })
            .attr("height", function(d) {
                return y(d.y0) - y(d.y0 + d.y);
            })
            .transition()
            .attr("x", function(d) {
                return x(d.x);
            })
            .attr("width", x.rangeBand());

        //update y axis
        yAxisGroupSelector
            .transition()
            .duration(500)
            .call(yAxis);
    }

    //general function to extend js object
    function extend(destination, source) {
        for (var property in source) {
            if (source[property] && source[property].constructor &&
                source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                arguments.callee(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination;
    }

};

















//tooltip function
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module with d3 as a dependency.
        define(['d3'], factory)
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = function(d3) {
            d3.dynamicTip = factory(d3)
            return d3.dynamicTip
        }
    } else {
        // Browser global.
        root.d3.dynamicTip = factory(root.d3)
    }
}(this, function(d3) {

    // Public - contructs a new tooltip
    //
    // Returns a dynamicTip
    return function() {
        var direction = d3_tip_direction,
            offset = d3_tip_offset,
            html = d3_tip_html,
            node = initNode(),
            svg = null,
            point = null,
            target = null

        function dynamicTip(vis) {
            svg = getSVGNode(vis)
            point = svg.createSVGPoint()
            document.body.appendChild(node)
        }

        // Public - show the tooltip on the screen
        //
        // Returns a dynamicTip
        dynamicTip.show = function() {
            var args = Array.prototype.slice.call(arguments)
            if (args[args.length - 1] instanceof SVGElement)
                target = args.pop()

            var content = html.apply(this, args),
                poffset = offset.apply(this, args),
                dir = direction.apply(this, args),
                nodel = d3.select(node),
                i = directions.length,
                coords,
                scrollTop = document.documentElement.scrollTop || document.body.scrollTop,
                scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft

            nodel.html(content)
                .style({ opacity: 1, 'pointer-events': 'all' })

            while (i--)
                nodel.classed(directions[i], false)
            coords = direction_callbacks.get(dir).apply(this)
            nodel.classed(dir, true).style({
                top: (coords.top + poffset[0]) + scrollTop + 'px',
                left: (coords.left + poffset[1]) + scrollLeft + 'px'
            })

            return dynamicTip
        }

        // Public - hide the tooltip
        //
        // Returns a dynamicTip
        dynamicTip.hide = function() {
            var nodel = d3.select(node)
            nodel.style({ opacity: 0, 'pointer-events': 'none' })
            return dynamicTip
        }

        // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
        //
        // n - name of the attribute
        // v - value of the attribute
        //
        // Returns dynamicTip or attribute value
        dynamicTip.attr = function(n, v) {
            if (arguments.length < 2 && typeof n === 'string') {
                return d3.select(node).attr(n)
            } else {
                var args = Array.prototype.slice.call(arguments)
                d3.selection.prototype.attr.apply(d3.select(node), args)
            }

            return dynamicTip
        }

        // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
        //
        // n - name of the property
        // v - value of the property
        //
        // Returns dynamicTip or style property value
        dynamicTip.style = function(n, v) {
            if (arguments.length < 2 && typeof n === 'string') {
                return d3.select(node).style(n)
            } else {
                var args = Array.prototype.slice.call(arguments)
                d3.selection.prototype.style.apply(d3.select(node), args)
            }

            return dynamicTip
        }

        // Public: Set or get the direction of the tooltip
        //
        // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
        //     sw(southwest), ne(northeast) or se(southeast)
        //
        // Returns dynamicTip or direction
        dynamicTip.direction = function(v) {
            if (!arguments.length)
                return direction
            direction = v == null ? v : d3.functor(v)

            return dynamicTip
        }

        // Public: Sets or gets the offset of the dynamicTip
        //
        // v - Array of [x, y] offset
        //
        // Returns offset or
        dynamicTip.offset = function(v) {
            if (!arguments.length)
                return offset
            offset = v == null ? v : d3.functor(v)

            return dynamicTip
        }

        // Public: sets or gets the html value of the tooltip
        //
        // v - String value of the dynamicTip
        //
        // Returns html value or dynamicTip
        dynamicTip.html = function(v) {
            if (!arguments.length)
                return html
            html = v == null ? v : d3.functor(v)

            return dynamicTip
        }

        function d3_tip_direction() {
            return 'n'
        }

        function d3_tip_offset() {
            return [0, 0]
        }

        function d3_tip_html() {
            return ' '
        }

        var direction_callbacks = d3.map({
                n: direction_n,
                s: direction_s,
                e: direction_e,
                w: direction_w,
                nw: direction_nw,
                ne: direction_ne,
                sw: direction_sw,
                se: direction_se
            }),
            directions = direction_callbacks.keys()

        function direction_n() {
            var bbox = getScreenBBox()
            return {
                top: bbox.n.y - node.offsetHeight,
                left: bbox.n.x - node.offsetWidth / 2
            }
        }

        function direction_s() {
            var bbox = getScreenBBox()
            return {
                top: bbox.s.y,
                left: bbox.s.x - node.offsetWidth / 2
            }
        }

        function direction_e() {
            var bbox = getScreenBBox()
            return {
                top: bbox.e.y - node.offsetHeight / 2,
                left: bbox.e.x
            }
        }

        function direction_w() {
            var bbox = getScreenBBox()
            return {
                top: bbox.w.y - node.offsetHeight / 2,
                left: bbox.w.x - node.offsetWidth
            }
        }

        function direction_nw() {
            var bbox = getScreenBBox()
            return {
                top: bbox.nw.y - node.offsetHeight,
                left: bbox.nw.x - node.offsetWidth
            }
        }

        function direction_ne() {
            var bbox = getScreenBBox()
            return {
                top: bbox.ne.y - node.offsetHeight,
                left: bbox.ne.x
            }
        }

        function direction_sw() {
            var bbox = getScreenBBox()
            return {
                top: bbox.sw.y,
                left: bbox.sw.x - node.offsetWidth
            }
        }

        function direction_se() {
            var bbox = getScreenBBox()
            return {
                top: bbox.se.y,
                left: bbox.e.x
            }
        }

        function initNode() {
            var node = d3.select(document.createElement('div'))
            node.style({
                position: 'absolute',
                top: 0,
                opacity: 0,
                'pointer-events': 'none',
                'box-sizing': 'border-box'
            })

            return node.node()
        }

        function getSVGNode(el) {
            el = el.node()
            if (el.tagName.toLowerCase() === 'svg')
                return el

            return el.ownerSVGElement
        }

        // Private - gets the screen coordinates of a shape
        //
        // Given a shape on the screen, will return an SVGPoint for the directions
        // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
        // sw(southwest).
        //
        //
        // Returns an Object {n, s, e, w, nw, sw, ne, se}
        function getScreenBBox() {
            var targetel = target || d3.event.target;

            while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
                targetel = targetel.parentNode;
            }

            var bbox = {},
                matrix = targetel.getScreenCTM(),
                tbbox = targetel.getBBox(),
                width = tbbox.width,
                height = tbbox.height,
                x = tbbox.x,
                y = tbbox.y

            point.x = x
            point.y = y
            bbox.nw = point.matrixTransform(matrix)
            point.x += width
            bbox.ne = point.matrixTransform(matrix)
            point.y += height
            bbox.se = point.matrixTransform(matrix)
            point.x -= width
            bbox.sw = point.matrixTransform(matrix)
            point.y -= height / 2
            bbox.w = point.matrixTransform(matrix)
            point.x += width
            bbox.e = point.matrixTransform(matrix)
            point.x -= width / 2
            point.y -= height / 2
            bbox.n = point.matrixTransform(matrix)
            point.y += height
            bbox.s = point.matrixTransform(matrix)

            return bbox
        }

        return dynamicTip
    };

}));


function sep1000(somenum) {

    var dec = String(somenum).split(/[.,]/),
        sep = ',',
        decsep = '.';
    return dec[0]
        .split('')
        .reverse()
        .reduce(function(prev, now, i) {
            return i % 3 === 0 ? prev + sep + now : prev + now;
        })
        .split('')
        .reverse()
        .join('') +
        (dec[1] ? decsep + dec[1] : '');
}
