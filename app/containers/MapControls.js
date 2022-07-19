import React from 'react';
import { connect } from 'react-redux';
import {
    filterLocationsByDates,
    showDistributionPieCharts,
    resetTimelineFilter,
    resetDistributionFilter,
    fetchEntriesLocations
} from 'actions';
import { bindActionCreators } from 'redux';

import fecha from 'fecha';
import queryString from 'query-string';
import Slider from 'rc-slider/lib/Slider';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import PARAMETERS from 'config/parameters';
import mapUtils from 'utils/mapUtils';
import helpers from 'utils/helpers';
import DistributionChart from 'containers/DistributionChart';
import localstorage from '../utils/localstorage';


class MapControls extends React.Component {

    constructor(props) {
        super(props);


        const { projectStats, projectDefinition, currentFormRef } = props;
        const currentFormStats = projectStats.form_counts[currentFormRef];
        const href = window.location.href;
        const shouldRestore = helpers.getParameterByName('restore', href);
        const shouldRestoreParams = shouldRestore ? localstorage.getRestoreParams() : null;

        //total_entries is the total across all forms
        this.hasEntries = projectStats.total_entries > 0 && currentFormStats;

        //check if there are entries and the current form ha entries
        if (this.hasEntries) {

            this.startDate = projectStats.form_counts[currentFormRef].first_entry_created;
            this.endDate = projectStats.form_counts[currentFormRef].last_entry_created;

            //IMPORTANT, add the T instead of the space otherwise it will crash is SAFARI (Apple I hate you)
            //'2016-07-05T17:08:08' works
            //'2016-07-05 17:08:08' fail!!!!!!!!!
            let startDateInJS = new Date(this.startDate.replace(' ', 'T'));
            let endDateInJS = new Date(this.endDate.replace(' ', 'T'));

            //hack to handle invalid dates (coming from the app)
            //but we should handle this server side as well to reduce the chances of happening
            if (Object.prototype.toString.call(startDateInJS) === '[object Date]') {
                //it is a date
                if (isNaN(startDateInJS.getTime())) {  //d.valueOf() could also work
                    //date is not valid
                    //this.startDate = '1970-01-01T00:00:00';
                    this.startDate = projectDefinition.project.created_at;
                    startDateInJS = new Date(this.startDate.replace(' ', 'T'));
                }
            } else {
                //not a date
                console.log('Start date not a date?');
            }

            if (Object.prototype.toString.call(endDateInJS) === '[object Date]') {
                //it is a date
                if (isNaN(endDateInJS.getTime())) {  //d.valueOf() could also work
                    //date is not valid
                    this.endDate = new Date().toISOString();
                    endDateInJS = new Date(this.endDate.replace(' ', 'T'));
                }
            } else {
                //not a date
                console.log('End date not a date?');
            }


            const datesRange = mapUtils.getDatesRange(this.startDate.replace(' ', 'T'), this.endDate.replace(' ', 'T'));

            if (shouldRestoreParams) {
                if (shouldRestoreParams.mapControls) {
                    const restoredStartDate = shouldRestoreParams.mapControls.sliderStartDate || this.startDate;
                    const restoredEndDate = shouldRestoreParams.mapControls.sliderEndDate || this.endDate;

                    const restoredStartDateInJS = new Date(restoredStartDate.replace(' ', 'T'));
                    const restoredEndDateInJS = new Date(restoredEndDate.replace(' ', 'T'));
                    //set date slider labels back to restored state
                    this.state = {
                        fromLabel: fecha.format(restoredStartDateInJS, 'DD MMM, YY'), //i.e '20th Nov, 2015'
                        toLabel: fecha.format(restoredEndDateInJS, 'DD MMM, YY'),
                        datesRange,
                        sliderValue: {
                            start: shouldRestoreParams.mapControls.sliderStartValue || 0,
                            end: shouldRestoreParams.mapControls.sliderEndValue || (datesRange.length - 1)
                        }
                    };
                } else {
                    //set date slider labels to default (fresh start)
                    this.state = {
                        fromLabel: fecha.format(startDateInJS, 'DD MMM, YY'), //i.e '20th Nov, 2015'
                        toLabel: fecha.format(endDateInJS, 'DD MMM, YY'),
                        datesRange,
                        sliderValue: {
                            start: 0,
                            end: datesRange.length - 1
                        }
                    };
                }
            } else {
                //set date slider labels to default (fresh start)
                this.state = {
                    fromLabel: fecha.format(startDateInJS, 'DD MMM, YY'), //i.e '20th Nov, 2015'
                    toLabel: fecha.format(endDateInJS, 'DD MMM, YY'),
                    datesRange,
                    sliderValue: {
                        start: 0,
                        end: datesRange.length - 1
                    }
                };
            }

            this.datesRange = datesRange;
            //disable timeslider when start date and end date are the same
            this.isTimesliderDisabled = startDateInJS.getUTCDate() === endDateInJS.getUTCDate();
        }
    }

    componentDidMount() {
        console.log('mounted map controls');
    }

    componentDidUpdate() {
        console.log('updated map controls');
    }

