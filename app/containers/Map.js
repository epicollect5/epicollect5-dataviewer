import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import 'leaflet.heat';
import {
    toggleDrawerEntry,
    fetchEntry,
    setPieChartLegend,
    progressBarUpdate,
    mapClosePopupsReset,
    filterLocationsByDates,
    showDistributionPieCharts,
    toggleClusters,
    toggleClustersOverlay
} from 'actions';
import ToggleClustersOverlay from 'containers/ToggleClustersOverlay';
import PARAMETERS from 'config/parameters';
import mapUtils from 'utils/mapUtils';
import pieChart from 'utils/pie-chart';
import localstorage from 'utils/localstorage';
import isEmpty from 'lodash/isEmpty';
import helpers from '../utils/helpers';

class Map extends React.Component {

    constructor(props) {
        super(props);

        this.map = null;
        this.bounds = null;
        this.clusters = null;
        this.markers = null;
        this.heatmap = null;
        this.maxClusterRadius = 30;//default
        this.maxZoom = 18;
        this.legend = null;
        this.currentDistributionQuestion = null;
        this.state = {
            progressPercentage: 0,
            markersProcessed: 0,
            markersTotal: 0
        };

        this.overlays = null;
        this.selectedOverlay = PARAMETERS.MAP_OVERLAYS.CLUSTERS;

        this.renderDefaultMarkers = false;
        this.wasMapRestored = false;
    }

    shouldComponentUpdate (nextProps) {

        const href = window.location.href;
        const shouldRestore = helpers.getParameterByName('restore', href);
        const shouldRestoreParams = shouldRestore ? localstorage.getRestoreParams() : null;

        if (shouldRestoreParams) {
            if (nextProps.isUserFilteringClustersByDates) {
                console.log('avoid re-rendering');
                window.setTimeout(() => {
                    localstorage.clear();
                }, PARAMETERS.DELAY.LONG);

                this.wasMapRestored = true;

                return false;
            }
        }

        //avoid double rendering due to "CloseAllPopups" props
        //the first refresh does happen when closing the drawer as the marker popup needs
        //to get dismissed, the second one is redundant
        if (this.props.closeAllPopups === true && nextProps.closeAllPopups === false) {
            return false;
        }
        return true;
    }

    componentWillUpdate (nextProps) {

        //IMPORTANT this condition is true only when we reset the distribution filter!
        //this.renderDefaultMarkers is a flag to force a re-render of default clusters
        if (nextProps.selectedDistributionQuestion === null && this.currentDistributionQuestion !== null) {
            this.renderDefaultMarkers = true;
        }
    }

