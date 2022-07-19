import React from 'react';
import { connect } from 'react-redux';

class WaitOverlay extends React.Component {

    render() {

        const { isPerformingLongAction } = this.props;

        if (!isPerformingLongAction) {
            return null;
        }

        return (
            <div className="wait-overlay" />
        );
    }
}

WaitOverlay.propTypes = {
    isPerformingLongAction: React.PropTypes.bool
};


//get app state and map to props
function mapStateToProps(state) {
    return {
        isPerformingLongAction: state.navigationReducer.isPerformingLongAction
    };
}

export default connect(mapStateToProps)(WaitOverlay);

