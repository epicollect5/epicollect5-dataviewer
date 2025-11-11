import React from 'react';
import PARAMETERS from 'config/parameters';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import axios from 'axios';
import Loader from 'components/Loader';

class MediaPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      showLoader: true,
      fileNotFound: true
    };

    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.getMediaMarkup = this.getMediaMarkup.bind(this);
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });

    //test if the file exist
    axios({
      method: 'HEAD',
      url: this.props.content.answer.entry_default
    })
      .then(() => {
        //ok
        this.setState({
          showLoader: false,
          fileNotFound: false
        });
      })
      .catch(() => {
        //file not found
        this.setState({
          showLoader: false,
          fileNotFound: true
        });
      });
  }

  getMediaMarkup(mediaURL) {

    //append timestamp as extra param to request to avoid caching
    //we use & as the request already has a query
    mediaURL += '&t=' + Date.now();

    if (this.state.showLoader) {
      return <Loader />;
    }

    //file not found show warning message
    if (this.state.fileNotFound) {
      return (
        <div className="text-center">
          <p className="warning-well">
            File has not been uploaded yet
            <br />
            <strong>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://docs.epicollect.net/mobile-application/upload-entries#uploading-media-files"
              >
                More Info
              </a>
            </strong>
          </p>
        </div>
      );
    }

    //there is a file of audio type
    if (this.props.type === PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE) {
      return (
        <audio src={mediaURL} controls>
          Sorry, your browser doesn't support embedded audio, but don't
          worry, you can <a href={mediaURL}>download it</a>
          and listen to it with your favorite music player!
        </audio>
      );
    }

    //there is a file of video type
    if (this.props.type === PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE) {
      return (
        <video
          src={mediaURL}
          controls
          data-mejsoptions='{"alwaysShowControls": true}'
        >
          Sorry, your browser doesn't support embedded videos, but don't
          worry, you can <a href={mediaURL}>download it</a>
          and watch it with your favorite video player!
        </video>
      );
    }

  }

  render() {
    return (
      <div className="cell-content-wrapper">
        <div className="cell-content cell-media">
          <Button
            bsClass="btn btn-action btn-xs"
            bsSize="small"
            onClick={this.open}
          >
            Play {this.props.type}
          </Button>
          <Modal
            bsSize="small"
            className="modal-media"
            show={this.state.showModal}
            onHide={this.close}
          >
            <Modal.Header closeButton />
            <Modal.Body>
              {this.state.showModal
                ?
                // add timestamp to avoid caching
                this.getMediaMarkup(this.props.content.answer.entry_default)
                :
                ''
              }
            </Modal.Body>
          </Modal>
        </div>
      </div>
    );
  }
}

MediaPopup.propTypes = {
  content: React.PropTypes.object.isRequired,
  type: React.PropTypes.string.isRequired
};

export default MediaPopup;
