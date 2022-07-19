import React from 'react';
import UploadTableBootstrap from 'containers/upload-table/UploadTableBootstrap';
import UploadTableControls from 'containers/upload-table/UploadTableControls';

import dimensions from 'react-dimensions';

class TableUploadWrapper extends React.Component {

    render() {
        return (
            <div>
                <UploadTableControls
                    {...this.props}
                    containerWidth={this.props.containerWidth}
                />
                <UploadTableBootstrap
                    {...this.props}
                    containerWidth={this.props.containerWidth}
                    containerHeight={this.props.containerHeight}
                />
            </div>
        );
    }
}

TableUploadWrapper.propTypes = {
    containerWidth: React.PropTypes.number,
    containerHeight: React.PropTypes.number
};

export default dimensions({
    getHeight: () => {

        if (window.innerWidth < 768) {
            //on small screen the filter controls are higher, so make the table shorter
            return window.innerHeight - 200;
        }
        return window.innerHeight - 200;
    },
    getWidth: () => {
        //var widthOffset = window.innerWidth < 680 ? 0 : 240;
        const widthOffset = 0;

        console.log('width: ', window.innerWidth);

        //not bulletproof but should work, we need to remove 1/10 of the viewport as the modal is set to 90% width, and there is some padding to consider
        return window.innerWidth - widthOffset - 30 - ((window.innerWidth / 10) + 5);
    },
    className: 'table-upload-wrapper'
})(TableUploadWrapper);

