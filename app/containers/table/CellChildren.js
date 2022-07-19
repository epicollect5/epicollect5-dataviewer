import React from 'react';
import { bindActionCreators } from 'redux';
import { fetchChildEntries, performEntriesFilterReset } from 'actions';
import { connect } from 'react-redux';
import 'url-search-params-polyfill';
import helpers from 'utils/helpers';
import localstorage from 'utils/localstorage';
import PARAMETERS from 'config/parameters';

class CellChildren extends React.Component {

    constructor(props) {
        super(props);

        this.handleGetChildEntries = this.handleGetChildEntries.bind(this);
        this.saveParamsForRestore = this.saveParamsForRestore.bind(this);
    }

    handleGetChildEntries(entryUuid, entryTitle) {

        const { forms, projectSlug, projectExtra } = this.props;
        const hierarchyNavigator = this.props.hierarchyNavigator;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const nextForm = helpers.getNextForm(forms, formRef);
        const nextFormRef = nextForm.ref;
        const nextFormName = nextForm.name;

        const bundle = {
            projectSlug,
            formRef,
            nextFormRef,
            nextFormName,
            entryUuid,
            entryTitle,
            projectExtra,
            isActionAfterBulkUpload: false
        };

        console.log('bundle before -> ', JSON.stringify(bundle));

        //reset entries filters redux
        this.props.performEntriesFilterReset();

        this.props.fetchChildEntries(bundle);
    }

    handleAddNestedChildEntry() {
        const { hierarchyNavigator, forms } = this.props;
        const selfLink = hierarchyNavigator[hierarchyNavigator.length - 1].selfLink;
        const url = new URL(selfLink);
        const searchParams = new URLSearchParams(url.search);
        const entryUuid = this.props.content.entryUuid;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const nextForm = helpers.getNextForm(forms, formRef);
        const nextFormRef = nextForm.ref;
        //open data editor
        const dataEditorHref = PARAMETERS.DATA_EDITOR_BASE_PATH + PARAMETERS.DATA_EDITOR_ADD_ENTRY_PATH;

        searchParams.set('form_ref', nextFormRef);
        searchParams.set('parent_form_ref', formRef);
        searchParams.set('parent_uuid', entryUuid);

        //save params for restoring view when user comes back
        this.saveParamsForRestore();

        window.open(dataEditorHref + '?' + searchParams.toString(), '_self');

    }

    saveParamsForRestore() {

        const { hierarchyNavigator, currentFormRef, links, isViewingChildren } = this.props;
        const entryUuid = this.props.content.entryUuid;
        const parentEntryUuid = hierarchyNavigator[hierarchyNavigator.length - 1].parentEntryUuid;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;

        //params to save to localstorage to restore this state after adding entry
        const restoreViewParams = {
            formRef,
            branchRef: null,
            parentFormRef: currentFormRef,
            entryUuid,
            parentEntryUuid,
            links,
            hierarchyNavigator,
            isViewingBranch: false,
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
        //save params for restoring view when user comes back
        localstorage.save(restoreViewParams);
    }

    render() {
        // const isDisabled = this.props.content.answer === 0;
        const entryUuid = this.props.content.entryUuid;
        const entryTitle = this.props.entryTitle;
        const answer = this.props.content.answer;
        const { projectUser } = this.props;
        let isUserLoggedIn = PARAMETERS.IS_LOCALHOST === 1;//always true when debugging

        //is the user logged in?
        if (projectUser.role !== null || projectUser.id !== null) {
            //the user must be logged in if either a role is set or a user is is set
            isUserLoggedIn = true;
        }

        return (
            <div className="cell-content-wrapper">
                <div className="cell-content cell-children">
                        <span
                            className="cell-children__count"
                            onClick={() => {
                                this.handleGetChildEntries(entryUuid, entryTitle);
                            }}
                        >
                        {answer}
                        </span>
                    {isUserLoggedIn
                        ?
                        <div className="cell-children__add pull-right">
                            <button
                                className="btn btn-default btn-action btn-icon"
                                onClick={() => {
                                    this.handleAddNestedChildEntry();
                                }}
                            >
                                <i className="material-icons">add</i>
                            </button>
                        </div>
                        : ''
                    }
                </div>
            </div>
        );
    }
}

CellChildren.propTypes = {
    forms: React.PropTypes.array,
    content: React.PropTypes.object.isRequired,
    entryTitle: React.PropTypes.string.isRequired,
    projectSlug: React.PropTypes.string,
    currentFormRef: React.PropTypes.string,
    projectExtra: React.PropTypes.object,
    projectUser: React.PropTypes.object,
    links: React.PropTypes.object,
    hierarchyNavigator: React.PropTypes.array,
    performEntriesFilterReset: React.PropTypes.func,
    fetchChildEntries: React.PropTypes.func,
    isViewingChildren: React.PropTypes.bool
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        currentFormRef: state.navigationReducer.currentFormRef,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        projectExtra: state.projectReducer.projectExtra,
        projectUser: state.projectReducer.projectUser,
        forms: state.projectReducer.projectDefinition.project.forms,
        links: state.tableReducer.links,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        isViewingChildren: state.navigationReducer.isViewingChildren
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        fetchChildEntries,
        performEntriesFilterReset
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(CellChildren);
