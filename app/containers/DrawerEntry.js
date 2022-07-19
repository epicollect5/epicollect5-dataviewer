import React from 'react';
import { connect } from 'react-redux';
import {
    toggleDrawerEntry,
    mapClosePopups
} from 'actions';
import { bindActionCreators } from 'redux';

import ListGroup from 'react-bootstrap/lib/ListGroup';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';
import Lightbox from 'react-images';

import PARAMETERS from 'config/parameters';
import table from 'utils/table';
import localstorage from 'utils/localstorage';
import ProgressiveImage from 'react-progressive-image';

class DrawerEntry extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            lightboxIsOpen: false,
            currentImage: 0
        };

        this.mediaTypes = [
            PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE,
            PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE,
            PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE
        ];
        this.handleOnDrawerClose = this.handleOnDrawerClose.bind(this);
        this.handleClickEdit = this.handleClickEdit.bind(this);
        this.closeLightbox = this.closeLightbox.bind(this);
        this.openLightbox = this.openLightbox.bind(this);
    }

    componentDidUpdate() {
        console.log('DrawerEntry didUpdate');
    }

    openLightbox(event) {
        event.preventDefault();
        this.setState({
            currentImage: 0,
            lightboxIsOpen: true
        });
    }

    closeLightbox() {
        this.setState({
            currentImage: 0,
            lightboxIsOpen: false
        });
    }

    handleOnDrawerClose() {
        //close drawer
        this.props.toggleDrawerEntry(true);
        //close any open entry popup on map
        this.props.mapClosePopups();
    }

    handleClickEdit() {
        const { links, selectedEntry, selectedLocationQuestion } = this.props;
        const selfLink = links.self;
        const url = new URL(selfLink);
        const searchParams = new URLSearchParams(url.search);
        let entryUuid;
        const dataEditorHref = PARAMETERS.DATA_EDITOR_BASE_PATH + PARAMETERS.DATA_EDITOR_EDIT_ENTRY_PATH;
        const isViewingBranchLocations = !(selectedLocationQuestion.branch_ref === '' || selectedLocationQuestion.branch_ref === null);

        //get entry_uuid
        if (Object.prototype.hasOwnProperty.call(selectedEntry.data.entries[0], 'entry')) {
            //we are viewing a hierarchy entry
            entryUuid = selectedEntry.data.entries[0].entry.entry_uuid;
        } else {
            //we are viewing a branch entry
            entryUuid = selectedEntry.data.entries[0].branch_entry.entry_uuid;
        }

        //if we are viewing branch locations on the map, grab branch parameters
        if (isViewingBranchLocations) {
            searchParams
                .set('branch_ref', selectedEntry.data.entries[0].relationships.branch.data.owner_input_ref);
            searchParams
                .set('branch_owner_uuid', selectedEntry.data.entries[0].relationships.branch.data.owner_entry_uuid);
        }

        //add uuid to search params
        searchParams.set('uuid', entryUuid);

        this.saveParamsForRestore(entryUuid);

        console.log('data editor to open url', dataEditorHref + '?' + searchParams.toString());

        //open data editor
        window.open(dataEditorHref + '?' + searchParams.toString(), '_self');
    }

    saveParamsForRestore(entryUuid) {

        const {
            currentFormName,
            hierarchyNavigator,
            currentFormRef,
            links,
            selectedLocationQuestion,
            selectedDistributionQuestion,
            pieChartParams,
            pieChartLegend,
            sliderStartDate,
            sliderEndDate,
            sliderStartValue,
            sliderEndValue
        } = this.props;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const activePage = PARAMETERS.PAGE_MAP;
        const currentBranchRef = selectedLocationQuestion.branch_ref ? selectedLocationQuestion.branch_ref : null;

        //params to save to localstorage to restore this state after adding entry
        const restoreViewParams = {
            formRef,
            formName: currentFormName,
            parentFormRef: currentFormRef,
            entryUuid,
            links,
            hierarchyNavigator,
            activePage,
            branchRef: currentBranchRef,
            selectedLocationQuestion,
            selectedDistributionQuestion,
            pieChartParams,
            pieChartLegend,
            mapControls: {
                sliderStartDate,
                sliderEndDate,
                sliderStartValue,
                sliderEndValue
            }
        };
        //save params for restoring view when user comes back
        localstorage.save(restoreViewParams);
    }

    showEntryLoader() {
        return (<div className="drawer__entry-loader loader" />);
    }

    showEntryList(headers, answers, entryTitle, entryCreatedAt) {
        return (
            <div className="drawer__entry__list">
                <ListGroup>
                    <ListGroupItem className="list-title">
                        {entryTitle}
                    </ListGroupItem>
                </ListGroup>
                <ListGroup>
                    <ListGroupItem className="list-question">
                        Created At
                    </ListGroupItem>
                    <ListGroupItem className="list-answer">
                        {entryCreatedAt}
                    </ListGroupItem>
                </ListGroup>
                {this.getEntryList(headers, answers)}
            </div>
        );
    }

    getEntryList(headers, answers) {
        return answers.map((answer, index) => {
            //is this a media type?
            if (this.mediaTypes.indexOf(answer.inputType) > -1) {
                //deal with media types
                switch (answer.inputType) {

                    case PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE: {
                        if (answer.answer === '') {
                            return null;
                        }
                        return (
                            <ListGroup key={index}>
                                <ListGroupItem className="list-question">
                                    {headers[index].question}
                                </ListGroupItem>
                                <ListGroupItem className="list-answer">
                                    <div className="audio-wrapper text-center">
                                        <audio src={answer.answer.entry_original} controls>
                                            Sorry, your browser doesn't support embedded audio,
                                            but don't worry, you can <a href={answer.answer.entry_original}>download it</a>
                                            and listen to it with your favorite music player!
                                        </audio>
                                    </div>
                                </ListGroupItem>
                            </ListGroup>
                        );
                    }
                    case PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE: {

                        //return image thumb, on click show full size one in modal
                        if (answer.answer === '') {
                            return null;
                        }
                        const placeholder = (
                            <div className="loader drawer__entry-loader-photo" />
                        );
                        //get image file name to be used as alt=""
                        const photoParams = new URLSearchParams(answer.answer.entry_original);
                        const photoFilename = photoParams.get('name');

                        return (
                            <ListGroup key={index}>
                                <ListGroupItem className="list-question">
                                    {headers[index].question}
                                </ListGroupItem>
                                <ListGroupItem className="list-answer">
                                    <div className="text-center photo-wrapper">
                                        <ProgressiveImage src={answer.answer.entry_sidebar} placeholder="">
                                            {(src, loading) => {
                                                return (loading ? placeholder :
                                                        <a
                                                            className="thumb animated fadeIn"
                                                            href={answer.answer.entry_original}
                                                            onClick={(e) => {
                                                                this.openLightbox(e);
                                                            }}
                                                        >
                                                            <img
                                                                src={src}
                                                                alt={photoFilename}
                                                                width="250"
                                                            />
                                                            <Lightbox
                                                                currentImage={this.state.currentImage}
                                                                images={[{ src: answer.answer.entry_original }]}
                                                                isOpen={this.state.lightboxIsOpen}
                                                                onClose={this.closeLightbox}
                                                                showImageCount={false}
                                                                backdropClosesModal
                                                            />
                                                        </a>
                                                );
                                            }}
                                        </ProgressiveImage>
                                    </div>
                                </ListGroupItem>
                            </ListGroup>
                        );
                    }
                    case PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE: {
                        if (answer.answer === '') {
                            return null;
                        }
                        return (
                            <ListGroup key={index}>
                                <ListGroupItem className="list-question">
                                    {headers[index].question}
                                </ListGroupItem>
                                <ListGroupItem className="list-answer">
                                    <div className="video-wrapper text-center">
                                        <video src={answer.answer.entry_original} controls data-mejsoptions='{"alwaysShowControls": true}'>
                                            Sorry, your browser doesn't support embedded videos,
                                            but don't worry, you can <a href={answer.answer.entry_original}>download it</a>
                                            and watch it with your favorite video player!
                                        </video>
                                    </div>
                                </ListGroupItem>
                            </ListGroup>
                        );
                    }

                    default:
                    //do nothing
                }
            } else {
                return (
                    <ListGroup key={index}>
                        <ListGroupItem className="list-question">
                            {headers[index].question}
                        </ListGroupItem>
                        <ListGroupItem className="list-answer">
                            {answer.answer}
                        </ListGroupItem>
                    </ListGroup>);
            }

        });
    }

    //todo need to find a way to get a different content based on what button was clicked to
    //open the drawer and the main navigation state (MAP OR TABLE)
    render() {

        //todo weird bug on IS11...drawer always rendering loader?

        const { showDrawerEntry, projectSlug, currentFormRef, selectedEntry, projectExtra, selectedLocationQuestion } = this.props;

        //parse the raw entry and get it as a "row" like we do for the table
        let singleEntryFlat = [];
        let entryTitle = '';
        let entryCreatedAt = '';
        let answers;
        let headers;
        let canUserEdit = PARAMETERS.IS_LOCALHOST === 1;//always true when debugging
        const { projectUser } = this.props;
        const elementClass = showDrawerEntry ? 'show drawer' : 'drawer';

        //IMPORTANT: uncommenting this will remove slide animation...
        //if (!showDrawerEntry) {
        //return null;
        //}

        const branchRef = selectedLocationQuestion.branch_ref === null ? '' : selectedLocationQuestion.branch_ref;
        if (selectedEntry !== null && showDrawerEntry) {
            singleEntryFlat = (table.getRows(projectSlug, projectExtra, currentFormRef, selectedEntry, branchRef))[0];

            if (branchRef) {
                //this is a branch entry
                entryTitle = singleEntryFlat[PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX - 1].answer;
                answers = singleEntryFlat.slice(PARAMETERS.TABLE_FIXED_HEADERS_TOTAL - 1, singleEntryFlat.length);
                entryCreatedAt = singleEntryFlat[PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX - 1].answer;

                //replace headers with  branch headers
                headers = table.getBranchHeaders(projectExtra, currentFormRef, branchRef);
            } else {
                headers = this.props.headers;
                entryTitle = singleEntryFlat[PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX].answer;
                answers = singleEntryFlat.slice(PARAMETERS.TABLE_FIXED_HEADERS_TOTAL, singleEntryFlat.length);
                entryCreatedAt = singleEntryFlat[PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX].answer;
            }
            //IMPORTANT:  for private project the server is already filtering out entries based on user permissions
            //check role first, if no role check ID
            if (projectUser.role) {
                //user has a role on this project, check permissions
                canUserEdit = PARAMETERS.USER_PERMISSIONS.CAN_EDIT.indexOf(projectUser.role) > -1;

                //if the user does not have a CAN_EDIT role check entry ownership
                if (projectUser.id && !canUserEdit) {
                    //user logged in, check permissions:
                    canUserEdit = projectUser.id === selectedEntry.data.entries[0].relationships.user.data.id;
                }
            } else {
                //is there a user ID, i.e. is the user logged in?
                if (projectUser.id) {
                    //user logged in, check permissions:
                    // console.log('selectedEntry', JSON.stringify(selectedEntry));
                    canUserEdit = projectUser.id === selectedEntry.data.entries[0].relationships.user.data.id;
                }
            }
        }

        return (
            <div id="drawer__entry" className={elementClass}>
                <h2 className="drawer__header">
                    <button
                        className="drawer__edit-entry-btn btn btn-default btn-sm"
                        onClick={() => {
                            this.handleClickEdit();
                        }}
                        disabled={!canUserEdit}
                    >
                        <i className="material-icons">edit</i>
                    </button>

                    <a
                        onClick={() => {
                            this.handleOnDrawerClose();
                        }}
                        className="drawer__close-btn pull-right"
                        role="button"
                    >
                        <i className="material-icons">keyboard_arrow_left</i>
                    </a>
                </h2>
                <div className="drawer-content">
                    {(selectedEntry === null || showDrawerEntry === false)
                        ? this.showEntryLoader()
                        : this.showEntryList(headers, answers, entryTitle, entryCreatedAt)
                    }
                </div>
            </div>
        );
    }
}