    componentDidMount () {
        console.log('map mounted');

        const markerPath = PARAMETERS.IS_LOCALHOST ? PARAMETERS.IMAGES_PATH_STANDALONE : window.EC5.SITE_URL + PARAMETERS.IMAGES_PATH_LARAVEL;
        const L = window.L;//leaflet is global
        const newIcon = L.icon({
            iconUrl: markerPath + PARAMETERS.MAP_MARKER_FILENAME,
            iconRetinaUrl: markerPath + PARAMETERS.MAP_MARKER_FILENAME,
            iconSize: [24, 24]
        });

        const href = window.location.href;
        const shouldRestore = helpers.getParameterByName('restore', href);
        const shouldRestoreParams = shouldRestore ? localstorage.getRestoreParams() : null;
        const totalMarkers = this.props.mapPagination.total;

        L.Marker.mergeOptions({
            icon: newIcon
        });

        //map setup options
        const mapOptions = {
            zoomControl: false,
            zoom: 3,
            maxZoom: this.maxZoom,
            minZoom: 1,
            maxNativeZoom: this.maxZoom,
            preferCanvas: true
        };

        this.map = L.map(this.mapNode, mapOptions).setView([0, 0]);
        //calculate cluster radius
        this.maxClusterRadius = mapUtils.getMaxRadius(this.props.entriesLocations);

        const updateProgressBar = (processed, total, elapsed) => {
            const percentage = Math.round((processed / total) * 100);

            if (elapsed > 500) {
                // if it takes more than a second to load, display the progress bar:
                //send action to show progressbar and update it
                this.props.progressBarUpdate(true, processed, total, percentage);
            }
            window.setTimeout(() => {
                if (processed === total) {
                    //all markers processed - hide the progress bar:
                    this.props.progressBarUpdate(false, 0, 0, 0);
                    //remove overlay
                    this.props.toggleClustersOverlay(false);
                }
            }, 1000);
        };

        this.markerClusterGroupOptions = {
            chunkedLoading: true,
            chunkProgress: updateProgressBar, //todo add this later
            chunkInterval: 200,
            chunkDelay: 50,
            maxClusterRadius: this.maxClusterRadius, //cluster radius is dynamic based on the number of entries
            singleMarkerMode: false,
            iconCreateFunction: mapUtils.createClusterIcon,
            spiderfyDistanceMultiplier: 4, //todo test this;
            disableClusteringAtZoom: totalMarkers > PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING ? 15 : null,
            animate: totalMarkers <= PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING// animate is ON only for small datasets
        };

        //add zoom controls on the right
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        ////add tiles (CARTO) -> default
        const carto = L.tileLayer(PARAMETERS.CARTO_LIGHT_TILES_PROVIDER, {
            attribution: PARAMETERS.CARTO_TILES_ATTRIBUTION,
            maxNativeZoom: 20
        });

        //add tiles (STAMEN HC)
        const stamenHC = L.tileLayer(PARAMETERS.STAMEN_HIGH_CONTRAST_TILES_PROVIDER, {
            attribution: PARAMETERS.STAMEN_TILES_ATTRIBUTION,
            maxNativeZoom: 20
        });

        //add tiles (OSM)
        const osm = L.tileLayer(PARAMETERS.OSM_TILES_PROVIDER, {
            attribution: PARAMETERS.OSM_TILES_ATTRIBUTION,
            maxNativeZoom: 20
        });

        const mapboxSatellite = L.tileLayer(PARAMETERS.MAPBOX_TILES_PROVIDER_SATELLITE, {
            attribution: PARAMETERS.MAPBOX_TILES_ATTRIBUTION,
            maxNativeZoom: 20
        });

        const mapboxOutdoors = L.tileLayer(PARAMETERS.MAPBOX_TILES_PROVIDER_OUTDOOR, {
            attribution: PARAMETERS.MAPBOX_TILES_ATTRIBUTION,
            maxNativeZoom: 20
        });

        //layers control https://goo.gl/TNMUoJ
        carto.addTo(this.map);//to set it as the default
        const baseMaps = {
            Satellite: mapboxSatellite,
            Terrain: mapboxOutdoors,
            Contrast: stamenHC,
            Carto: carto,
            OpenStreetMap: osm
        };

        //add layers control
        this.basemaps = L.control.layers(baseMaps).addTo(this.map);

        //render the  default clusters (or restore)
        this.renderClustersOnMap(this.props.entriesLocations, false, shouldRestoreParams);

        this.map.on('zoomend', () => {
            console.log('zoomend: ', this.map.getZoom());
            //clear restore object from localstorage when restoring TABLE
            if (shouldRestoreParams) {
                if (shouldRestoreParams.activePage === PARAMETERS.PAGE_TABLE) {
                    localstorage.clear();
                }
            }
        });

        // //add button to toggle clusters/markers
        // const clusterToggleButton = L.easyButton({
        //     position: 'topright',
        //     states: [{
        //         stateName: 'clustered',        //name the state
        //         icon: 'fa-map-marker fa-2x toggle-clustered',
        //         title: 'Group markers in clusters',      //like its title
        //         onClick: (btn, map) => {       //and its callback
        //
        //             if (totalMarkers > PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING) {
        //                 return false;
        //             }
        //
        //             this.props.toggleClustersOverlay();
        //
        //             window.setTimeout(() => {
        //                 this.map.removeLayer(this.clusters);
        //                 this.map.addLayer(this.markers);
        //                 this.props.toggleClusters(false);
        //                 btn.state('unclustered');    //change state on click!
        //
        //                 window.setTimeout(() => {
        //                     //re-render without clustering
        //                     this.props.toggleClustersOverlay();
        //                 }, PARAMETERS.DELAY.MEDIUM);
        //             }, PARAMETERS.DELAY.MEDIUM);
        //         }
        //     }, {
        //         stateName: 'unclustered',
        //         icon: 'fa-dot-circle-o fa-2x toggle-unclustered',
        //         title: 'Show all markers withut clusters',
        //         onClick: (btn, map) => {
        //
        //             this.props.toggleClustersOverlay();
        //
        //             //re-render the clusters
        //             window.setTimeout(() => {
        //                 this.map.addLayer(this.clusters);
        //                 this.map.removeLayer(this.markers);
        //                 this.props.toggleClusters(true);
        //                 btn.state('clustered');
        //
        //                 window.setTimeout(() => {
        //                     //re-render without clustering
        //                     this.props.toggleClustersOverlay();
        //                 }, PARAMETERS.DELAY.MEDIUM);
        //             }, PARAMETERS.DELAY.MEDIUM);
        //         }
        //     }]
        // });

        // const heatmapToggleButton = L.easyButton({
        //     position: 'topright',
        //     states: [{
        //         stateName: 'heatmap-off',        //name the state
        //         icon: 'fa-h-square fa-2x toggle-heatmap',
        //         title: 'Show heatmap instead of clusters',      //like its title
        //         onClick: (btn, map) => {       //and its callback
        //
        //             this.props.toggleClustersOverlay();
        //
        //             window.setTimeout(() => {
        //                 this.map.removeLayer(this.clusters);
        //                 this.map.removeLayer(this.markers);
        //                 this.map.addLayer(this.heatmap);
        //                 this.props.toggleClusters(false);
        //                 btn.state('heatmap-on');    //change state on click!
        //
        //                 window.setTimeout(() => {
        //                     //re-render without clustering
        //                     this.props.toggleClustersOverlay();
        //                 }, PARAMETERS.DELAY.MEDIUM);
        //             }, PARAMETERS.DELAY.MEDIUM);
        //         }
        //     }, {
        //         stateName: 'heatmap-on',
        //         icon: 'fa-dot-circle-o fa-2x toggle-heatmap',
        //         title: 'Show clusters instead of markers',
        //         onClick: (btn, map) => {
        //
        //             this.props.toggleClustersOverlay();
        //
        //             //re-render the clusters
        //             window.setTimeout(() => {
        //                 this.map.addLayer(this.clusters);
        //                 this.map.removeLayer(this.markers);
        //                 this.map.removeLayer(this.heatmap);
        //
        //                 this.props.toggleClusters(true);
        //                 btn.state('heatmap-off');
        //
        //                 window.setTimeout(() => {
        //                     //re-render without clustering
        //                     this.props.toggleClustersOverlay();
        //                 }, PARAMETERS.DELAY.MEDIUM);
        //             }, PARAMETERS.DELAY.MEDIUM);
        //         }
        //     }]
        // });


        // heatmapToggleButton.addTo(this.map);
    }

