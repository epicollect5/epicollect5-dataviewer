import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Table from 'react-bootstrap/lib/Table';
import { bindActionCreators } from 'redux';
import { toggleModalViewEntry } from 'actions';
import { connect } from 'react-redux';

import PARAMETERS from 'config/parameters';


class ModalViewEntry extends React.Component {

    constructor(props) {
        super(props);

        this.close = this.close.bind(this);
        this.mediaTypes = [
            PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE,
            PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE,
            PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE
        ];
        this.getQuestionAndAnswerRowsForModal = this.getQuestionAndAnswerRowsForModal.bind(this);
    }

    close() {
        this.props.toggleModalViewEntry();
    }

    //add some css to print the whole content of the modal
    getPrintCss() {
        const css = '@media print{#app,thead,.close{visibility:hidden}.modal{position:absolute;left:0;top:0;margin:0;padding:0;overflow:visible!important}}';

        return (
            <style>{css}</style>
        );
    }

    getQuestionAndAnswerRowsForModal(headers, answers) {

        return answers.map((answer, index) => {

            //is this a media type?
            if (this.mediaTypes.indexOf(answer.inputType) > -1) {
                //deal with media types
                switch (answer.inputType) {

                    case PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE:
                        if (answer.answer === '') {
                            return null;
                        }
                        return (
                            <tr key={index}>
                                <td>{headers[index].question}</td>
                                <td className="">
                                    <div className="audio-wrapper text-center">
                                        <audio src={answer.answer.entry_original} controls>
                                            Sorry, your browser doesn't support embedded audio,
                                            but don't worry, you can<a
                                            href={answer.answer.entry_original}>download it</a>
                                            and listen to it with your favorite music player!
                                        </audio>
                                    </div>
                                </td>
                            </tr>
                        );
                    case PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE:

                        //return image thumb, on click show full size one in modal
                        if (answer.answer === '') {
                            return null;
                        }
                        return (
                            <tr key={index}>
                                <td>{headers[index].question}</td>
                                <td className="text-center photo-wrapper">
                                    <img src={answer.answer.entry_sidebar} alt="thumbnail" width="200" />
                                </td>
                            </tr>
                        );
                    case PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE:
                        if (answer.answer === '') {
                            return null;
                        }
                        return (
                            <tr key={index}>
                                <td>{headers[index].question}</td>
                                <td>
                                    <div className="video-wrapper text-center">
                                        <video
                                            src={answer.answer.entry_original} controls
                                            data-mejsoptions='{"alwaysShowControls": true}'>
                                            Sorry, your browser doesn't support embedded videos,
                                            but don't worry, you can <a
                                            href={answer.answer.entry_original}
                                        >
                                            download it
                                        </a>
                                            and watch it with your favorite video player!
                                        </video>
                                    </div>
                                </td>
                            </tr>
                        );
                }
            } else {

                if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_DATASET_MULTIPLE_TYPE) {
                    return (
                        <tr key={index}>
                            <td>{headers[index].question}</td>
                            <td>
                                {answer.answer.split(',').map((pick, pickKey) => {
                                    return (
                                        <p className="dataset-p" key={pickKey}>{pick + ', '}</p>
                                    );
                                })}
                            </td>
                        </tr>);
                }

                return (
                    <tr key={index}>
                        <td>{headers[index].question}</td>
                        <td>{answer.answer}</td>
                    </tr>);
            }
        });
    }

    render() {
        console.log('rendering view modal');
        const { showModalViewEntry, entryTitle, viewHeaders, viewAnswers } = this.props;
        return (
            <Modal show={showModalViewEntry} onHide={this.close}>
                <Modal.Header closeButton>
                    <span className="cell-view__entry-title">Entry: {entryTitle}</span>
                </Modal.Header>
                <Modal.Body>
                    <Table bordered condensed responsive className="cell-view__content">
                        <thead>
                        <tr>
                            <th className="text-center cell-view__content__question_header">Question</th>
                            <th className="text-center">Answer</th>
                        </tr>
                        </thead>
                        <tbody>
                        {viewHeaders === null ? null : this.getQuestionAndAnswerRowsForModal(viewHeaders, viewAnswers)}
                        </tbody>
                    </Table>
                </Modal.Body>
                {this.getPrintCss()}
            </Modal>
        );
    }
}

ModalViewEntry.propTypes = {
    toggleModalViewEntry: React.PropTypes.func,
    showModalViewEntry: React.PropTypes.bool,
    entryTitle: React.PropTypes.string,
    viewHeaders: React.PropTypes.array,
    viewAnswers: React.PropTypes.array
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        showModalViewEntry: state.modalReducer.showModalViewEntry,
        entryTitle: state.modalReducer.entryTitle,
        viewHeaders: state.modalReducer.viewHeaders,
        viewAnswers: state.modalReducer.viewAnswers
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleModalViewEntry
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalViewEntry);
