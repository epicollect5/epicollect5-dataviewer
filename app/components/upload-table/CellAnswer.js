import React from 'react';
import { Cell } from 'fixed-data-table-2';

class CellAnswer extends React.Component {

    render() {

        const { answer, responses, rowIndex, entryMapping } = this.props;

        let hasError = false;

        if (responses[rowIndex].errors) {
            console.log(responses[rowIndex].errors);


            responses[rowIndex].errors.forEach((error) => {
                if (error.source === entryMapping.input_ref) {
                    hasError = true;
                    return false;
                }

                //is the project version out of date?
                if (error.source === 'upload-controller' && error.code === 'ec5_201') {
                    hasError = true;
                    return false;
                }
            });

            if (hasError) {

                return (
                    <Cell>
                        <div>
                         <span
                             className="material-icons answer-error__icon"
                         >
                          error_outline
                         </span>
                            &nbsp;
                            <span className="answer-label">{answer}</span>
                        </div>
                    </Cell>);
            }
            return (
                <Cell>
                    <span>{answer}</span>
                </Cell>);
        }

        return (
            <Cell>
                <span>{answer}</span>
            </Cell>);
    }
}

CellAnswer.propTypes = {
    answer: React.PropTypes.string,
    rowIndex: React.PropTypes.number,
    responses: React.PropTypes.array,
    entryMapping: React.PropTypes.object
};

export default CellAnswer;