    componentDidUpdate () {
        console.log('map updated');

        const { pieChartParams, closeAllPopups } = this.props;

        if (closeAllPopups) {
            if (this.map) {
                this.map.closePopup();
                //reset closePopup state
                this.props.mapClosePopupsReset();
            }
        }

        //avoid a redrawing after a restore when all popups get closed
        if (this.wasMapRestored) {
            this.wasMapRestored = false;
            return;
        }

        //show pie charts if the user selected a question from the "distribution" dropdown
        //and we are in "clustering" mode
        if (this.props.selectedDistributionQuestion !== null) {
            if (this.currentDistributionQuestion === null) {
                //regenerate colors
                this.legend = pieChart.getPieChartLegend(pieChartParams);
                //set colors in Store
                this.props.setPieChartLegend(this.legend);
                this.currentDistributionQuestion = this.props.selectedDistributionQuestion;
                this.renderFilteredClusters(true);
            } else {

                if (this.currentDistributionQuestion.inputRef !== this.props.selectedDistributionQuestion.inputRef) {
                    //regenerate colors
                    this.legend = pieChart.getPieChartLegend(pieChartParams);
                    //set colors in Store
                    this.props.setPieChartLegend(this.legend);
                    this.currentDistributionQuestion = this.props.selectedDistributionQuestion;
                }
                //render filtered locations with pie charts if any
                this.renderFilteredClusters(true);
            }
        } else {
            //show default clusters: when the component is updated, we re-render only if we are filtering
            this.legend = null;
            this.currentDistributionQuestion = null;
            this.renderFilteredClusters(false);
        }
    }

