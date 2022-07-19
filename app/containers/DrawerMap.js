import React from 'react';
import { connect } from 'react-redux';
import {
    toggleDrawerMap
} from 'actions';
import { bindActionCreators } from 'redux';
import MapControls from 'containers/MapControls';
import helpers from 'utils/helpers';
import localstorage from 'utils/localstorage';


class DrawerMap extends React.Component {

    constructor(props) {
        super(props);

        this.onToggleDrawer = this.onToggleDrawer.bind(this);
    }

    onToggleDrawer(showDrawerMap) {
        this.props.toggleDrawerMap(showDrawerMap);
    }

    //open the drawer and the main navigation state (MAP OR TABLE)
    render() {

        const { showDrawerMap } = this.props.drawerReducer;
        const elementClass = showDrawerMap ? 'show drawer' : 'drawer';
        const { currentFormRef } = this.props.navigationReducer;
        const href = window.location.href;
        const shouldRestore = helpers.getParameterByName('restore', href);
        const shouldRestoreParams = shouldRestore ? localstorage.getRestoreParams() : null;

        //if the project does not have any questions set yet, return null (lists property willbe undefined)
        if (this.props.projectReducer.projectExtra.forms[currentFormRef].lists === undefined) {
            return null;
        }

        const inputsWithPossibleAnswers = this.props.projectReducer.projectExtra.forms[currentFormRef].lists.multiple_choice_inputs.form.order;
        const locationInputsList = this.props.projectReducer.projectExtra.forms[currentFormRef].lists.location_inputs;
        const { selectedDistributionQuestion } = this.props.mapReducer;
        const hasLocation = this.props.projectReducer.projectExtra.forms[currentFormRef].details.has_location;
        let selectedLocationQuestion = {};

        if (hasLocation) {
            selectedLocationQuestion = this.props.projectReducer.projectExtra.forms[currentFormRef].lists.location_inputs[0];
        }

        if (shouldRestoreParams) {
            selectedLocationQuestion = shouldRestoreParams.selectedLocationQuestion;
        }

        return (
            <div id="drawer__map" className={elementClass}>
                <h2 className="drawer__header">
                    Filters
                    <a
                        onClick={() => {
                            this.onToggleDrawer(showDrawerMap);
                        }}
                        className="drawer__close-btn pull-right"
                        role="button"
                    >
                        <i className="material-icons">keyboard_arrow_left</i>
                    </a>
                </h2>
                <div className="drawer-content">
                    {hasLocation
                        ?
                        <MapControls
                            locationInputsList={locationInputsList}
                            inputsWithPossibleAnswers={inputsWithPossibleAnswers}
                            selectedDistributionQuestion={selectedDistributionQuestion}
                            selectedLocationQuestion={selectedLocationQuestion}
                        />
                        : ''}
                </div>
            </div>
        );
    }
}

//get app state and map to props
function mapStateToProps(state) {
    return {
        drawerReducer: state.drawerReducer,
        navigationReducer: state.navigationReducer,
        projectReducer: state.projectReducer,
        mapReducer: state.mapReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        toggleDrawerMap
    }, dispatch);
}

DrawerMap.propTypes = {
    showDrawerMap: React.PropTypes.bool,
    toggleDrawerMap: React.PropTypes.func,
    drawerReducer: React.PropTypes.object,
    navigationReducer: React.PropTypes.object,
    projectReducer: React.PropTypes.object,
    mapReducer: React.PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps)(DrawerMap);

