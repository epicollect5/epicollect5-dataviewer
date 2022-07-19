import React from 'react';
import { bindActionCreators } from 'redux';
import { toggleModalDeleteEntry } from 'actions';
import { connect } from 'react-redux';
import PARAMETERS from 'config/parameters';

class CellDelete extends React.Component {

    constructor(props) {
        super(props);
        this.handleClickDelete = this.handleClickDelete.bind(this);
    }

    //open modal delete
    handleClickDelete(entryUuid, entryTitle, entryExtra, rowIndex) {
        this.props.toggleModalDeleteEntry(entryUuid, entryTitle, entryExtra, rowIndex);
    }

    //IMPORTANT: the delete action is permission based, so toggle it based on user id matching or not the entry user id
    //if the user id doe not exist, it does not get here as the delete column is not rendered
    render() {
        const { projectUser, entryTitle, entryExtra, rowIndex } = this.props;
        const entryUuid = this.props.content.entryUuid;
        //check user permission for the current entry
        let canUserDelete = PARAMETERS.IS_LOCALHOST === 1;//always true when debugging

        //IMPORTANT: for private project the server is already filtering out entries based on user permissions
        //check role first, if no role check ID
        if (projectUser.role) {
            //user has a role on this project, check permissions
            console.log(PARAMETERS.USER_PERMISSIONS.CAN_EDIT.indexOf(projectUser.role));
            canUserDelete = PARAMETERS.USER_PERMISSIONS.CAN_EDIT.indexOf(projectUser.role) > -1;

            //if the user does not have a CAN_EDIT role check entry ownership
            if (projectUser.id && !canUserDelete) {
                //user logged in, check permissions:
                canUserDelete = projectUser.id === entryExtra.relationships.user.data.id;
            }
        } else {
            //is there a user ID, i.e. is the user logged in?
            if (projectUser.id) {
                //user logged in, check permissions:
                canUserDelete = projectUser.id === entryExtra.relationships.user.data.id;
            }
        }

        //override editing flag for all VIEWER roles (even if they added the entry when they had a higher role) as they cannot edit/delete eny entry
        if (projectUser.role === PARAMETERS.PROJECT_ROLES.VIEWER) {
            canUserDelete = false;
        }

        return (
            <div className="cell-delete">
                <button
                    className="btn btn-default btn-danger btn-icon"
                    disabled={!canUserDelete}
                    onClick={() => {
                        this.handleClickDelete(entryUuid, entryTitle, entryExtra, rowIndex);
                    }}
                >
                    <i className="material-icons">delete</i>
                </button>
            </div>
        );
    }
}

CellDelete.propTypes = {
    toggleModalDeleteEntry: React.PropTypes.func,
    projectUser: React.PropTypes.object,
    entryTitle: React.PropTypes.string,
    entryExtra: React.PropTypes.object,
    rowIndex: React.PropTypes.number,
    content: React.PropTypes.object
};

const mapStateToProps = (state) => {
    return {
        currentFormRef: state.navigationReducer.currentFormRef,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        projectUser: state.projectReducer.projectUser
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleModalDeleteEntry
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(CellDelete);
