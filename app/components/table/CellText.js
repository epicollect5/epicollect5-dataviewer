import React from 'react';

class CellText extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="cell-content-wrapper">
                <div className="cell-content">{this.props.content.answer}</div>
            </div>
        );
    }
}

CellText.propTypes = {
    content: React.PropTypes.object.isRequired
};

export default CellText;

