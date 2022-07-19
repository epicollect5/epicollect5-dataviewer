import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import Cookies from 'universal-cookie';
import merge from 'lodash/merge';
import ObjectValuesPolyfill from 'object.values';
import DayPicker from 'react-day-picker';
import {
    toggleDrawerDownload,
    toggleModalPrepareDownload,
    setActiveMapping,
    setActiveTimeframe,
    setActiveFormat
} from 'actions';
import { bindActionCreators } from 'redux';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Radio from 'react-bootstrap/lib/Radio';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import PARAMETERS from 'config/parameters';
import helpers from '../utils/helpers';


class DrawerDownload extends React.Component {

    constructor(props) {
        super(props);

        this.onToggleDrawer = this.onToggleDrawer.bind(this);
        this.handleSelectedMappingChange = this.handleSelectedMappingChange.bind(this);
        this.handleSelectedTimeframeChange = this.handleSelectedTimeframeChange.bind(this);
        this.handleDownloadMedia = this.handleDownloadMedia.bind(this);
        this.handleShowPickDatesModal = this.handleShowPickDatesModal.bind(this);
        this.handleClosePickDatesModal = this.handleClosePickDatesModal.bind(this);
        this.handleStartDateClick = this.handleStartDateClick.bind(this);
        this.handleEndDateClick = this.handleEndDateClick.bind(this);
        this.onPickDatesApplyClick = this.onPickDatesApplyClick.bind(this);
        this.handleDownloadDataFile = this.handleDownloadDataFile.bind(this);
        this.handleDownloadEntries = this.handleDownloadEntries.bind(this);

        const { projectStats, currentFormRef } = props;

        //if the project does not have any forms yet
        if (projectStats.form_counts[currentFormRef] !== undefined) {
            this.hasForms = true;
            this.startDate = projectStats.form_counts[currentFormRef].first_entry_created;
            this.endDate = projectStats.form_counts[currentFormRef].last_entry_created;

            console.log('start and end date');
            console.log(this.startDate, this.endDate);

        } else {
            this.hasForms = false;
            this.startDate = new Date().toISOString();
            this.endDate = new Date().toISOString();
        }

        this.state = {
            showPickDatesModal: false,
            selectedStartDate: new Date(this.startDate),
            selectedEndDate: new Date(this.endDate),
            isInvalidStartDate: false,
            isInvalidEndDate: false
        };
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

        console.log(this.state.selectedStartDate);

        this.setState({
            selectedEndDate: modifiers.selected ? undefined : day,
            isInvalidEndDate: false
        });
    }

    onPickDatesApplyClick() {
        this.setState({
            showPickDatesModal: false
        });
    }

    handleShowPickDatesModal() {
        this.setState({ showPickDatesModal: true });
    }

    handleClosePickDatesModal() {
        this.setState({ showPickDatesModal: false });
    }

    onToggleDrawer(showDrawerDownload) {
        this.props.toggleDrawerDownload(showDrawerDownload);
    }

    handleSelectedMappingChange(selectedMapping) {
        //change selected mapping dispatching action
        this.props.setActiveMapping(selectedMapping);
    }

    handleSelectedTimeframeChange(selectedTimeframe) {
        //change selected mapping dispatching action
        this.props.setActiveTimeframe(selectedTimeframe);

        if (selectedTimeframe === PARAMETERS.TIMEFRAME.CUSTOM) {
            this.handleShowPickDatesModal();
        }
    }

    handleDownloadDataFile(endpoint) {

        const { showModalPrepareDownload } = this.props;
        //show loader
        this.props.toggleModalPrepareDownload(showModalPrepareDownload);

        console.log(endpoint);
        console.log('overlay open');

        // window.setTimeout(() => {
        //
        //     axios({
        //         url: endpoint,
        //         method: 'GET',
        //         responseType: 'blob'//important
        //     }).then((response) => {
        //         const url = window.URL.createObjectURL(new Blob([response.data]));
        //         const link = document.createElement('a');
        //         link.href = url;
        //         link.setAttribute('download', projectSlug + '.zip');
        //         document.body.appendChild(link);
        //         link.click();
        //         console.log('overlay closed');
        //         //this.props.toggleModalPrepareDownload(showModalPrepareDownload);
        //     });
        //
        //
        //     // const newwindow = window.open(url, '_self');
        //     // newwindow.focus();
        //     // newwindow.onblur = () => {
        //     //     newwindow.close();
        //     //     //hide overlay
        //     //     //todo
        //     //     console.log('overlay closed');
        //     // };
        // }, 2000);

        //show overlay
        //todo
    }

    handleSelectedFileFormatChange(selectedFormat) {
        //chnahe selected format
        this.props.setActiveFormat(selectedFormat);
    }