//get app state and map to props
function mapStateToProps(state) {
    return {
        showDrawerEntry: state.drawerReducer.showDrawerEntry,
        currentFormRef: state.navigationReducer.currentFormRef,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        projectExtra: state.projectReducer.projectExtra,
        projectUser: state.projectReducer.projectUser,
        selectedEntry: state.mapReducer.selectedEntry,
        headers: state.tableReducer.headers,
        links: state.tableReducer.links,
        selectedLocationQuestion: state.mapReducer.selectedLocationQuestion,
        selectedDistributionQuestion: state.mapReducer.selectedDistributionQuestion,
        pieChartParams: state.mapReducer.pieChartParams,
        pieChartLegend: state.mapReducer.pieChartLegend,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        currentFormName: state.navigationReducer.currentFormName,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        sliderEndDate: state.mapReducer.sliderEndDate,
        sliderStartDate: state.mapReducer.sliderStartDate,
        sliderEndValue: state.mapReducer.sliderEndValue,
        sliderStartValue: state.mapReducer.sliderStartValue
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        toggleDrawerEntry,
        mapClosePopups
    }, dispatch);
}

DrawerEntry.propTypes = {
    toggleDrawerEntry: React.PropTypes.func,
    currentFormRef: React.PropTypes.string,
    projectSlug: React.PropTypes.string,
    links: React.PropTypes.object,
    selectedEntry: React.PropTypes.object,
    mapClosePopups: React.PropTypes.func,
    currentFormName: React.PropTypes.string,
    hierarchyNavigator: React.PropTypes.array,
    projectUser: React.PropTypes.object,
    selectedLocationQuestion: React.PropTypes.object,
    selectedDistributionQuestion: React.PropTypes.object,
    pieChartParams: React.PropTypes.object,
    pieChartLegend: React.PropTypes.array,
    headers: React.PropTypes.array,
    sliderStartDate: React.PropTypes.any,
    sliderEndDate: React.PropTypes.any,
    sliderStartValue: React.PropTypes.number,
    sliderEndValue: React.PropTypes.number,
    showDrawerEntry: React.PropTypes.bool,
    projectExtra: React.PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps)(DrawerEntry);

