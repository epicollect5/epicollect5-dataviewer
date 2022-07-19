import React from 'react';
import { bindActionCreators } from 'redux';
import { fetchBranchEntries, performEntriesFilterReset } from 'actions';
import { connect } from 'react-redux';
import URL from 'url-parse';
import 'url-search-params-polyfill';

import PARAMETERS from 'config/parameters';
import localstorage from 'utils/localstorage';

class CellBranch extends React.Component {

    constructor(props) {
        super(props);
        this.saveParamsForRestore = this.saveParamsForRestore.bind(this);
    }

    handleAddBranchEntry() {
        const { links } = this.props;
        const selfLink = links.self;
        const url = new URL(selfLink);
        const searchParams = new URLSearchParams(url.query);
        const entryUuid = this.props.content.entryUuid;
        const branchRef = this.props.content.inputRef;
        searchParams.set('branch_ref', branchRef);
        searchParams.set('branch_owner_uuid', entryUuid);

        //set params for restoring view when user comes back
        this.saveParamsForRestore();

        //open data editor
        const dataEditorHref = PARAMETERS.DATA_EDITOR_BASE_PATH + PARAMETERS.DATA_EDITOR_ADD_ENTRY_PATH;
        window.open(dataEditorHref + '?' + searchParams.toString(), '_self');
        console.log('open page -> ', dataEditorHref + searchParams.toString());
    }


    saveParamsForRestore() {

        const { hierarchyNavigator, links } = this.props;
        const { isViewingChildren, isViewingBranch } = this.props;
        const entryUuid = this.props.content.entryUuid;
        const parentEntryUuid = hierarchyNavigator[hierarchyNavigator.length - 1].parentEntryUuid;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const parentFormRef = hierarchyNavigator[hierarchyNavigator.length - 2] ? hierarchyNavigator[hierarchyNavigator.length - 2].formRef : '';

        //params to save to localstorage to restore this state after adding entry
        const restoreViewParams = {
            formRef,
            parentFormRef,
            entryUuid,
            parentEntryUuid,
            currentBranchRef: null,
            links,
            hierarchyNavigator,
            isViewingBranch,
            isViewingChildren,
            selectedLocationQuestion: null,
            selectedDistributionQuestion: null,
            pieChartParams: null,
            pieChartLegend: null,
            mapControls: {
                sliderStartDate: null,
                sliderEndDate: null,
                sliderStartValue: null,
                sliderEndValue: null
            }
        };

        console.log('link saved for restore -> ', links.self);

        //save params for restoring view when user comes back
        localstorage.save(restoreViewParams);
    }

    getBranchEntries() {

        const { hierarchyNavigator, projectSlug, projectExtra } = this.props;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const ownerEntryUuid = this.props.content.entryUuid;
        const branchRef = this.props.content.inputRef;
        const entryTitle = this.props.title;
        const branchBackLink = this.props.links.self;

        //reset entries filters redux
        this.props.performEntriesFilterReset();

        this.props.fetchBranchEntries(
            projectSlug,
            formRef,
            ownerEntryUuid,
            branchRef,
            projectExtra,
            entryTitle,
            branchBackLink
        );
    }

    render() {
        /**
         this.props.content.answer is "undefined" when entries were saved before
         adding a branch question, so added extra code to set it to "0".
         It happens because at the time of saving the entry did not have
         the branch_ref since no branch existed yet
         **/
            //const isDisabled = this.props.content.answer === 0 || this.props.content.answer === undefined;
        const answer = this.props.content.answer || '0';
        const { projectUser } = this.props;
        let isUserLoggedIn = PARAMETERS.IS_LOCALHOST === 1;//always true when debugging

        //is the user logged in?
        if (projectUser.role !== null || projectUser.id !== null) {
            //the user must be logged in if either a role is set or a user is is set
            isUserLoggedIn = true;
        }

        return (
            <div className="cell-content-wrapper">
                <div className="cell-content cell-branch text-center">
                    <a
                        className="cell-branch__count"
                        onClick={() => {
                            this.getBranchEntries();
                        }}
                    >
                        {answer}
                    </a>
                    {isUserLoggedIn ?
                        <div className="cell-branch__add pull-right">
                            <button
                                className="btn btn-default btn-action btn-icon"
                                onClick={() => {
                                    this.handleAddBranchEntry();
                                }}
                            >
                                <i className="material-icons">add</i>
                            </button>
                        </div>
                        : null
                    }
                </div>
            </div>
        );
    }
}

CellBranch.propTypes = {
    content: React.PropTypes.object.isRequired,
    projectUser: React.PropTypes.object,
    projectExtra: React.PropTypes.object,
    performEntriesFilterReset: React.PropTypes.func,
    fetchBranchEntries: React.PropTypes.func,
    links: React.PropTypes.object,
    title: React.PropTypes.string,
    projectSlug: React.PropTypes.string,
    hierarchyNavigator: React.PropTypes.array,
    isViewingChildren: React.PropTypes.bool,
    isViewingBranch: React.PropTypes.bool
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        currentFormRef: state.navigationReducer.currentFormRef,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        projectExtra: state.projectReducer.projectExtra,
        links: state.tableReducer.links,
        isViewingBranch: state.navigationReducer.isViewingBranch,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        isViewingChildren: state.navigationReducer.isViewingChildren,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        currentBranchOwnerEntryTitle: state.navigationReducer.currentBranchOwnerEntryTitle,
        branchBackLink: state.navigationReducer.branchBackLink,
        projectUser: state.projectReducer.projectUser
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        fetchBranchEntries,
        performEntriesFilterReset
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(CellBranch);

