import PARAMETERS from 'config/parameters';
import ObjectEntriesPolyfill from 'object.entries';
import ObjectValuesPolyfill from 'object.values';

const pieChart = {

    calculateSectors(data, total, size, legend) {

        const _roundFloat = (number, decimals) => {
            return (Math.round(number * (Math.pow(10, decimals))) / Math.pow(10, decimals)).toFixed(decimals);
        };
        const iterator = Object.values || ObjectValuesPolyfill;

        const sectors = [];
        const l = size / 2;
        let a = 0; //Angle
        let aRad = 0; //Angle in Rad
        let z = 0; //Size z
        let x = 0; //Side x
        let y = 0;//Side y
        let X = 0; //SVG X coordinate
        let Y = 0; //SVG Y coordinate
        let R = 0; //Rotation

        iterator(data).forEach((value, index) => {

            let percentage = (value > 0) ? parseFloat(_roundFloat(value / total, 2)) : 0;
            let arcSweep;

            //hack: the math does not work if percentage is exactly 1, the sector does not get drawn
            //with 0.9999 it is a full circle
            percentage = (percentage === 1) ? 0.9999 : percentage;

            a = 360 * percentage;
            const aCalc = (a > 180) ? 360 - a : a;
            aRad = aCalc * Math.PI / 180;
            z = Math.sqrt(2 * l * l - ( 2 * l * l * Math.cos(aRad) ));
            if (aCalc <= 90) {
                x = l * Math.sin(aRad);
            }
            else {
                x = l * Math.sin((180 - aCalc) * Math.PI / 180);
            }

            y = Math.sqrt(z * z - x * x);
            Y = y;

            if (a <= 180) {
                X = l + x;
                arcSweep = 0;
            }
            else {
                X = l - x;
                arcSweep = 1;
            }

            sectors.push({
                percentage,
                color: legend[index].color,
                arcSweep,
                L: l,
                X,
                Y,
                R
            });

            R = R + a;
        });
        return sectors;
    },

    renderClusters(pieChartParams, markerClusterGroupOptions, pieChartLegend) {

        const L = window.L;//leaflet is global

        return L.markerClusterGroup({
            ...markerClusterGroupOptions,
            iconCreateFunction: (cluster) => {

                //here I nedd to calculate the piechart per each cluster
                const clusterMarkers = cluster.getAllChildMarkers();
                const distribution = {};
                let answersTotal = 0;

                //per each answerRef, calculate distribution
                Object.keys(pieChartParams.possibleAnswersHashMap).forEach((answerRef) => {

                    distribution[answerRef] = 0;

                    clusterMarkers.forEach((marker) => {
                        //check if the answer ref exists
                        if (marker.options.possible_answers[answerRef]) {
                            distribution[answerRef]++;
                            answersTotal++;
                        }
                    });
                });

                //calculate donut size based on order of magnitude
                const donutSize = (parseInt(answersTotal.toString().length, 10) + 2) * 10;
                const sectors = pieChart.calculateSectors(distribution, answersTotal, donutSize, pieChartLegend);

                return L.divIcon({
                    html: pieChart.getClusterPieChartSVG(donutSize, sectors, answersTotal),
                    iconSize: new L.Point(donutSize, donutSize)
                });
            }
        });

    },

    getClusterPieChartSVG(donutSize, sectors, answersTotal) {

        const newSVG = document.createElementNS(PARAMETERS.SVGNS, 'svg');

        newSVG.setAttributeNS(null, 'style', 'width: ' + donutSize + 'px; height: ' + donutSize + 'px');

        let sectorPercentage = 0;

        sectors.map((sector) => {

            sectorPercentage += sector.percentage;

            const newSector = document.createElementNS(PARAMETERS.SVGNS, 'path');
            newSector.setAttributeNS(null, 'fill', sector.color);
            newSector.setAttributeNS(null, 'd', 'M' + sector.L + ',' + sector.L + ' L' + sector.L + ',0 A' + sector.L + ',' + sector.L + ' 0 ' + sector.arcSweep + ',1 ' + sector.X + ', ' + sector.Y + ' z');
            newSector.setAttributeNS(null, 'transform', 'rotate(' + sector.R + ', ' + sector.L + ', ' + sector.L + ')');

            newSVG.appendChild(newSector);
        });


        const midCircle = document.createElementNS(PARAMETERS.SVGNS, 'circle');
        midCircle.setAttributeNS(null, 'cx', donutSize * 0.5);
        midCircle.setAttributeNS(null, 'cy', donutSize * 0.5);

        if (sectorPercentage > 0) {
            midCircle.setAttributeNS(null, 'r', donutSize * 0.28);
            midCircle.setAttributeNS(null, 'fill', '#fff');
        }
        else {
            //if no sectors to show, make inner circle bigger and add a stroke
            midCircle.setAttributeNS(null, 'r', donutSize / 2);
            midCircle.setAttributeNS(null, 'fill', '#C159B3');
        }


        const newText = document.createElementNS(PARAMETERS.SVGNS, 'text');
        newText.setAttributeNS(null, 'x', donutSize * 0.5);
        newText.setAttributeNS(null, 'y', donutSize * 0.5);
        newText.setAttributeNS(null, 'dy', '.35em');
        newText.setAttributeNS(null, 'font-size', 12);
        newText.setAttributeNS(null, 'text-anchor', 'middle');
        newText.setAttributeNS(null, 'class', 'clusterMarkersTotal');

        const textNode = document.createTextNode(answersTotal);
        newText.appendChild(textNode);

        newSVG.appendChild(midCircle);
        newSVG.appendChild(newText);

        const s = new XMLSerializer();

        return s.serializeToString(newSVG);
    },

    getSimplePieChartSVG(donutSize, sectors) {

        const newSVG = document.createElementNS(PARAMETERS.SVGNS, 'svg');

        newSVG.setAttributeNS(null, 'style', 'width: ' + donutSize + 'px; height: ' + donutSize + 'px');

        sectors.map((sector) => {

            const newSector = document.createElementNS(PARAMETERS.SVGNS, 'path');
            newSector.setAttributeNS(null, 'fill', sector.color);
            newSector.setAttributeNS(null, 'd', 'M' + sector.L + ',' + sector.L + ' L' + sector.L + ',0 A' + sector.L + ',' + sector.L + ' 0 ' + sector.arcSweep + ',1 ' + sector.X + ', ' + sector.Y + ' z');
            newSector.setAttributeNS(null, 'transform', 'rotate(' + sector.R + ', ' + sector.L + ', ' + sector.L + ')');

            newSVG.appendChild(newSector);
        });

        const s = new XMLSerializer();

        return s.serializeToString(newSVG);
    },

    getPieChartLegend(pieChartParams) {

        const sectorColors = [];
        const iterator = Object.entries || ObjectEntriesPolyfill;

        iterator(pieChartParams.possibleAnswersHashMap).forEach((possibleAnswer) => {
            sectorColors.push({
                color: pieChart.getRandomColor(),
                answerRef: possibleAnswer[0],
                answer: possibleAnswer[1]
            });
        });

        return sectorColors;
    },
    getRandomColor() {
        let length = 6;
        const chars = '0123456789ABCDEF';
        let hex = '#';
        while (length--) hex += chars[(Math.random() * 16) | 0];
        return hex;
    }
};

export default pieChart;

