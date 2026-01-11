(function () {
    'use strict';

    function get(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function getAll(selector, scope = document) {
        return scope.querySelectorAll(selector);
    }

    // uses dygraphs library <http://dygraphs.com/>
    function initGraphs() {
        const config = {
            locale: 'en-US',
            dateOptions: { day: 'numeric', month: 'long', year: 'numeric' },
            gridColor: 'hsl(210, 0%, 40%)',
            axes: {
                x: {
                    drawAxis: false,
                    drawGrid: false
                },
                y: {
                    drawAxis: true,
                    includeZero: true,
                    pixelsPerLabel: 40,
                    axisLineColor: 'transparent',
                    axisLabelWidth: 0,
                }
            }
        };
        const touchInteractionModel = {
            touchmove: (event) => {
                const coords = event.touches[0];
                const simulation = new MouseEvent('mousemove', {
                    clientX: coords.clientX,
                    clientY: coords.clientY
                });

                event.preventDefault();
                event.target.dispatchEvent(simulation);
            }
        };
        const legendFormatter = (data, units) => {
            if (!data.x) return '';

            const date = new Date(data.xHTML).toLocaleString(config.locale, config.dateOptions);
            const count = data.series[0].yHTML.average;

            return `<div class="graph-legend-date">${date}</div>` +
                   `<div class="graph-legend-count">${units}: ${count}</div>`;
        };
        const annotationMouseOverHandler = (annotation) => {
            annotation.div.classList.remove('tooltip-hidden');
            annotation.div.style.zIndex = '100';
        };
        const annotationMouseOutHandler = (annotation) => {
            annotation.div.classList.add('tooltip-hidden');
            annotation.div.style.removeProperty('z-index');
        };

        function basicGraphConfig(containerSelector, units, lineColor) {
            return {
                color: lineColor,
                width: 700,
                height: 300,
                strokeWidth: 3,
                axes: config.axes,
                axisLineColor: config.gridColor,
                gridLineColor: config.gridColor,
                gridLineWidth: 1,
                highlightCircleSize: 5,
                labelsKMB: true,
                labelsDiv: get(`${containerSelector} .graph-legend`),
                rollPeriod: 7,
                fillGraph: true,
                legendFormatter: (data) => legendFormatter(data, units),
                interactionModel: touchInteractionModel,
                annotationMouseOverHandler: (annotation) => annotationMouseOverHandler(annotation),
                annotationMouseOutHandler: (annotation) => annotationMouseOutHandler(annotation),
            };
        }

        function appendXAxisLabels(containerSelector, startMonth = 0) {
            const xAxisLabels = get(`${containerSelector} .graph-x-labels`);

            for (let i = startMonth; i < 12; i++) {
                const month = new Date(2021, i).toLocaleString(config.locale, { month: 'short' });
                const labelNode = document.createElement('div');
                const shortLabel = document.createElement('span');
                const longLabel = document.createElement('span');

                labelNode.classList.add('x-label');
                longLabel.classList.add('long-month');
                longLabel.textContent = month;
                shortLabel.classList.add('short-month');
                shortLabel.textContent = month.substring(0, 1);

                labelNode.appendChild(shortLabel);
                labelNode.appendChild(longLabel);
                xAxisLabels.appendChild(labelNode);
            }
        }

        function createValueFormatter(locale) {
            return function(num, opts, series, graph, row, col) {
                const currentValue = graph.getValue(row, col);

                return {
                    actual: currentValue.toLocaleString(locale),
                    average: Math.round(num).toLocaleString(locale),
                };
            };
        }

        function createAnnotations(seriesName, annotations) {
            // set basic properties for all annotations
            return annotations.map((annotation, i) => {
                return {
                    ...annotation,
                    series: seriesName, // must match column name in CSV
                    shortText: i + 1,
                    width: 24,
                    height: 24,
                    cssClass: `tooltip-hidden annotation-${i + 1}`,
                    tickWidth: 2,
                    tickHeight: annotation.tickHeight || 20
                };
            });
        }

        function createTooltip(date, text) {
            const tooltip = document.createElement('div');
            const titleNode = document.createElement('div');
            const textNode = document.createElement('div');

            titleNode.classList.add('tooltip-title');
            titleNode.textContent = new Date(date).toLocaleString(config.locale, config.dateOptions);
            textNode.textContent = text;

            tooltip.classList.add('tooltip');
            tooltip.appendChild(titleNode);
            tooltip.appendChild(textNode);

            return tooltip;
        }

        function appendTooltips(containerSelector, annotations) {
            // insert tooltip inside its respective annotation, replacing hover title text
            annotations.forEach((annotation, i) => {
                const tooltip = createTooltip(annotation.x, annotation.text);
                const annotationEl = get(`${containerSelector} .annotation-${i + 1}`);

                if (annotationEl && !annotationEl.contains(get('.tooltip', annotationEl))) {
                    annotationEl.appendChild(tooltip);
                    annotationEl.removeAttribute('title');
                }

                // check if tooltip overflows viewport
                if (tooltip) {
                    const rect = tooltip.getBoundingClientRect();

                    if (rect.right > window.innerWidth) {
                        tooltip.classList.add('tooltip-overflow-right');
                    } else if (rect.left < 0) {
                        tooltip.classList.add('tooltip-overflow-left');
                    }
                }
            });
        }

        // =================
        //      TRAFFIC
        // =================

        const trafficAnnotations = createAnnotations('Pageviews', [
            { x: "2025/02/02", text: "Lavos Prime alchemized" },
            { x: "2025/03/19", text: "Update 38.5: Techrot Encore", tickHeight: 40 },
            { x: "2025/05/21", text: "Yareli Prime emerged" },
            { x: "2025/06/05", text: "First Prime Resurgence for Revenant and Baruuk" },
            { x: "2025/06/25", text: "Update 39: Isleweaver and Operation: Eight Claw", tickHeight: 40 },
            { x: "2025/07/18", text: "TennoCon 2025", tickHeight: 40 },
            { x: "2025/08/26", text: "Caliban Prime acclimated" },
            { x: "2025/10/15", text: "Update 40: The Vallis Undermind", tickHeight: 40 },
            { x: "2025/12/10", text: "Update 41: The Old Peace", tickHeight: 80 },
            { x: "2025/12/16", text: "Operation: Blood of Perita", tickHeight: 30 },
        ]);
        const trafficGraphConfig = (containerSelector, yAxisRange, annotations, lineColor) => {
            return {
                ...basicGraphConfig(containerSelector, 'Views', lineColor),
                drawCallback: (dygraph, isInitial) => {
                    if (isInitial) {
                        dygraph.setAnnotations(annotations);
                        appendXAxisLabels(containerSelector, 1);
                    }

                    appendTooltips(containerSelector, annotations);
                },
                axes: {
                    ...config.axes,
                    y: {
                        ...config.axes.y,
                        valueRange: [0, yAxisRange],
                        valueFormatter: createValueFormatter(config.locale)
                    }
                }
            }
        };

        const traffic = new Dygraph(
            get('.traffic .graph'),
            './data/traffic.csv',
            trafficGraphConfig('.traffic', 1100000, trafficAnnotations, 'hsl(189, 100%, 45%)')
        );

        // graph width sometimes overflows container on load; try redrawing again after it appears
        traffic.ready(function () {
            traffic.resize();
        });

        // =================
        //       EDITS
        // =================

        const editsAnnotations = createAnnotations('Edits', [
            // { x: "2021/01/04", text: "RuneScape's 20th anniversary events begin" },
        ]);
        const editsGraphConfig = (containerSelector, lineColor) => {
            return {
                ...basicGraphConfig(containerSelector, 'Edits', lineColor),
                drawCallback: (dygraph, isInitial) => {
                    if (isInitial) {
                        dygraph.setAnnotations(editsAnnotations);
                        appendXAxisLabels(containerSelector);
                    }

                    appendTooltips(containerSelector, editsAnnotations);
                },
                axes: {
                    ...config.axes,
                    y: {
                        ...config.axes.y,
                        valueRange: [0, 850],
                        valueFormatter: createValueFormatter(config.locale)
                    }
                }
            }
        };

        const edits = new Dygraph(
            get('.edits .graph'),
            './data/edits.csv',
            editsGraphConfig('.edits', 'hsl(189, 100%, 45%)')
        );

        // graph width sometimes overflows container on load; try redrawing again after it appears
        edits.ready(function () {
            edits.resize();
        });
    }

    function initBarCharts() {
        function calculateRowTotal(warframe) {
            return warframe.variants.reduce((sum, v) => sum + v.pageviews, 0);
        }

        function createBarLabel(text) {
            const label = document.createElement('div');
            label.className = 'bar-label';
            label.textContent = text;

            return label;
        }

        function createBarTotal(total) {
            const barTotal = document.createElement('div');
            barTotal.className = 'bar-total';
            barTotal.textContent = total.toLocaleString();

            return barTotal;
        }

        function createBarSegment(variant, maxTotal) {
            const segment = document.createElement('div');
            const percentage = (variant.pageviews / maxTotal) * 100;
            const tooltip = createTooltip(variant);

            segment.classList.add('bar-segment', 'tooltip-hidden');
            segment.style.width = percentage + '%';
            segment.appendChild(tooltip);

            return segment;
        }

        function createBarContainer(variants, maxTotal) {
            const barContainer = document.createElement('div');
            barContainer.className = 'bar-container';

            variants.forEach(variant => {
                const segment = createBarSegment(variant, maxTotal);
                barContainer.appendChild(segment);
            });

            attachTooltipEvents(barContainer);
            return barContainer;
        }

        function createChartRow(warframe, maxTotal) {
            const row = document.createElement('div');
            row.className = 'chart-row';

            // if (warframe.isNew) {
            //     row.classList.add('new');
            // }

            const total = calculateRowTotal(warframe);

            row.appendChild(createBarLabel(warframe.name));
            row.appendChild(createBarContainer(warframe.variants, maxTotal));
            row.appendChild(createBarTotal(total));

            return row;
        }

        function createTooltip(variant) {
            const tooltip = document.createElement('div');
            const titleNode = document.createElement('div');
            const textNode = document.createElement('div');

            titleNode.classList.add('tooltip-title');
            titleNode.textContent = variant.name;
            textNode.classList.add('tooltip-text');
            textNode.textContent = variant.pageviews.toLocaleString() + ' views';

            tooltip.classList.add('tooltip');
            tooltip.appendChild(titleNode);
            tooltip.appendChild(textNode);

            return tooltip;
        }

        function attachTooltipEvents(barContainer) {
            // '.tooltip-hidden' is added/removed from the parent segment element, not the tooltip
            barContainer.addEventListener('mouseover', (e) => {
                let segment = e.target;

                if (segment.classList.contains('bar-segment')) {
                    segment.classList.remove('tooltip-hidden');
                }
            });

            barContainer.addEventListener('mouseout', (e) => {
                let segment = e.target;

                if (segment.classList.contains('bar-segment')) {
                    segment.classList.add('tooltip-hidden');
                }
            });
        }

        function renderStackedBarChart(data, container) {
            const sortedData = [...data].sort((a, b) => calculateRowTotal(b) - calculateRowTotal(a));
            const maxTotalPageviews = Math.max(...sortedData.map(wf => calculateRowTotal(wf)));

            sortedData.forEach(warframe => {
                const row = createChartRow(warframe, maxTotalPageviews);
                container.appendChild(row);
            });
        }

        function loadAndRenderChart(jsonUrl, container) {
            fetch(jsonUrl)
                .then(response => response.json())
                .then(data => renderStackedBarChart(data, container))
                .catch(error => {
                    console.error('Error loading chart data: ', error);
                    container.innerHTML = `<p>Error loading chart data: ${error}</p>`;
                });
        }

        loadAndRenderChart(
            './data/warframes.json',
            get('.warframe-chart .bar-chart-container')
        );
    }

    initGraphs();
    initBarCharts();
}());
