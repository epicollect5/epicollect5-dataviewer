import React from 'react';
import { connect } from 'react-redux';
import {
    toggleDrawerUpload
} from 'actions';
import { bindActionCreators } from 'redux';
import PARAMETERS from 'config/parameters';

class UploadEntriesControls extends React.Component {

    constructor(props) {
        super(props);

        this.isUploadEnabled = false;
        this.handleUploadClick = this.handleUploadClick.bind(this);
    }

    handleUploadClick() {
        if (!this.isUploadEnabled) {
            return false;
        }

        this.props.toggleDrawerUpload(this.props.showDrawerUpload);
    }

    componentDidMount() {
        console.log('mounted filter entries controls');
    }

    componentDidUpdate() {
        console.log('updated filter entries controls');
    }

    render() {

        const { hierarchyNavigator, projectDefinition, projectUser } = this.props;
        let uploadBtnClass;

        //When the following is one, users are navigating using the form switcher
        if (hierarchyNavigator.length === 1) {
            //single form, is this the parent one?
            if (hierarchyNavigator[0].formRef === projectDefinition.project.forms[0].ref) {
                this.isUploadEnabled = true;
                uploadBtnClass = 'bulk-upload-btn pull-right';
            } else {
                this.isUploadEnabled = false;
                uploadBtnClass = 'bulk-upload-btn pull-right disabled';
            }
        } else {
            //users are navigating down the children/branches

            //always enabled?
            this.isUploadEnabled = true;
            uploadBtnClass = 'bulk-upload-btn pull-right';
        }

        //IMPORTANT:  for private project the server is already filtering out entries based on user permissions
        //check role first, if no role check ID
        //check if users are logged in and have permissions only in production
        if (PARAMETERS.IS_LOCALHOST === 0) {
            //if in production
            if (!projectUser.role) { //no role?
                if (!projectUser.id) {
                    //if the user is not logged in, hide upload button
                    this.isUploadEnabled = false;
                    uploadBtnClass = 'bulk-upload-btn pull-right disabled hidden';
                } else {
                    //if the user is logged in but not a member, disable upload button
                    this.isUploadEnabled = false;
                    uploadBtnClass = 'bulk-upload-btn pull-right disabled';
                }
            }
        }

        //check bulk upload settings
        const canBulkUpload = projectDefinition.project.can_bulk_upload;
        const access = projectDefinition.project.access;
        switch (canBulkUpload) {

            case PARAMETERS.CAN_BULK_UPLOAD.NOBODY:
                this.isUploadEnabled = false;
                uploadBtnClass = 'bulk-upload-btn pull-right hidden';
                break;
            case PARAMETERS.CAN_BULK_UPLOAD.MEMBERS:
                if (PARAMETERS.IS_LOCALHOST === 0) { //if in production
                    if (!projectUser.role) { //no role?
                        //if the user does not have a role, disable upload button
                        this.isUploadEnabled = false;
                        uploadBtnClass = 'bulk-upload-btn pull-right disabled';
                    } else {
                        //role found, kick our VIEWER roles
                        if (projectUser.role === PARAMETERS.PROJECT_ROLES.VIEWER) {
                            this.isUploadEnabled = false;
                            uploadBtnClass = 'bulk-upload-btn pull-right disabled';
                        }
                    }
                }
                break;
            case PARAMETERS.CAN_BULK_UPLOAD.EVERYBODY:
                //private project? kick out VIEWER role
                if (access === PARAMETERS.PROJECT_ACCESS.PRIVATE) {
                    if (PARAMETERS.IS_LOCALHOST === 0) { //if in production
                        if (!projectUser.role) { //no role?
                            //if the user does not have a role, disable upload button
                            this.isUploadEnabled = false;
                            uploadBtnClass = 'bulk-upload-btn pull-right disabled';
                        } else {
                            //role found, kick our VIEWER roles
                            if (projectUser.role === PARAMETERS.PROJECT_ROLES.VIEWER) {
                                this.isUploadEnabled = false;
                                uploadBtnClass = 'bulk-upload-btn pull-right disabled';
                            }
                        }
                    }
                }
                //do nothing
                break;
            default:
            //do nothing
        }

        return (
            <section className="upload-entries-controls">
                <div
                    className={uploadBtnClass}
                    onClick={(event) => {
                        this.handleUploadClick(event);
                    }}
                >
                    <i className="material-icons">
                        cloud_upload
                    </i>
                    <span>Upload</span>
                    <sup>&nbsp;Beta</sup>
                </div>
            </section>
        );
    }
}

//get app state and map to props
function mapStateToProps(state) {
    return {
        showDrawerUpload: state.drawerReducer.showDrawerUpload,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        projectDefinition: state.projectReducer.projectDefinition,
        projectUser: state.projectReducer.projectUser
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        toggleDrawerUpload
    }, dispatch);
}

UploadEntriesControls.propTypes = {
    showDrawerUpload: React.PropTypes.bool,
    hierarchyNavigator: React.PropTypes.array,
    toggleDrawerUpload: React.PropTypes.func,
    projectDefinition: React.PropTypes.object,
    projectUser: React.PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps)(UploadEntriesControls);