    renderFilteredClusters (withPieCharts) {

        //is there any entry to filter?
        const totalEntriesLocations = this.props.entriesLocations.length;
        const totalFilteredEntries = this.props.filteredEntries.length;
        const { isUserFilteringClustersByDates } = this.props;
        const href = window.location.href;
        const shouldRestore = helpers.getParameterByName('restore', href);
        const shouldRestoreParams = shouldRestore ? localstorage.getRestoreParams() : null;

        //render filtered locations if any
        if (totalFilteredEntries > 0 && totalFilteredEntries < totalEntriesLocations) {
            this.renderClustersOnMap(this.props.filteredEntries, withPieCharts);
        } else {
            //render only filtered locations or re-render all if pie charts
            if (totalFilteredEntries > 0) {
                this.renderClustersOnMap(this.props.entriesLocations, withPieCharts);
            } else {
                //render all pie charts?
                if (withPieCharts) {
                    this.renderClustersOnMap(this.props.entriesLocations, withPieCharts, shouldRestoreParams);
                } else {
                    if (isUserFilteringClustersByDates) {
                        this.renderClustersOnMap(this.props.filteredEntries, false);
                    } else {

                        if (this.renderDefaultMarkers) {
                            this.renderClustersOnMap(this.props.entriesLocations, false);
                            this.renderDefaultMarkers = false;
                        }
                    }
                }
            }
        }
    }

