import React from 'react';
import Lightbox from 'react-images';
import ProgressiveImage from 'react-progressive-image';

class PhotoPopup extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            lightboxIsOpen: false,
            currentImage: 0
        };

        this.closeLightbox = this.closeLightbox.bind(this);
        this.openLightbox = this.openLightbox.bind(this);
    }

    componentDidMount () {
        //delay rendering to slow down api request for media files
    }

    //clear timeout otherwise we would be calling setState() on a component already unmounted
    componentWillUnmount () {
    }

    openLightbox (event) {
        event.preventDefault();
        this.setState({
            currentImage: 0,
            lightboxIsOpen: true
        });
    }

    closeLightbox () {
        this.setState({
            currentImage: 0,
            lightboxIsOpen: false
        });
    }

    render () {

        const { answer } = this.props;

        const placeholder = (
            <div className="loader photo-popup-loader" />
        );
        //get image file name to be used as alt=""
        const photoParams = new URLSearchParams(answer.answer.entry_original);
        const photoFilename = photoParams.get('name');

        return (
            <ProgressiveImage src={answer.answer.entry_sidebar} placeholder="">
                {(src, loading) => {
                    return (loading ? placeholder :
                        <a
                            className="thumb animated fadeIn"
                            href={answer.answer.entry_original}
                            onClick={(e) => {
                                e.preventDefault();
                                this.setState({
                                    currentImage: 0,
                                    lightboxIsOpen: true
                                });
                                // this.openLightbox(e);
                            }}
                        >
                            <img
                                src={src}
                                alt={photoFilename}
                                width="250"
                            />
                            <Lightbox
                                currentImage={this.state.currentImage}
                                images={[{ src: answer.answer.entry_original }]}
                                isOpen={this.state.lightboxIsOpen}
                                onClose={this.closeLightbox}
                                showImageCount={false}
                                backdropClosesModal
                            />
                        </a>
                    );
                }}
            </ProgressiveImage>
        );
    }
}

PhotoPopup.propTypes = {
    answer: React.PropTypes.object.isRequired
};

export default PhotoPopup;
