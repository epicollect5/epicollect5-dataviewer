import React from 'react';
import { connect } from 'react-redux';
import ProgressBar from 'react-bootstrap/lib/ProgressBar';

import PARAMETERS from 'config/parameters';

class MapProgressBar extends React.Component {


    render() {
        const { progressBarMarkersProcessed, progressBarMarkersTotal, progressBarPercentage, progressBarIsVisible, activePage } = this.props;
        if (progressBarIsVisible && activePage === PARAMETERS.PAGE_MAP) {
            return (
                <div className="map-progress-wrapper animated fadeIn">
                    <div className="map-progress-completed">{progressBarMarkersProcessed}/{progressBarMarkersTotal}</div>
                    <ProgressBar className="map-progress-bar" now={progressBarPercentage} />
                </div>
            );
        }
        return null;
    }
}

MapProgressBar.propTypes = {
    progressBarMarkersProcessed: React.PropTypes.number,
    progressBarMarkersTotal: React.PropTypes.number,
    progressBarPercentage: React.PropTypes.number,
    progressBarIsVisible: React.PropTypes.bool,
    activePage: React.PropTypes.string
};

//get app state and map to props
function mapStateToProps(state) {
    return {
        progressBarIsVisible: state.mapReducer.progressBarIsVisible,
        progressBarMarkersProcessed: state.mapReducer.progressBarMarkersProcessed,
        progressBarMarkersTotal: state.mapReducer.progressBarMarkersTotal,
        progressBarPercentage: state.mapReducer.progressBarPercentage,
        activePage: state.navigationReducer.activePage
    };
}

export default connect(mapStateToProps)(MapProgressBar);
