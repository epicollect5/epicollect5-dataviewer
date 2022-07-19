import React from 'react';
import { bindActionCreators } from 'redux';
import { toggleModalViewEntry } from 'actions';
import { connect } from 'react-redux';

import PARAMETERS from 'config/parameters';
import localstorage from 'utils/localstorage';

class CellEdit extends React.Component {

    constructor(props) {
        super(props);
        this.handleClickEdit = this.handleClickEdit.bind(this);
        this.saveParamsForRestore = this.saveParamsForRestore.bind(this);
    }

    handleClickEdit() {
        const { links } = this.props;
        const selfLink = links.self;
        const url = new URL(selfLink);
        const searchParams = new URLSearchParams(url.search);
        const entryUuid = this.props.content.entryUuid;
        const dataEditorHref = PARAMETERS.DATA_EDITOR_BASE_PATH + PARAMETERS.DATA_EDITOR_EDIT_ENTRY_PATH;

        //add uuid to search params
        searchParams.set('uuid', entryUuid);

        this.saveParamsForRestore();

        //open data editor
        window.open(dataEditorHref + '?' + searchParams.toString(), '_self');

    }

    saveParamsForRestore() {

        const { currentFormName, hierarchyNavigator, currentFormRef, links, entriesFilters } = this.props;
        const { isViewingChildren, isViewingBranch } = this.props;
        const { currentBranchRef, currentBranchOwnerEntryTitle, branchBackLink } = this.props;
        const entryUuid = this.props.content.entryUuid;
        const parentEntryUuid = hierarchyNavigator[hierarchyNavigator.length - 1].parentEntryUuid;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const activePage = PARAMETERS.PAGE_TABLE;

        //params to save to localstorage to restore this state after adding entry
        const restoreViewParams = {
            formRef,
            formName: currentFormName,
            parentFormRef: currentFormRef,
            branchRef: currentBranchRef,
            entryUuid,
            parentEntryUuid,
            links,
            hierarchyNavigator,
            isViewingBranch,
            isViewingChildren,
            currentBranchOwnerEntryTitle,
            branchBackLink,
            entriesFilters,
            selectedLocationQuestion: null,
            selectedDistributionQuestion: null,
            activePage,
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

        //check user permission for the current entry
        const { projectUser, entryExtra } = this.props;
        let canUserEdit = PARAMETERS.IS_LOCALHOST === 1;//always true when debugging

        //IMPORTANT:  for private project the server is already filtering out entries based on user permissions
        //check role first, if no role check ID
        if (projectUser.role) {
            //user has a role on this project, check permissions
            canUserEdit = PARAMETERS.USER_PERMISSIONS.CAN_EDIT.indexOf(projectUser.role) > -1;

            //if the user does not have a CAN_EDIT role check entry ownership
            if (projectUser.id && !canUserEdit) {
                //user logged in, check permissions:
                canUserEdit = projectUser.id === entryExtra.relationships.user.data.id;
            }
        } else {
            //is there a user ID, i.e. is the user logged in?
            if (projectUser.id) {
                //user logged in, check permissions:
                canUserEdit = projectUser.id === entryExtra.relationships.user.data.id;
            }
        }

        //override editing flag for all VIEWER roles (even if they added the entry when they had a higher role) as they cannot edit/delete eny entry
        if (projectUser.role === PARAMETERS.PROJECT_ROLES.VIEWER) {
            canUserEdit = false;
        }

        return (
            <div className="cell-edit">
                <button
                    className="btn btn-default btn-action btn-icon"
                    onClick={() => {
                        this.handleClickEdit();
                    }}
                    disabled={!canUserEdit}
                >
                    <i className="material-icons">edit</i>
                </button>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        headers: state.tableReducer.headers,
        links: state.tableReducer.links,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        currentFormRef: state.navigationReducer.currentFormRef,
        currentFormName: state.navigationReducer.currentFormName,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        currentBranchOwnerEntryTitle: state.navigationReducer.currentBranchOwnerEntryTitle,
        isViewingChildren: state.navigationReducer.isViewingChildren,
        isViewingBranch: state.navigationReducer.isViewingBranch,
        branchBackLink: state.navigationReducer.branchBackLink,
        projectUser: state.projectReducer.projectUser,
        entriesFilters: state.filterEntriesReducer
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleModalViewEntry
    }, dispatch);
};

CellEdit.propTypes = {
    currentFormRef: React.PropTypes.string,
    links: React.PropTypes.object,
    currentFormName: React.PropTypes.string,
    currentBranchRef: React.PropTypes.string,
    currentBranchOwnerEntryTitle: React.PropTypes.string,
    branchBackLink: React.PropTypes.string,
    hierarchyNavigator: React.PropTypes.array,
    projectUser: React.PropTypes.object,
    isViewingChildren: React.PropTypes.bool,
    isViewingBranch: React.PropTypes.bool,
    entriesFilters: React.PropTypes.object,
    entryExtra: React.PropTypes.object,
    content: React.PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps)(CellEdit);
