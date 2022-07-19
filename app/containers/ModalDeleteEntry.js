import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import { bindActionCreators } from 'redux';
import { deleteEntry, toggleModalDeleteEntry } from 'actions';
import { connect } from 'react-redux';
import Loader from 'components/Loader';

class ModalDeleteEntry extends React.Component {

    constructor(props) {
        super(props);

        this.close = this.close.bind(this);
        this.handleDeleteEntryConfirm = this.handleDeleteEntryConfirm.bind(this);
    }

    close() {
        this.props.toggleModalDeleteEntry();
    }

    handleDeleteEntryConfirm() {

        const { projectSlug, entryUuid, rowIndexToDelete } = this.props;
        const { attributes, relationships } = this.props.deleteEntryExtra;

        const deleteParams = {
            data: {
                type: 'archive', //we archive the entry on the server for the time being, not a real deletion
                id: entryUuid,
                attributes,
                relationships,
                archive: {
                    entry_uuid: entryUuid
                }
            }
        };

        //delete entry request
        this.props.deleteEntry(projectSlug, deleteParams, rowIndexToDelete);
    }

    render() {
        console.log('rendering delete modal');
        const deleteEntryTitle = this.props.deleteEntryTitle;
        const { showModalDeleteLoader, showModalDeleteEntry } = this.props;

        return (
            <Modal
                show={showModalDeleteEntry}
                onHide={this.close}
                dialogClassName="modal-delete-entry"
            >
                {showModalDeleteLoader
                    ?
                    <Loader elementClass="loader__delete-entry" />
                    :
                    <div>
                        <Modal.Header closeButton>
                            <span className="cell-delete__entry-title">Delete entry</span>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="text-center">
                                <p>Are you sure you want to delete entry with the title
                                    <br />
                                    "{deleteEntryTitle}" ?
                                </p>
                                <p className="text-warning text-center">This action cannot be undone!</p>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                onClick={() => {
                                    this.close();
                                }} className="pull-left"
                            >Dismiss</Button>
                            <Button
                                className="btn btn-action"
                                onClick={() => {
                                    this.handleDeleteEntryConfirm();
                                }}
                            >Confirm</Button>
                        </Modal.Footer>
                    </div>
                }
            </Modal>
        );
    }
}

ModalDeleteEntry.propTypes = {
    showModalDeleteLoader: React.PropTypes.bool,
    showModalDeleteEntry: React.PropTypes.bool,
    deleteEntryTitle: React.PropTypes.func,
    toggleModalDeleteEntry: React.PropTypes.func,
    projectSlug: React.PropTypes.string,
    entryUuid: React.PropTypes.string,
    rowIndexToDelete: React.PropTypes.number,
    deleteEntryExtra: React.PropTypes.object,
    deleteEntry: React.PropTypes.func
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        showModalDeleteEntry: state.modalReducer.showModalDeleteEntry,
        showModalDeleteLoader: state.modalReducer.showModalDeleteLoader,
        entryUuid: state.modalReducer.entryUuid,
        deleteEntryTitle: state.modalReducer.deleteEntryTitle,
        deleteEntryExtra: state.modalReducer.deleteEntryExtra,
        rowIndexToDelete: state.modalReducer.rowIndexToDelete
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        deleteEntry,
        toggleModalDeleteEntry
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalDeleteEntry);