    //generate the dropdown with the list of forms
    //we get the selected one passing the form ref binding to onSelect()
    getDistributionQuestions(inputs) {

        const { projectExtra } = this.props;

        return inputs.map((inputRef) => {

            const question = projectExtra.inputs[inputRef].data.question;

            return (
                <MenuItem
                    key={inputRef}
                    eventKey={{ inputRef, question }}
                    onSelect={(event) => {
                        this.handleDistributionQuestionChange(event);
                    }}
                >
                    {question}
                </MenuItem>
            );
        });
    }

    getLocationQuestions(inputs) {
        return inputs.map((input) => {

            const inputRef = input.input_ref;
            const branchRef = input.branch_ref || '';
            const question = input.question;

            return (
                <MenuItem
                    key={inputRef}
                    eventKey={{ inputRef, question, branchRef }}
                    onSelect={(event) => {
                        this.handleLocationQuestionChange(event);
                    }}
                >
                    {question}
                </MenuItem>
            );
        });
    }

    handleLocationQuestionChange(input) {
        console.log(input);

        const formRef = this.props.currentFormRef;
        const { projectSlug } = this.props;
        const entriesLocationsQuery = '?' + queryString.stringify({
            form_ref: formRef,
            input_ref: input.inputRef,
            branch_ref: input.branchRef
        });
        const entriesLocationsEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_ENTRIES_LOCATIONS_ENDPOINT + projectSlug + entriesLocationsQuery;

        this.props.fetchEntriesLocations({
            selectedLocationQuestion: {
                input_ref: input.inputRef,
                branch_ref: input.branchRef,
                question: input.question
            },
            entriesLocationsEndpoint
        });

        //reset distribution when changing location question
        this.props.resetDistributionFilter();
    }

    handleDistributionQuestionChange(input) {
        const pieChartParams = {};
        const { projectExtra, currentFormRef, selectedLocationQuestion } = this.props;
        const multipleChoiceInputs = projectExtra.forms[currentFormRef].lists.multiple_choice_inputs;
        pieChartParams.inputRef = input.inputRef;
        pieChartParams.question = input.question;

        //are we rendering branch entries?
        if (!(selectedLocationQuestion.branch_ref === null || selectedLocationQuestion.branch_ref === '')) {
            //user picked a branch question, get list of multiple chioice inputs
            pieChartParams.possibleAnswersHashMap = multipleChoiceInputs.branch[selectedLocationQuestion.branch_ref][input.inputRef].possible_answers;
        } else {
            pieChartParams.possibleAnswersHashMap = multipleChoiceInputs.form[input.inputRef].possible_answers;
        }

        this.props.showDistributionPieCharts({ selectedDistributionQuestion: input, pieChartParams });
    }

    /*The date slider will start from 0 to the length of datesRange array,
     * which contains a day per each element,
     * starting with the first entry date up to the last entry date*/
    handleonSliderAfterChange(range) {

        console.log(range);
        const startDate = this.state.datesRange[range[0]];
        const endDate = this.state.datesRange[range[1]];
        const sliderStartValue = this.state.sliderValue.start;
        const sliderEndValue = this.state.sliderValue.end;

        //change labels accordingly
        this.setState({
            fromLabel: fecha.format(startDate, 'DD MMM, YY'), //i.e '20th Nov, 2015'
            toLabel: fecha.format(endDate, 'DD MMM, YY')
        });

        //call Drawer function
        this.props.filterLocationsByDates(startDate, endDate, sliderStartValue, sliderEndValue);
    }

    //update slider handles while dragging by updating state
    handleonSliderChange(range) {
        //change values accordingly
        console.log(range);
        this.setState({
            sliderValue: {
                start: range[0],
                end: range[1]
            }
        });
    }

    //Reset timeline slider to default values and render default map
    handleResetFilter(which) {

        switch (which) {
            case PARAMETERS.FILTER_DISTRIBUTION:
                //reset distribution filter
                this.props.resetDistributionFilter();
                break;
            case PARAMETERS.FILTER_TIMELINE: {
                //reset timeline filter
                this.props.resetTimelineFilter();
                //reset slider state
                this.setState({
                    ...this.state,
                    fromLabel: fecha.format(new Date(this.startDate), 'Do MMM, YYYY'), //i.e '20th Nov, 2015'
                    toLabel: fecha.format(new Date(this.endDate), 'Do MMM, YYYY'),
                    sliderValue: {
                        start: 0,
                        end: this.datesRange.length - 1
                    }
                }, () => {
                    //get all locations
                    this.props.filterLocationsByDates(this.startDate, this.endDate, 0, this.datesRange.length - 1);
                });
            }
                break;
            default:
            //do nothing
        }
    }

