import React from 'react';
import { connect } from 'react-redux';
import {
    updateEntriesFilters,
    updateEntriesFilterByTitle,
    fetchEntriesTablePage,
    updateEntriesFilterByDate,
    updateEntriesFilterOrderBy,
    resetEntriesFiltersOnNavigation
} from 'actions';
import { bindActionCreators } from 'redux';
import { ButtonGroup, DropdownButton, MenuItem, Button, Modal } from 'react-bootstrap';
import { debounce } from 'lodash';
import fecha from 'fecha';
import queryString from 'query-string';
import DayPicker from 'react-day-picker';
import PARAMETERS from 'config/parameters';


class FilterEntriesControls extends React.Component {

    constructor(props) {
        super(props);

        this.handleFilterByTitleChange = this.handleFilterByTitleChange.bind(this);
        this.updateFiltersByTitle = debounce(this.updateFiltersByTitle.bind(this), 500);

        this.handleResetFilters = this.handleResetFilters.bind(this);

        this.handleShowStartDateModal = this.handleShowStartDateModal.bind(this);
        this.handleCloseStartDateModal = this.handleCloseStartDateModal.bind(this);
        this.handleShowEndDateModal = this.handleShowEndDateModal.bind(this);
        this.handleCloseEndDateModal = this.handleCloseEndDateModal.bind(this);

        this.handleStartDateClick = this.handleStartDateClick.bind(this);
        this.handleEndDateClick = this.handleEndDateClick.bind(this);

        this.onStartDateApplyClick = this.onStartDateApplyClick.bind(this);
        this.onEndDateApplyClick = this.onEndDateApplyClick.bind(this);

        this.handleOrderByChange = this.handleOrderByChange.bind(this);
        this.updateFiltersOrderBy = this.updateFiltersOrderBy.bind(this);

        const { projectStats, currentFormRef, projectDefinition, entryNewest, entryOldest } = props;

        this.dateFormat = 'DD MMM, YY';

        //if the project does not have any forms yet, set a default date
        if (projectStats.form_counts[currentFormRef] !== undefined) {
            this.hasForms = true;
            this.startDate = entryOldest;
            this.endDate = entryNewest;
            console.log('start and end date');
            console.log(this.startDate, this.endDate);

        } else {
            this.hasForms = false;
            this.startDate = new Date().toISOString();
            this.endDate = new Date().toISOString();
        }


        //hack to handle invalid dates (coming from the app)
        //but we should handle this server side as well to reduce the chances of happening
        let startDateInJS = new Date(this.startDate.replace(' ', 'T'));
        let endDateInJS = new Date(this.endDate.replace(' ', 'T'));
        if (Object.prototype.toString.call(startDateInJS) === '[object Date]') {
            //it is a date
            if (isNaN(startDateInJS.getTime())) {  //d.valueOf() could also work
                //date is not valid
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

        let startDateLabel = fecha.format(new Date(this.startDate.replace(' ', 'T')), this.dateFormat);
        let endDateLabel = fecha.format(new Date(this.endDate.replace(' ', 'T')), this.dateFormat);

        if (props.filters.isRestoringAfterEdit) {

            //todo restoring dates when looking at branch table?
            const filters = props.filters;

            const selectedStartDate = filters.startDate === '' ? this.startDate : filters.startDate;
            const selectedEndDate = filters.endDate === '' ? this.endDate : filters.endDate;

            startDateLabel = fecha.format(new Date(selectedStartDate.replace(' ', 'T')), this.dateFormat);
            endDateLabel = fecha.format(new Date(selectedEndDate.replace(' ', 'T')), this.dateFormat);

            //restore local state
            this.state = {
                showStartDateModal: false,
                showEndDateModal: false,
                selectedStartDate: new Date(selectedStartDate.replace(' ', 'T')),
                selectedEndDate: new Date(selectedEndDate.replace(' ', 'T')),
                isInvalidStartDate: false,
                isInvalidEndDate: false,
                selectedOrderBy: filters.selectedOrderBy,
                startDateLabel,
                endDateLabel,
                title: filters.filterByTitle
            };

        } else {
            //clean state
            this.state = {
                showStartDateModal: false,
                showEndDateModal: false,
                selectedStartDate: new Date(this.startDate.replace(' ', 'T')),
                selectedEndDate: new Date(this.endDate.replace(' ', 'T')),
                isInvalidStartDate: false,
                isInvalidEndDate: false,
                selectedOrderBy: PARAMETERS.ORDER_BY.NEWEST,
                startDateLabel,
                endDateLabel,
                title: ''
            };
        }
    }

    componentDidMount() {
        console.log('mounted filter entries controls');
    }

    componentWillReceiveProps(nextProps) {
        console.log('FilterEntriesControl updated with props');

        const shouldResetFilters = nextProps.filters.isPerformingFiltersReset;

        //if there was a navigation hierarchy change, reset filters
        if (shouldResetFilters) {
            //reset redux state
            this.props.resetEntriesFiltersOnNavigation();
            //reset local state
            this.resetEntriesFilters();
        }

        const currentQuery = nextProps.links.self.split('?')[1];
        const queryParams = queryString.parse(currentQuery);
        let startDateLabel = '';
        let endDateLabel = '';

        //if the user is NOT selecting dates
        if (!nextProps.filters.isUserInteractingWithFilters) {
            //are we looking at a branch table?
            if (nextProps.isBranchTable) {

                const currentBranchRef = queryParams.branch_ref;

                //if any branch, grab dates for time filter slider
                if (nextProps.projectStats.branch_counts[currentBranchRef] !== undefined) {

                    this.startDate = nextProps.entryOldest;
                    this.endDate = nextProps.entryNewest;
                } else {
                    this.hasForms = false;
                    this.startDate = new Date().toISOString();
                    this.endDate = new Date().toISOString();
                }
            } else {
                //hierarchy table
                const currentFormRef = queryParams.form_ref;

                //are there any hierarchy entries? If so grab dates for filter slider
                if (nextProps.projectStats.form_counts[currentFormRef] !== undefined) {
                    this.startDate = nextProps.entryOldest;
                    this.endDate = nextProps.entryNewest;
                } else {
                    this.hasForms = false;
                    this.startDate = new Date().toISOString();
                    this.endDate = new Date().toISOString();
                }

            }
            startDateLabel = fecha.format(new Date(this.startDate.replace(' ', 'T')), this.dateFormat);
            endDateLabel = fecha.format(new Date(this.endDate.replace(' ', 'T')), this.dateFormat);

            //set date pickers in current state
            this.setState(
                {
                    selectedStartDate: new Date(this.startDate.replace(' ', 'T')),
                    selectedEndDate: new Date(this.endDate.replace(' ', 'T')),
                    startDateLabel,
                    endDateLabel
                }
            );
        }
    }


    resetEntriesFilters() {

        const startDateLabel = fecha.format(new Date(this.startDate.replace(' ', 'T')), this.dateFormat);
        const endDateLabel = fecha.format(new Date(this.endDate.replace(' ', 'T')), this.dateFormat);

        //reset local state
        this.setState({
            showStartDateModal: false,
            showEndDateModal: false,
            selectedStartDate: new Date(this.startDate.replace(' ', 'T')),
            selectedEndDate: new Date(this.endDate.replace(' ', 'T')),
            isInvalidStartDate: false,
            isInvalidEndDate: false,
            selectedOrderBy: PARAMETERS.ORDER_BY.NEWEST,
            startDateLabel,
            endDateLabel,
            title: ''
        });
    }

    componentWillUnmount() {
        this.updateFiltersByTitle.cancel();
    }

    handleCloseStartDateModal() {
        this.setState({ showStartDateModal: false });
    }

    handleShowStartDateModal() {
        this.setState({ showStartDateModal: true });
    }

    handleCloseEndDateModal() {
        this.setState({ showEndDateModal: false });
    }

    handleShowEndDateModal() {
        this.setState({ showEndDateModal: true });
    }

    handleFilterByTitleChange(e) {
        const title = e.target.value;

        this.setState({
                title
            }, () => {
                if (title.length === 0) {
                    //fetch entries filtered by title
                    this.updateFiltersByTitle('');
                }

                if (title.length > 2) {
                    //fetch entries filtered by title
                    this.updateFiltersByTitle(title);
                }
            }
        );
    }

    handleStartDateClick(day, modifiers = {}) {
        if (modifiers.disabled) {
            return;
        }

        //if the start date is AFTER the current selected end date, show inline error
        if (day.getTime() > this.state.selectedEndDate.getTime()) {
            this.setState({
                isInvalidStartDate: true
            });
            return;
        }

        this.setState({
            selectedStartDate: modifiers.selected ? undefined : day,
            isInvalidStartDate: false
        });
    }

    handleEndDateClick(day, modifiers = {}) {
        if (modifiers.disabled) {
            return;
        }

        //if the end date is BEFORE the current selected start date, show inline error
        if (day.getTime() < this.state.selectedStartDate.getTime()) {
            this.setState({
                isInvalidEndDate: true
            });
            return;
        }

        //todo check if this validation is done server side as well
        this.setState({
            selectedEndDate: modifiers.selected ? undefined : day,
            isInvalidEndDate: false
        });
    }

    onStartDateApplyClick() {
        if (this.state.selectedStartDate !== undefined) {
            this.setState({
                showStartDateModal: false,
                startDateLabel: fecha.format(this.state.selectedStartDate, this.dateFormat)
            }, () => {
                this.updateFiltersByDate();
            });
        }
    }

    onEndDateApplyClick() {
        if (this.state.selectedEndDate !== undefined) {
            this.setState({
                showEndDateModal: false,
                endDateLabel: fecha.format(this.state.selectedEndDate, this.dateFormat)
            }, () => {
                this.updateFiltersByDate();
            });
        }
    }

    handleOrderByChange(event) {
        console.log(event);

        this.setState({
            selectedOrderBy: event
        }, () => {
            this.updateFiltersOrderBy();
        });
    }

    updateFiltersOrderBy() {

        const { projectSlug, projectExtra, currentFormRef, links, isBranchTable } = this.props;
        const currentQuery = links.self.split('?')[1];
        const baseUrl = links.self.split('?')[0];
        const queryParams = queryString.parse(currentQuery);
        const currentBranchRef = isBranchTable ? queryParams.branch_ref : null;

        switch (this.state.selectedOrderBy) {
            case PARAMETERS.ORDER_BY.NEWEST:
                queryParams.sort_by = 'created_at';
                queryParams.sort_order = 'DESC';
                break;

            case PARAMETERS.ORDER_BY.OLDEST:
                queryParams.sort_by = 'created_at';
                queryParams.sort_order = 'ASC';
                break;

            case PARAMETERS.ORDER_BY.AZ:
                queryParams.sort_by = 'title';
                queryParams.sort_order = 'ASC';
                break;

            case PARAMETERS.ORDER_BY.ZA:
                queryParams.sort_by = 'title';
                queryParams.sort_order = 'DESC';
                break;

            default:
            //do nothing
        }

        //reset pagination
        queryParams.page = 1;

        const requestUrl = baseUrl + '?' + queryString.stringify(queryParams);

        //save redux state
        this.props.updateEntriesFilterOrderBy(this.state.selectedOrderBy, queryParams.sort_by, queryParams.sort_order);
        //get entries
        this.props.fetchEntriesTablePage(requestUrl, projectSlug, currentFormRef, projectExtra, null, currentBranchRef);
    }

    updateFiltersByDate() {

        const { projectSlug, projectExtra, currentFormRef, links, isBranchTable } = this.props;
        const currentQuery = links.self.split('?')[1];
        const baseUrl = links.self.split('?')[0];
        const queryParams = queryString.parse(currentQuery);
        const currentBranchRef = isBranchTable ? queryParams.branch_ref : null;

        queryParams.filter_by = PARAMETERS.DEFAULT_ORDERING_COLUMN;
        queryParams.filter_from = this.state.selectedStartDate.toISOString();
        queryParams.filter_to = this.state.selectedEndDate.toISOString();

        //reset pagination
        queryParams.page = 1;

        const requestUrl = baseUrl + '?' + queryString.stringify(queryParams);
        console.log(requestUrl);
        this.props.updateEntriesFilterByDate(queryParams.filter_from, queryParams.filter_to);
        this.props.fetchEntriesTablePage(requestUrl, projectSlug, currentFormRef, projectExtra, null, currentBranchRef);
    }

    updateFiltersByTitle(title) {

        const { projectSlug, projectExtra, currentFormRef, links, isBranchTable } = this.props;
        const currentQuery = links.self.split('?')[1];
        const baseUrl = links.self.split('?')[0];
        const queryParams = queryString.parse(currentQuery);
        const currentBranchRef = isBranchTable ? queryParams.branch_ref : null;

        //set sort_by and sort_order
        queryParams.title = title;

        //reset pagination
        queryParams.page = 1;

        const requestUrl = baseUrl + '?' + queryString.stringify(queryParams);

        this.props.updateEntriesFilterByTitle(title);
        this.props.fetchEntriesTablePage(requestUrl, projectSlug, currentFormRef, projectExtra, null, currentBranchRef);
    }

    handleResetFilters() {

        const { projectSlug, projectExtra, currentFormRef, links, isBranchTable } = this.props;
        const currentQuery = links.self.split('?')[1];
        const baseUrl = links.self.split('?')[0];
        const queryParams = queryString.parse(currentQuery);
        const startDateLabel = fecha.format(new Date(this.startDate.replace(' ', 'T')), this.dateFormat);
        const endDateLabel = fecha.format(new Date(this.endDate.replace(' ', 'T')), this.dateFormat);
        const currentBranchRef = isBranchTable ? queryParams.branch_ref : null;

        //reset title
        queryParams.title = '';

        //reset start date/end date
        queryParams.filter_from = '';
        queryParams.filter_to = '';
        queryParams.filter_by = '';

        //reset order by
        queryParams.sort_by = PARAMETERS.DEFAULT_ORDERING_COLUMN;
        queryParams.sort_order = PARAMETERS.DEFAULT_ORDERING;

        //reset pagination
        queryParams.page = 1;

        const requestUrl = baseUrl + '?' + queryString.stringify(queryParams);

        //reset redux state
        this.props.updateEntriesFilters({
            sortBy: queryParams.sort_by,
            sortOrder: queryParams.sort_order,
            filterByTitle: queryParams.title,
            startDate: queryParams.filter_from,
            endDate: queryParams.filter_to
        });

        //reset local state
        this.setState({
            selectedStartDate: new Date(this.startDate.replace(' ', 'T')),
            selectedEndDate: new Date(this.endDate.replace(' ', 'T')),
            selectedOrderBy: PARAMETERS.ORDER_BY.NEWEST,
            startDateLabel,
            endDateLabel,
            title: ''
        }, () => {
            this.props.fetchEntriesTablePage(requestUrl, projectSlug, currentFormRef, projectExtra, null, currentBranchRef);
        });
    }

    render() {

        if (!this.hasForms) {
            return null;
        }

        console.log('Filter entries controls rendered -> ***********************************');

        const startDateInJS = new Date(this.startDate.replace(' ', 'T'));
        const endDateInJS = new Date(this.endDate.replace(' ', 'T'));

        return (
            <section className="row filter-entries-controls">
                <div className="col-xs-6 col-sm-5 col-md-5">
                    <div className="form-group filter-entries-controls__filter-by_title">
                        <input
                            type="text"
                            className="form-control"
                            id="filter-entries-by-title"
                            placeholder="Filter by title"
                            value={this.state.title}
                            onChange={this.handleFilterByTitleChange}
                        />
                    </div>
                </div>
                <div className="col-xs-6 col-sm-7 col-md-7 text-right">
                    <ButtonGroup className="filter-entries-controls__extra" bsSize="small">
                        <Button
                            className="hidden-xs extra__from"
                            onClick={this.handleShowStartDateModal}
                        >
                            From: {this.state.startDateLabel}
                        </Button>
                        <Button
                            className="hidden-xs extra__to"
                            onClick={this.handleShowEndDateModal}
                        >
                            To: {this.state.endDateLabel}
                        </Button>
                        <DropdownButton
                            className="extra__order"
                            title={this.state.selectedOrderBy}
                            id="order-by__dropdown"
                            bsSize="small"
                            pullRight
                        >
                            <MenuItem
                                eventKey={PARAMETERS.ORDER_BY.NEWEST}
                                onSelect={(event) => {
                                    this.handleOrderByChange(event);
                                }}
                            >
                                {PARAMETERS.ORDER_BY.NEWEST}
                            </MenuItem>
                            <MenuItem
                                eventKey={PARAMETERS.ORDER_BY.OLDEST}
                                onSelect={(event) => {
                                    this.handleOrderByChange(event);
                                }}
                            >
                                {PARAMETERS.ORDER_BY.OLDEST}
                            </MenuItem>
                            <MenuItem
                                eventKey={PARAMETERS.ORDER_BY.AZ}
                                onSelect={(event) => {
                                    this.handleOrderByChange(event);
                                }}
                            >
                                {PARAMETERS.ORDER_BY.AZ}
                            </MenuItem>
                            <MenuItem
                                eventKey={PARAMETERS.ORDER_BY.ZA}
                                onSelect={(event) => {
                                    this.handleOrderByChange(event);
                                }}
                            >
                                {PARAMETERS.ORDER_BY.ZA}
                            </MenuItem>
                        </DropdownButton>
                        <Button
                            className="extra__clear-all"
                            onClick={this.handleResetFilters}
                        >
                            X
                        </Button>

                    </ButtonGroup>
                </div>
                <div className="col-xs-12 visible-xs text-right">
                    <ButtonGroup bsSize="small" className="filter-entries-controls__extra--xs">
                        <Button
                            className="extra__from"
                            onClick={this.handleShowStartDateModal}
                        >
                            From: {this.state.startDateLabel}
                        </Button>
                        <Button
                            className="extra__to"
                            onClick={this.handleShowEndDateModal}
                        >
                            To: {this.state.endDateLabel}
                        </Button>
                    </ButtonGroup>
                </div>

                <Modal
                    dialogClassName="start-date-modal"
                    show={this.state.showStartDateModal}
                    onHide={this.handleCloseStartDateModal}
                    bsSize="small"
                >
                    <Modal.Header closeButton>
                        <span className="start-date__entry-title text-center">Pick start date</span>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="text-center">
                            <DayPicker
                                selectedDays={this.state.selectedStartDate}
                                onDayClick={this.handleStartDateClick}
                                initialMonth={this.state.selectedStartDate}

                                disabledDays={[
                                    {
                                        after: endDateInJS,
                                        before: startDateInJS
                                    }
                                ]}
                            />
                        </div>
                        {this.state.isInvalidStartDate
                            ? <p
                                className="text-danger text-center"
                            >Cannot select this day
                            </p>
                            : <p />
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.onStartDateApplyClick}>Apply</Button>
                    </Modal.Footer>
                </Modal>
                <Modal
                    dialogClassName="end-date-modal"
                    show={this.state.showEndDateModal}
                    onHide={this.handleCloseEndDateModal}
                    bsSize="small"
                >
                    <Modal.Header className="text-center" closeButton>
                        <span className="end-date__entry-title">Pick end date</span>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="text-center">
                            <DayPicker
                                selectedDays={this.state.selectedEndDate}
                                onDayClick={this.handleEndDateClick}
                                initialMonth={this.state.selectedEndDate}

                                disabledDays={[
                                    {
                                        after: endDateInJS,
                                        before: startDateInJS
                                    }
                                ]}
                            />
                        </div>
                        {this.state.isInvalidEndDate
                            ? <p
                                className="text-danger text-center"
                            >Cannot select this day
                            </p>
                            : <p />
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.onEndDateApplyClick}>Apply</Button>
                    </Modal.Footer>
                </Modal>
            </section>
        );
    }
}

//get app state and map to props
function mapStateToProps(state) {
    return {
        currentFormRef: state.navigationReducer.currentFormRef,
        projectExtra: state.projectReducer.projectExtra,
        projectDefinition: state.projectReducer.projectDefinition,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        links: state.tableReducer.links,
        filters: state.filterEntriesReducer,
        projectStats: state.drawerReducer.projectStats,
        isBranchTable: state.tableReducer.isBranchTable,
        entryNewest: state.tableReducer.pagination.newest,
        entryOldest: state.tableReducer.pagination.oldest
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        resetEntriesFiltersOnNavigation,
        updateEntriesFilters,
        updateEntriesFilterByTitle,
        updateEntriesFilterByDate,
        updateEntriesFilterOrderBy,
        fetchEntriesTablePage
    }, dispatch);
}

FilterEntriesControls.propTypes = {
    filters: React.PropTypes.object,
    projectStats: React.PropTypes.object,
    projectExtra: React.PropTypes.object,
    projectDefinition: React.PropTypes.object,
    links: React.PropTypes.object,
    currentFormRef: React.PropTypes.string,
    projectSlug: React.PropTypes.string,
    entryOldest: React.PropTypes.string,
    entryNewest: React.PropTypes.string,
    updateEntriesFilterByTitle: React.PropTypes.func,
    fetchEntriesTablePage: React.PropTypes.func,
    updateEntriesFilterByDate: React.PropTypes.func,
    updateEntriesFilterOrderBy: React.PropTypes.func,
    updateEntriesFilters: React.PropTypes.func,
    resetEntriesFiltersOnNavigation: React.PropTypes.func,
    isBranchTable: React.PropTypes.bool
};

export default connect(mapStateToProps, mapDispatchToProps)(FilterEntriesControls);