    getMappingItems(mappings) {
        const iterator = Object.values || ObjectValuesPolyfill;
        return iterator(mappings).map((mapping, index) => {
            return (
                <MenuItem
                    key={index}
                    eventKey={mapping}
                    onSelect={(event) => {
                        this.handleSelectedMappingChange(event);
                    }}
                >
                    {mapping.name}
                </MenuItem>
            );
        });
    }

    getTimeframeItems() {
        const timeframeItems = PARAMETERS.TIMEFRAME;
        const iterator = Object.values || ObjectValuesPolyfill;
        return iterator(timeframeItems).map((timeframe, index) => {
            return (
                <MenuItem
                    key={index}
                    eventKey={timeframe}
                    onSelect={(event) => {
                        this.handleSelectedTimeframeChange(event);
                    }}
                >
                    {timeframe}
                </MenuItem>
            );
        });
    }

    getDownloadUrl() {

        const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_DOWNLOAD_ENDPOINT;
        const { projectSlug, activeMapping, activeTimeframe, activeFormat } = this.props;
        const params = {
            map_index: activeMapping.map_index,
            format: activeFormat
        };

        const timeframeParams = helpers.getTimeframeParams(activeTimeframe, this.state);

        const query = '?' + queryString.stringify(merge(params, timeframeParams));

        console.log('query is -> ', query);

        return endpoint + projectSlug + query;
    }

    handleDownloadMedia() {

        const { showModalPrepareDownload } = this.props;
        //generate timestamp
        const requestTimestamp = new Date().getTime();
        const cookies = new Cookies();
        const mediaCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;
        const params = {};
        const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_DOWNLOAD_MEDIA_ENDPOINT;
        const { projectSlug } = this.props;

        params[mediaCookie] = requestTimestamp;

        const query = '?' + queryString.stringify(params);

        //show loader
        this.props.toggleModalPrepareDownload(showModalPrepareDownload);

        //start pooling for the cookie to get back
        const intervalID = window.setInterval(() => {
            console.log(mediaCookie);
            console.log(cookies.get(mediaCookie));
            console.log(PARAMETERS.IS_LOCALHOST);

            //if the cookie is set and the timestamp matches, hide modal and stop interval
            if (cookies.get(mediaCookie) === requestTimestamp.toString() || PARAMETERS.IS_LOCALHOST === 1) {
                this.props.toggleModalPrepareDownload(showModalPrepareDownload);
                clearInterval(intervalID);
            }
        }, 250);

        //request download endpoint
        document.location.href = endpoint + projectSlug + query;
    }

    handleDownloadEntries(endpoint) {

        const { showModalPrepareDownload } = this.props;
        //generate timestamp
        const requestTimestamp = new Date().getTime();
        const cookies = new Cookies();
        const requestCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;
        const params = {};
        const delay = 3000;

        params[requestCookie] = requestTimestamp;

        const query = '&' + queryString.stringify(params);

        //show loader
        this.props.toggleModalPrepareDownload(showModalPrepareDownload);

        //start pooling for the cookie to get back
        const intervalID = window.setInterval(() => {
            //if the cookie is set and the timestamp matches, hide modal and stop interval
            if (cookies.get(requestCookie) === requestTimestamp.toString()) {
                this.props.toggleModalPrepareDownload(showModalPrepareDownload);
                clearInterval(intervalID);
                cookies.remove(requestCookie);
            }
        }, 250);

        //request download endpoint
        window.setTimeout(() => {
            window.location.href = endpoint + query;
        }, delay);
    }