    render() {

        let { inputsWithPossibleAnswers } = this.props;
        const { locationInputsList, selectedLocationQuestion, currentFormRef, projectExtra } = this.props;
        const selectedDistributionQuestion = this.props.selectedDistributionQuestion === null ? PARAMETERS.FILTER_DISTRIBUTION_DEFAULT_OPTION : this.props.selectedDistributionQuestion.question;
        const hasDistributionQuestions = inputsWithPossibleAnswers.length > 0;

        const selectedLocationQuestionTitle = helpers.textTruncate(selectedLocationQuestion.question || selectedLocationQuestion.value, 20);
        const selectedDistributionQuestionTitle = helpers.textTruncate(selectedDistributionQuestion, 20);

        //are we rendering branch entries?
        if (!(selectedLocationQuestion.branch_ref === null || selectedLocationQuestion.branch_ref === '')) {
            //user picked a branch question, get list of multiple chioice inputs
            try {
                inputsWithPossibleAnswers = projectExtra.forms[currentFormRef].lists.multiple_choice_inputs.branch[selectedLocationQuestion.branch_ref].order;
            } catch (e) {
                //If we do not have ay entry yet for that branch, 'order' is undefined
                console.log(e);
                inputsWithPossibleAnswers = [];
            }
        }

        return (
            <aside className="map-controls">

                <section className="panel panel-default map-controls__location">
                    <div className="panel-heading">
                        <h3 className="panel-title">Location</h3>
                    </div>
                    <div className="panel-body">
                        <div id="location-questions" className="form-group">
                            <DropdownButton
                                title={selectedLocationQuestionTitle}
                                key="questions-dropdown"
                                id="location-questions-dropdown"
                            >
                                {this.getLocationQuestions(locationInputsList)}
                            </DropdownButton>
                        </div>
                    </div>
                </section>


                {this.hasEntries ?

                    <div>
                        <section className="panel panel-default map-controls__timeline">
                            <div className="panel-heading">
                                <h3 className="panel-title">
                                    Timeline
                                    <button
                                        className="reset-filter btn btn-action btn-xs pull-right"
                                        onClick={() => {
                                            this.handleResetFilter(PARAMETERS.FILTER_TIMELINE);
                                        }}
                                        disabled={this.isTimesliderDisabled}
                                    >
                                        Reset
                                    </button>
                                </h3>

                            </div>
                            <div className="panel-body">
                                <p className="date-filter-labels text-center">
                                    <span className="from text-capitalize">{this.state.fromLabel}</span>
                                    <span> to </span>
                                    <span className="to text-capitalize">{this.state.toLabel}</span>
                                </p>

                                <Slider
                                    className="date-filter-slider"
                                    value={[this.state.sliderValue.start, this.state.sliderValue.end]}
                                    min={0}
                                    max={this.state.datesRange.length - 1}
                                    step={1}
                                    range
                                    allowCross={false}
                                    onAfterChange={(e) => {
                                        this.handleonSliderAfterChange(e);
                                    }}
                                    onChange={(e) => {
                                        this.handleonSliderChange(e);
                                    }}
                                    disabled={this.isTimesliderDisabled}
                                />

                            </div>
                        </section>

                        <section className="panel panel-default map-controls__distribution">
                            <div className="panel-heading">
                                <h3 className="panel-title">
                                    Distribution
                                    <button
                                        className="reset-filter btn btn-action btn-xs pull-right"
                                        onClick={() => {
                                            this.handleResetFilter(PARAMETERS.FILTER_DISTRIBUTION);
                                        }}
                                        disabled={!hasDistributionQuestions}
                                    >
                                        Reset
                                    </button>
                                </h3>
                            </div>
                            <div className="panel-body">
                                <div id="distribution-questions" className="form-group">
                                    <DropdownButton
                                        title={selectedDistributionQuestionTitle}
                                        key="questions-dropdown"
                                        id="distribution-questions-dropdown"
                                        disabled={!hasDistributionQuestions}
                                    >
                                        {this.getDistributionQuestions(inputsWithPossibleAnswers)}
                                    </DropdownButton>
                                </div>
                            </div>
                            <DistributionChart />
                        </section>
                    </div>
                    : null}
            </aside>
        );
    }
}

//get app state and map to props
function mapStateToProps(state) {
    return {
        projectStats: state.drawerReducer.projectStats,
        currentFormRef: state.navigationReducer.currentFormRef,
        projectExtra: state.projectReducer.projectExtra,
        projectDefinition: state.projectReducer.projectDefinition,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        selectedLocationQuestion: state.mapReducer.selectedLocationQuestion
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        filterLocationsByDates,
        showDistributionPieCharts,
        resetTimelineFilter,
        resetDistributionFilter,
        fetchEntriesLocations
    }, dispatch);
}

MapControls.propTypes = {
    projectStats: React.PropTypes.object,
    currentFormRef: React.PropTypes.string,
    fetchEntriesLocations: React.PropTypes.func,
    projectSlug: React.PropTypes.string,
    filterLocationsByDates: React.PropTypes.func,
    resetDistributionFilter: React.PropTypes.func,
    resetTimelineFilter: React.PropTypes.func,
    inputsWithPossibleAnswers: React.PropTypes.array,
    selectedLocationQuestion: React.PropTypes.object,
    selectedDistributionQuestion: React.PropTypes.object,
    locationInputsList: React.PropTypes.array,
    showDistributionPieCharts: React.PropTypes.func,
    projectExtra: React.PropTypes.object,
    projectDefinition: React.PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps)(MapControls);
