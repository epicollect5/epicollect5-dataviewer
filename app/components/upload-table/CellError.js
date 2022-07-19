import React from 'react';
import { Cell } from 'fixed-data-table-2';

class CellError extends React.Component {

    render() {

        const { responses, parentRowIndex, entryMapping } = this.props;

        let errorTitle = '';

        if (responses[parentRowIndex].errors) {
            console.log(responses[parentRowIndex].errors);

            responses[parentRowIndex].errors.forEach((error) => {
                if (error.source === entryMapping.input_ref) {
                    errorTitle = error.title;
                    return false;
                }

                //is the project version out of date?
                if (error.source === 'upload-controller' && error.code === 'ec5_201') {
                    errorTitle = error.title;
                    return false;
                }
            });
        }

        return (
            <Cell>
                <span
                    className="answer-error-label"
                >
                    <small>
                    {errorTitle}
                    </small>
                    </span>
            </Cell>);
    }
}

CellError.propTypes = {
    parentRowIndex: React.PropTypes.number,
    responses: React.PropTypes.array,
    entryMapping: React.PropTypes.object
};

export default CellError;

