import React from 'react';
import PARAMETERS from 'config/parameters';
import Lightbox from 'react-images';
import MediaPopup from 'components/MediaPopup';

class CellMedia extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            lightboxIsOpen: false,
            currentImage: 0,
            render: false
        };

        this.timeout = null;

        this.closeLightbox = this.closeLightbox.bind(this);
        this.openLightbox = this.openLightbox.bind(this);
    }

    componentDidMount() {
        //delay rendering to slow down api request for media files
        //useful when there are a lot of media questions in the project
        //and the server is busy
        const delay = Math.floor(Math.random() * (750)) + 100;

        this.timeout = setTimeout(() => { //Start the timer
            this.setState({ render: true });
          console.log('%cRendering with delay of ' + delay + 'ms', 'color: blue; font-weight: bold;');
        }, delay);
    }

    //clear timeout otherwise we would be calling setState() on a component already unmounted
    componentWillUnmount() {
        clearTimeout(this.timeout);
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

    render() {

        if (!this.state.render) { //If this.state.render == true, which is set to true by the timer.
            return null;
        }

        switch (this.props.content.inputType) {

            case PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE:
                if (this.props.content.answer === '') {
                    return null;
                }
                return (<MediaPopup type={PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE} content={this.props.content} />);

            case PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE:

                //return image thumb, on click show full size one in modal
                if (this.props.content.answer === '') {
                    return null;
                }

                //const placeholder = null;
                return (
                    <div className="thumb-wrapper">
                        <a
                            className="thumb"
                            href={this.props.content.answer.entry_original}
                            onClick={(e) => {
                                this.openLightbox(e);
                            }}

                        >
                            <img
                                className="animated fadeIn" key={this.props.content.entryUuid}
                                src={this.props.content.answer.entry_thumb}
                                alt="thumbnail"
                                width="50"
                                height="50"
                            />
                        </a>

                        <Lightbox
                            currentImage={this.state.currentImage}
                            images={[{ src: this.props.content.answer.entry_original }]}
                            isOpen={this.state.lightboxIsOpen}
                            onClose={this.closeLightbox}
                            showImageCount={false}
                            backdropClosesModal
                        />
                    </div>
                );

            case PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE:
                if (this.props.content.answer === '') {
                    return null;
                }
                return (
                    <MediaPopup type={PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE} content={this.props.content} />
                );
            default:
                return (<div>{this.props.content.answer.entry_default}</div>);
        }
    }
}

CellMedia.propTypes = {
    content: React.PropTypes.object.isRequired
};

export default CellMedia;
