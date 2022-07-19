import React from 'react';
import Map from 'containers/Map';
import Loader from 'components/Loader';

import { connect } from 'react-redux';
import { toggleActivePage } from 'actions';
import { bindActionCreators } from 'redux';

import PARAMETERS from 'config/parameters';

class MapWrapper extends React.Component {

    setActivePage(page) {
        //dispatch action to show  table
        this.props.toggleActivePage(page);
    }

    //if no locations entries for a form, render an empty view
    renderNoLocationsEntriesView() {

        const elementClass = 'map-no-location-entries animated fadeIn text-center ' + this.props.class;

        return (
            <div className={elementClass}>
                <h2> No locations for this form or branch</h2>
                <button
                    className="btn btn-default btn-action" onClick={() => {
                    this.setActivePage(PARAMETERS.PAGE_TABLE);
                }}
                >View Table
                </button>
            </div>
        );
    }

    renderMapView() {
        return (
            <Map
                entriesLocations={this.props.entriesLocations}
                filteredEntries={this.props.filteredEntries}
                selectedDistributionQuestion={this.props.selectedDistributionQuestion}
                pieChartParams={this.props.pieChartParams}
            />);
    }

    render() {
        const totalEntriesLocations = this.props.entriesLocations.length;
        const isFetchingPage = this.props.isFetchingPage;

        //show loader when requesting next entries location "page"
        //we "paginate" the map every 50.000 entries to limit memory usage
        //and avoid crashes
        if (isFetchingPage) {
            return (
                <div className="map-wrapper animated fadeIn">
                    <div className="row">
                        <Loader />
                    </div>
                </div>
            );
        }

        return (
            <div className="map-wrapper animated fadeIn">
                <div className="row">
                    {totalEntriesLocations === 0 ? this.renderNoLocationsEntriesView() : this.renderMapView()}
                </div>
            </div>
        );
    }
}

MapWrapper.propTypes = {
    toggleActivePage: React.PropTypes.func,
    class: React.PropTypes.string,
    entriesLocations: React.PropTypes.array,
    selectedDistributionQuestion: React.PropTypes.object,
    isFetchingPage: React.PropTypes.bool,
    filteredEntries: React.PropTypes.array,
    pieChartParams: React.PropTypes.object
};

//get app state and map to props
//todo if I add the drawer state the component will update
const mapStateToProps = (state) => {
    return {
        activePage: state.navigationReducer.activePage,
        entriesLocations: state.mapReducer.entriesLocations,
        isFetchingPage: state.mapReducer.isFetchingPage,
        filteredEntries: state.mapReducer.filteredEntries,
        selectedDistributionQuestion: state.mapReducer.selectedDistributionQuestion,
        pieChartParams: state.mapReducer.pieChartParams
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleActivePage
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(MapWrapper);