    //plot the cluster in the map, passing an array of entries
    renderClustersOnMap (entries, withPieCharts, shouldRestoreParams) {
        console.log('renderClustersOnMap called');
        //build clusters content
        const L = window.L;//leaflet is global
        const totalMarkers = this.props.mapPagination.total;
        let pieChartParams = this.props.pieChartParams;
        const { projectStats, currentFormRef } = this.props;
        const heatmapOptions = { radius: 10, minOpacity: 0.5, blur: 10 };
        const shouldRestoreEntryUuid = shouldRestoreParams ? shouldRestoreParams.entryUuid : null;
        let filteredEntries;

        if (shouldRestoreParams) {
            let startDate = shouldRestoreParams.mapControls.sliderStartDate;
            let endDate = shouldRestoreParams.mapControls.sliderEndDate;
            const sliderStartValue = shouldRestoreParams.mapControls.sliderStartValue;
            const sliderEndValue = shouldRestoreParams.mapControls.sliderEndValue;

            //get start date and end date from restore  parameters and filter tne entries
            //if both startDate & endDate are null, no filters were applied
            if (startDate === null && endDate === null) {
                filteredEntries = entries;
                window.setTimeout(() => {
                    //get default values
                    startDate = projectStats.form_counts[currentFormRef].first_entry_created;
                    endDate = projectStats.form_counts[currentFormRef].last_entry_created;
                    const datesRange = mapUtils.getDatesRange(startDate.replace(' ', 'T'), endDate.replace(' ', 'T'));

                    this.props.filterLocationsByDates(startDate, endDate, 0, (datesRange.length - 1));
                }, 0);

            } else {
                filteredEntries = mapUtils.getFilteredEntries(entries, startDate, endDate);
                //call Drawer function
                window.setTimeout(() => {
                    this.props.filterLocationsByDates(startDate, endDate, sliderStartValue, sliderEndValue);
                }, 0);
            }

            if (shouldRestoreParams.selectedDistributionQuestion !== null) {
                withPieCharts = true;
                pieChartParams = shouldRestoreParams.pieChartParams;
                this.legend = shouldRestoreParams.pieChartLegend;

                //set this to avoid pie charts colors regeneration after a restore
                this.currentDistributionQuestion = shouldRestoreParams.selectedDistributionQuestion;
            }
        } else {
            filteredEntries = entries;
        }

        //remove existing clusters
        if (this.clusters) {
            this.map.removeLayer(this.clusters);
            this.map.removeLayer(this.markers);
            // this.clusters.clearLayers();
            // this.markers.clearLayers();
        }

        if (withPieCharts) {
            //render pie chart clusters
            this.markerClusterGroupOptions.singleMarkerMode = true; //to display a single marker as pie chart
            this.clusters = pieChart.renderClusters(pieChartParams, this.markerClusterGroupOptions, this.legend);
        } else {
            //render default clusters, no single marker clusters!
            this.markerClusterGroupOptions.singleMarkerMode = false;
            this.currentDistributionQuestion = null;
            this.clusters = L.markerClusterGroup(this.markerClusterGroupOptions);
        }

        //*****************************************************************************************
        // const fakeEntries = [];
        //
        // for (let i = 0; i < 300000; i++) {
        //     //random around London, 10km radius
        //     const coords = mapUtils.getRandomLocation(51.507359, -0.136439, 100000);
        //     const fake = {
        //         id: '29c7c8d0-e637-4f1c-8591-5f4dd5554747',
        //         type: 'Feature',
        //         geometry: { type: 'Point', coordinates: [coords.longitude, coords.latitude] },
        //         properties: {
        //             uuid: '29c7c8d0-e637-4f1c-8591-5f4dd5554747',
        //             title: '29c7c8d0-e637-4f1c-8591-5f4dd5554747',
        //             accuracy: 16,
        //             created_at: '2020-05-04',
        //             possible_answers: { b577bc6c392f1: 1 }
        //         }
        //     };
        //     fakeEntries.push(fake);
        // }

        // filteredEntries = fakeEntries;
        //*****************************************************************************************

        const markersObj = mapUtils.getMarkers(filteredEntries, shouldRestoreEntryUuid);
        const markerList = markersObj.markerList;
        const latLongs = markersObj.latLongs;
        const markerToRestore = markersObj.markerToRestore;

        this.markers = L.featureGroup();

        //add clusters to map
        for (let index = 0; index < markerList.length; index++) {
            this.clusters.addLayer(markerList[index]);
            this.markers.addLayer(markerList[index]);
        }

        if (this.heatmap === null) {
            //set heatmap first time
            this.heatmap = L.heatLayer(latLongs, heatmapOptions);
        } else {
            //remove existing heatmap and create a new one
            //this is the only way to make it work, updating an existing one triggers an error...
            this.map.removeLayer(this.heatmap);
            this.heatmap = L.heatLayer(latLongs, heatmapOptions);
        }

        //if the user picked a distrubution question, switch to clusters overlay
        if (withPieCharts) {
            //  if()
            // this.props.progressBarUpdate(true, 0, markerList.length, 0);
            //adding the layer will set the layer switcher to that layer as selected
            window.setTimeout(() => {
                this.map.addLayer(this.clusters);
            }, PARAMETERS.DELAY.SHORT);
        } else {
            window.setTimeout(() => {
                //go back to the previously selected overlay layer
                //adding the selected  overlay layer to the map
                switch (this.selectedOverlay) {
                    case PARAMETERS.MAP_OVERLAYS.CLUSTERS:
                        this.map.addLayer(this.clusters);
                        break;
                    case PARAMETERS.MAP_OVERLAYS.HEATMAP:
                        this.map.addLayer(this.heatmap);
                        //remove waiting overlay manually as progress() is called only for clusters
                        window.setTimeout(() => {
                            this.props.toggleClustersOverlay(false);
                        }, PARAMETERS.DELAY.MEDIUM);
                        break;
                    case PARAMETERS.MAP_OVERLAYS.MARKERS:
                        this.map.addLayer(this.markers);
                        //remove waiting overlay manually as progress() is called only for clusters
                        window.setTimeout(() => {
                            this.props.toggleClustersOverlay(false);
                        }, PARAMETERS.DELAY.MEDIUM);
                        break;
                    default:
                    //do nothing
                }
            }, PARAMETERS.DELAY.SHORT);
        }

        // //do the following not to add the control buttons every time
        if (this.overlays) {
            //remove existing controls
            this.map.removeControl(this.overlays);
            //reset overlays
            this.overlays = null;
        }

        //can we display markers without clusters?
        if (totalMarkers < PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING) {
            //add overlays WITH unclustered markers overlay
            this.overlays = L.control.layers({
                Clusters: this.clusters,
                Heatmap: this.heatmap,
                Markers: this.markers
            });
        } else {
            //add overlays WITHOUT unclustered markers overlay
            this.overlays = L.control.layers({
                Clusters: this.clusters,
                Heatmap: this.heatmap
            });
        }

        //re-add the overlays controls each time otherwise they do not work
        //guess it is a binding issue
        this.overlays.addTo(this.map);

        //keep track of what overlay layer is selected
        this.map.on('baselayerchange', (e) => {
            this.selectedOverlay = e.name;
        });

        this.map.on('click', (e) => {
            const coord = e.latlng;
            const lat = coord.lat;
            const lng = coord.lng;
            console.log('You clicked the map at latitude: ' + lat + ' and longitude: ' + lng);
        });

        //fit bounds
        this.bounds = new L.LatLngBounds(latLongs);

        //listen to click on each marker attaching the event to the layer directly
        this.clusters.on('click', (event) => {
            const clickedMarker = event.layer;
            const entry = clickedMarker.options;
            const { projectSlug, selectedLocationQuestion } = this.props;
            const branchRef = selectedLocationQuestion.branch_ref === null ? '' : selectedLocationQuestion.branch_ref;

            //fetch single entry details
            this.props.fetchEntry(projectSlug, currentFormRef, entry.uuid, branchRef);
        });

        this.markers.on('click', (event) => {
            const clickedMarker = event.layer;
            const entry = clickedMarker.options;
            const { projectSlug, selectedLocationQuestion } = this.props;
            const branchRef = selectedLocationQuestion.branch_ref === null ? '' : selectedLocationQuestion.branch_ref;

            //fetch single entry details
            this.props.fetchEntry(projectSlug, currentFormRef, entry.uuid, branchRef);
        });

        //listen to click on each popup close attaching the event to the layer directly
        this.clusters.on('popupclose', () => {
            //close drawer entry
            this.props.toggleDrawerEntry(true);
        });

        //listen to click on each popup close attaching the event to the layer directly
        this.markers.on('popupclose', () => {
            //close drawer entry
            this.props.toggleDrawerEntry(true);
        });

        this.map.on('zoomstart', () => {
            // console.log('zoomstart =>', this.map.getZoom());
        });

        //restore popup and entry from an edit?
        if (shouldRestoreParams) {
            //check whether we are restoring map view or not
            if (shouldRestoreParams.activePage === PARAMETERS.PAGE_MAP) {

                //we are using a timeout because there is some race condition, and "zoomToShowLayer"
                //was not firing... go figure
                //this method is explained here https://goo.gl/4eJjcC
                //issue here https://github.com/Leaflet/Leaflet.markercluster/issues/904
                window.setTimeout(() => {
                    this.clusters.zoomToShowLayer(markerToRestore, () => {

                        const { projectSlug, selectedLocationQuestion } = this.props;
                        const branchRef = selectedLocationQuestion.branch_ref === null ? '' : selectedLocationQuestion.branch_ref;
                        const entryUuid = markerToRestore.options.uuid;

                        //open restored marker popup
                        markerToRestore.fire('click');

                        //center map on selected marker using a close up zoom level to avoid reclustering
                        console.log('restoring with this.maxZoom=======================>>', this.maxZoom);
                        this.map.setView(markerToRestore.getLatLng(), this.maxZoom);

                        //fetch single entry details for the left drawer
                        this.props.fetchEntry(projectSlug, currentFormRef, entryUuid, branchRef);
                    });
                }, PARAMETERS.DELAY.MEDIUM);
            } else {
                //when it is a fresh load, fit the map to its bounds

                //IMPORTANT: this generates an error with fake entries, maybe one of the locations Lat or long is not right....
                //apparently it does not happen with real entries
                //update June 2017 -> applied timeout to fix error, see here https://github.com/Leaflet/Leaflet/issues/3280
                window.setTimeout(() => {
                    console.log('this.map.fitBounds called ***************************************');
                    if (!isEmpty(this.bounds)) {
                        this.map.fitBounds(this.bounds, { padding: [50, 50] });
                    }
                }, PARAMETERS.DELAY.LONG);
            }
        } else {
            //when it is a fresh load, fit the map to its bounds

            //IMPORTANT: this generates an error with fake entries, maybe one of the locations Lat or long is not right....
            //apparently it does not happen with real entries
            //update June 2017 -> applied timeout to fix error, see here https://github.com/Leaflet/Leaflet/issues/3280
            window.setTimeout(() => {
                console.log('calling fit bounds if empty');
                if (!isEmpty(this.bounds)) {
                    this.map.fitBounds(this.bounds, { padding: [50, 50] });
                }
            }, PARAMETERS.DELAY.LONG);
        }
    }

