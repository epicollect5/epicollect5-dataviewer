import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import { toggleModalPrepareDownload } from 'actions';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Loader from 'components/Loader';


class ModalPrepareDownload extends React.Component {

    render() {
        console.log('rendering prepare download modal');

        const { showModalPrepareDownload } = this.props;

        return (
            <Modal
                show={showModalPrepareDownload}
                onHide={this.close}
                dialogClassName="modal-prepare-download"
            >
                <div>
                    <Modal.Header closeButton={false}>
                        Your download will start shortly
                    </Modal.Header>
                    <Modal.Body>
                        <Loader elementClass="loader-prepare-download" />
                    </Modal.Body>
                    <Modal.Footer>
                        <p className="text-center warning-well">
                            Preparing your archive... This may take a few minutes. Thank you for your patience.
                            <br/>
                            <strong>Please DO NOT close this page.</strong>
                        </p>
                    </Modal.Footer>
                </div>
            </Modal>
        );
    }
}

ModalPrepareDownload.propTypes = {
    showModalPrepareDownload: React.PropTypes.bool
};

const mapStateToProps = (state) => {
    return {
        showModalPrepareDownload: state.modalReducer.showModalPrepareDownload
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleModalPrepareDownload
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalPrepareDownload);
