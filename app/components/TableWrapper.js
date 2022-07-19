import React from 'react';
import Table from 'containers/table/Table';
import FilterEntriesControls from 'containers/FilterEntriesControls';
import UploadEntriesControls from 'containers/UploadEntriesControls';

import dimensions from 'react-dimensions';


class TableWrapper extends React.Component {

    constructor(props) {
        super(props);

        this.handleUploadClick = this.handleUploadClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    }

    handleUploadClick() {
        this.props.toggleDrawerUpload(this.props.showDrawerUpload);
    }

    handleScroll(e) {
        console.log(e);

    }

    render() {

        const elementClass = 'container-fluid table-wrapper ' + this.props.class;
        return (
            <div className={elementClass} onScroll={this.handleScroll}>
                <div className="row">
                    <FilterEntriesControls />
                    <Table
                        containerWidth={this.props.containerWidth}
                        containerHeight={this.props.containerHeight}
                    />
                    <UploadEntriesControls />
                </div>
            </div>
        );
    }
}

TableWrapper.propTypes = {
    showDrawerUpload: React.PropTypes.bool,
    toggleDrawerUpload: React.PropTypes.func,
    containerWidth: React.PropTypes.number,
    containerHeight: React.PropTypes.number
};

export default dimensions({
    getHeight: () => {

        if (window.innerWidth < 768) {
            //on small screen the filter controls are higher, so make the table shorter
            return window.innerHeight - 280;
        }
        return window.innerHeight - 230;
    },
    getWidth: () => {
        //var widthOffset = window.innerWidth < 680 ? 0 : 240;
        const widthOffset = 0;
        return window.innerWidth - widthOffset - 30; //30px because of bootstrap padding
    },
    className: 'react-dimensions'
})(TableWrapper);