    render () {
        return (
            <div>
                <ToggleClustersOverlay />
                <div
                    id="map" ref={(mapNode) => {
                        this.mapNode = mapNode;
                    }}
                />
            </div>
        );
    }
}

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        currentFormRef: state.navigationReducer.currentFormRef,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        closeAllPopups: state.mapReducer.closeAllPopups,
        // clustered: state.mapReducer.clustered,
        selectedLocationQuestion: state.mapReducer.selectedLocationQuestion,
        isUserFilteringClustersByDates: state.mapReducer.isUserFilteringClustersByDates,
        projectStats: state.projectReducer.projectStats,
        mapPagination: state.mapReducer.pagination
    };
};

function mapDispatchToProps (dispatch) {
    return bindActionCreators({
        toggleDrawerEntry,
        setPieChartLegend,
        fetchEntry,
        progressBarUpdate,
        mapClosePopupsReset,
        filterLocationsByDates,
        showDistributionPieCharts,
        toggleClusters,
        toggleClustersOverlay
    }, dispatch);
}

Map.propTypes = {
    entriesLocations: React.PropTypes.array,
    filteredEntries: React.PropTypes.array,
    selectedDistributionQuestion: React.PropTypes.object,
    progressBarUpdate: React.PropTypes.func,
    fetchEntry: React.PropTypes.func,
    toggleDrawerEntry: React.PropTypes.func,
    projectSlug: React.PropTypes.string,
    currentFormRef: React.PropTypes.string,
    selectedLocationQuestion: React.PropTypes.object,
    mapClosePopupsReset: React.PropTypes.func,
    pieChartParams: React.PropTypes.object,
    closeAllPopups: React.PropTypes.bool,
    isUserFilteringClustersByDates: React.PropTypes.bool,
    setPieChartLegend: React.PropTypes.func,
    toggleClustersOverlay: React.PropTypes.func,
    projectStats: React.PropTypes.object,
    mapPagination: React.PropTypes.object,
    filterLocationsByDates: React.PropTypes.func
};

export default connect(mapStateToProps, mapDispatchToProps)(Map);

