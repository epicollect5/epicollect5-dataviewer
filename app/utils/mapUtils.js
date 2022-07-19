import moment from 'moment';
import PARAMETERS from "../config/parameters";

const L = window.L; //leaflet is global

const mapUtils = {
    getMarkers(entries, restoreMarkerEntryUuid) {

        const markerList = [];
        const latLongs = [];
        let markerToRestore = null;

        for (let i = 0; i < entries.length; i++) {

            const entry = entries[i];
            const title = entry.properties.title;

            //get cooords
            latLongs.push([entry.geometry.coordinates[1], entry.geometry.coordinates[0]]);

            //create marker
            const marker = L.circleMarker(
                L.latLng(entry.geometry.coordinates[1], entry.geometry.coordinates[0]), {
                    uuid: entry.properties.uuid,
                    title,
                    color: PARAMETERS.THEME.DEEP_PURPLE,
                    fillColor: PARAMETERS.THEME.HOT_PINK,
                    fillOpacity: 1,
                    possible_answers: entry.properties.possible_answers,
                    radius: 10
                });

            //bind popup and add it to the marker list
            marker.bindPopup(title);
            markerList.push(marker);

            if (restoreMarkerEntryUuid === entry.properties.uuid) {
                markerToRestore = marker;
            }
        }
        return {
            markerList,
            latLongs,
            markerToRestore
        };
    },

    //get a date range (1 day step) for the dates slider
    getDatesRange(startDate, endDate) {

        let from = new Date(startDate);
        const startDay = new Date(startDate);
        const to = new Date(endDate);
        let day;
        const between = [startDay, from];

        while (moment(from).isBefore(to, 'day')) {
            day = from.getDate();
            from = new Date(from.setDate(++day));
            between.push(from);
        }
        //remove last element as it is creating a duplicate of the last date, go figure
        between.pop();
        return between;
    },

    //calculate cluster radius based on amount of entries
    getMaxRadius(entries) {

        const total = entries.length;
        const orderOfMagnitude = +(total.toString().length);
        const multiplier = +(total.toString().charAt(0));

        console.log('Max radius is: ', 11 * multiplier * orderOfMagnitude);

        return 11 * multiplier * orderOfMagnitude; //Maximum radius for clusters
    },

    getFilteredEntries(entries, startDate, endDate) {

        //filter data set by data range
        const filteredEntries = entries.filter((entry) => {

            const entryCreatedAt = new Date(entry.properties.created_at);
            const lowerRangeDate = new Date(startDate);
            const upperRangeDate = new Date(endDate);

            //check if entry within range with 'day' precision
            return (moment(entryCreatedAt).isBetween(lowerRangeDate, upperRangeDate, 'day', []));
        });

        return filteredEntries;
    },
    createClusterIcon(cluster) {

        const childCount = cluster.getChildCount();
        const pointSize = childCount > 999 ? 50 : 40;

        let c = ' marker-cluster-';
        if (childCount < 10) {
            c += 'small';
        } else if (childCount < 100) {
            c += 'medium';
        } else {
            c += 'large';
        }

        return new L.DivIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(pointSize, pointSize)
        });
    },
    getPixiOverlay(markers) {

        const pixiOverlay = (() => {
            let frame = null;
            let firstDraw = true;
            let prevZoom;
            let projectedCenter;
            let circleRadius = 10;
            const pixiContainer = new PIXI.Container();


            const doubleBuffering = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            return L.pixiOverlay((utils) => {
                if (frame) {
                    cancelAnimationFrame(frame);
                    frame = null;
                }
                const zoom = utils.getMap().getZoom();
                const container = utils.getContainer();
                const renderer = utils.getRenderer();
                const project = utils.latLngToLayerPoint;
                const scale = utils.getScale();

                if (firstDraw) {
                    utils.getMap().on('click', (e) => {
                        //not really nice but much better than before
                        //good starting point for improvements
                        const interaction = utils.getRenderer().plugins.interaction;
                        const pointerEvent = e.originalEvent;
                        const pixiPoint = new PIXI.Point();
                        //get global click position in pixiPoint:
                        interaction.mapPositionToPoint(pixiPoint, pointerEvent.clientX, pointerEvent.clientY);
                        //get what is below the click if any:
                        const target = interaction.hitTest(pixiPoint, container);
                        if (target && target.popup) {
                            target.popup.openOn(this.map);
                        }
                    });


                }
                if (firstDraw || prevZoom !== zoom) {
                    markers.forEach((marker) => {
                        const circleCenter = [marker._latlng.lat, marker._latlng.lng];
                        const circle = new PIXI.Graphics();
                        circle.popup = L.popup()
                            .setLatLng(circleCenter)
                            .setContent(marker.options.title);

                        circle.interactive = true;

                        projectedCenter = project(circleCenter);
                        circleRadius = circleRadius / scale;
                        circle.clear();
                        circle.lineStyle(3 / scale, 0xff0000, 1);
                        circle.beginFill(0xff0033, 0.5);
                        circle.x = projectedCenter.x;
                        circle.y = projectedCenter.y;
                        circle.drawCircle(0, 0, circleRadius);
                        circle.endFill();


                        pixiContainer.addChild(circle);
                        pixiContainer.interactive = true;
                        pixiContainer.buttonMode = true;
                    });

                }

                firstDraw = false;
                prevZoom = zoom;
                renderer.render(container);
            }, pixiContainer, {
                doubleBuffering,
                autoPreventDefault: false
            });
        })();


        // const pixiOverlay = L.pixiOverlay((utils) => {
        //     // your drawing code here
        //
        //
        // }, new PIXI.Container());


        return pixiOverlay;
    },

    getRandomLocation: (latitude, longitude, radiusInMeters) => {

        const getRandomCoordinates = (radius, uniform) => {
            // Generate two random numbers
            let a = Math.random();
            let b = Math.random();

            // Flip for more uniformity.
            if (uniform) {
                if (b < a) {
                    const c = b;
                    b = a;
                    a = c;
                }
            }

            // It's all triangles.
            return [
                b * radius * Math.cos(2 * Math.PI * a / b),
                b * radius * Math.sin(2 * Math.PI * a / b)
            ];
        };

        const randomCoordinates = getRandomCoordinates(radiusInMeters, true);

        // Earths radius in meters via WGS 84 model.
        const earth = 6378137;

        // Offsets in meters.
        const northOffset = randomCoordinates[0];
        const eastOffset = randomCoordinates[1];

        // Offset coordinates in radians.
        const offsetLatitude = northOffset / earth;
        const offsetLongitude = eastOffset / (earth * Math.cos(Math.PI * (latitude / 180)));

        // Offset position in decimal degrees.
        return {
            latitude: latitude + (offsetLatitude * (180 / Math.PI)),
            longitude: longitude + (offsetLongitude * (180 / Math.PI))
        };
    }

};

export default mapUtils;