    //todo need to find a way to get a different content based on what button was clicked to
    //open the drawer and the main navigation state (MAP OR TABLE)
    render() {

        const { showDrawerDownload, activeMapping, activeFormat, activeTimeframe, projectMapping } = this.props;
        const elementClass = showDrawerDownload ? 'show drawer' : 'drawer';

        const isCSVRadioChecked = activeFormat === PARAMETERS.FORMAT_CSV;
        const isJSONRadioChecked = activeFormat === PARAMETERS.FORMAT_JSON;

        const downloadUrl = this.getDownloadUrl();

        const startDateInJS = new Date(this.startDate.replace(' ', 'T'));
        const endDateInJS = new Date(this.endDate.replace(' ', 'T'));

        return (
            <div id="drawer__download" className={elementClass}>
                <h2 className="drawer__header">
                    Download
                    <a
                        onClick={() => {
                            this.onToggleDrawer(showDrawerDownload);
                        }}
                        className="drawer__close-btn pull-right"
                        role="button"
                    >
                        <i className="material-icons">keyboard_arrow_left</i>
                    </a>
                </h2>
                <div className="drawer-content">

                    <aside className="download-controls">

                        <section className="panel panel-default download-controls__mapping">
                            <div className="panel-heading">
                                <h3 className="panel-title">Mapping</h3>
                            </div>
                            <div className="panel-body">
                                <div id="mappings" className="form-group">
                                    <DropdownButton
                                        title={activeMapping.name}
                                        key="mappings-dropdown"
                                        id="mappings-dropdown"
                                    >
                                        {this.getMappingItems(projectMapping)}
                                    </DropdownButton>
                                </div>
                            </div>
                        </section>

                        <section className="panel panel-default download-controls__timeframe">
                            <div className="panel-heading">
                                <h3 className="panel-title">Timeframe</h3>
                            </div>
                            <div className="panel-body">
                                <div id="mappings" className="form-group">
                                    <DropdownButton
                                        title={activeTimeframe}
                                        key="mappings-dropdown"
                                        id="mappings-dropdown"
                                    >
                                        {this.getTimeframeItems()}
                                    </DropdownButton>
                                </div>
                                <Modal
                                    dialogClassName="pick-dates-modal"
                                    show={this.state.showPickDatesModal}
                                    onHide={this.handleClosePickDatesModal}
                                    bsSize="small"
                                >
                                    <Modal.Header closeButton className="text-center">
                                        <div className="start-date__entry-title text-center">Pick dates</div>
                                    </Modal.Header>
                                    <Modal.Body>
                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="panel pick-dates-start text-center">
                                                    <div className="panel-heading">Start date</div>
                                                    <div className="panel-body">
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
                                                        {this.state.isInvalidStartDate
                                                            ? <p
                                                                className="text-danger text-center"
                                                            >Cannot select this day
                                                            </p>
                                                            : <p />
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="panel pick-dates-end text-center">
                                                    <div className="panel-heading">End date</div>
                                                    <div className="panel-body">
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
                                                        {this.state.isInvalidEndDate
                                                            ? <p
                                                                className="text-danger text-center"
                                                            >Cannot select this day
                                                            </p>
                                                            : <p />
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button bsStyle="primary" onClick={this.onPickDatesApplyClick}>Apply</Button>
                                    </Modal.Footer>
                                </Modal>
                            </div>

                        </section>

                        <section className="panel panel-default download-controls__file-format">
                            <div className="panel-heading">
                                <h3 className="panel-title">Format</h3>
                            </div>
                            <div className="panel-body">
                                <div id="formats" className="form-group">
                                    <FormGroup>
                                        <Radio
                                            name="groupFormats"
                                            inline
                                            checked={isCSVRadioChecked}
                                            onChange={() => {
                                                this.handleSelectedFileFormatChange(PARAMETERS.FORMAT_CSV);
                                            }}
                                        >
                                            CSV
                                        </Radio>
                                        <Radio
                                            name="groupFormats"
                                            inline
                                            checked={isJSONRadioChecked}
                                            onChange={() => {
                                                this.handleSelectedFileFormatChange(PARAMETERS.FORMAT_JSON);
                                            }}
                                        >
                                            JSON
                                        </Radio>
                                    </FormGroup>
                                </div>

                                <div className="download-controls__download-btn-wrapper text-center">

                                    <button
                                        onClick={
                                            () => {
                                                this.handleDownloadEntries(downloadUrl);
                                            }}
                                        className="btn btn-action"
                                    >
                                        <i className="material-icons">archive</i>
                                        &nbsp;
                                        Download
                                    </button>
                                </div>

                            </div>
                        </section>

                    </aside>
                </div>
            </div>
        );
    }
}

//get app state and map to props
function

    mapStateToProps(state) {
    return {
        showDrawerDownload: state.drawerReducer.showDrawerDownload,
        showDrawerEntry: state.drawerReducer.showDrawerEntry,
        showModalPrepareDownload: state.modalReducer.showModalPrepareDownload,
        activeMapping: state.drawerReducer.activeMapping,
        activeTimeframe: state.drawerReducer.activeTimeframe,
        activeFormat: state.drawerReducer.activeFormat,
        projectMapping: state.projectReducer.projectMapping,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        currentFormRef: state.navigationReducer.currentFormRef,
        projectStats: state.projectReducer.projectStats
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        toggleDrawerDownload,
        toggleModalPrepareDownload,
        setActiveMapping,
        setActiveTimeframe,
        setActiveFormat
    }, dispatch);
}

DrawerDownload.propTypes = {
    showDrawerDownload: React.PropTypes.bool,
    toggleDrawerDownload: React.PropTypes.func,
    setActiveMapping: React.PropTypes.func,
    setActiveTimeframe: React.PropTypes.func,
    setActiveFormat: React.PropTypes.func,
    showModalPrepareDownload: React.PropTypes.bool,
    projectStats: React.PropTypes.object,
    currentFormRef: React.PropTypes.string,
    projectSlug: React.PropTypes.string,
    toggleModalPrepareDownload: React.PropTypes.func,
    activeMapping: React.PropTypes.object,
    projectMapping: React.PropTypes.array,
    activeFormat: React.PropTypes.string,
    activeTimeframe: React.PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps)(DrawerDownload);

