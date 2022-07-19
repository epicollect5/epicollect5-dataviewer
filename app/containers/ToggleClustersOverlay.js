import React from 'react';
import { connect } from 'react-redux';

class ToggleClustersOverlay extends React.Component {

    render() {

        if (!this.props.overlay) {
            return null;
        }

        return (
            <div className="wait-overlay"/>
        );
    }
}

//get app state and map to props
function mapStateToProps(state) {
    return {
        overlay: state.mapReducer.overlay
    };
}

ToggleClustersOverlay.propTypes = {
    overlay: React.PropTypes.bool
};

export default connect(mapStateToProps)(ToggleClustersOverlay);

