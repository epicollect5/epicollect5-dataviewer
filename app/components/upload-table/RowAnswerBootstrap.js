import React from 'react';
import PARAMETERS from 'config/parameters';
import RowErrorsBootstrap from 'components/upload-table/RowErrorsBootstrap';
import helpers from 'utils/helpers';
import bulkUpload from 'utils/bulk-upload';

class RowAnswerBootstrap extends React.Component {

    render() {

        const {
            responses, rowIndex, mapping, expandedErrorRows, projectDefinition, hierarchyNavigator, filterByFailed, failedReverseEntries, reverseEntries, uploadedRows, currentBranchRef,
            generatedUuids
        } = this.props;
        const currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const forms = projectDefinition.project.forms;
        const currentFormIndex = helpers.getFormIndexFromRef(forms, currentFormRef);
        let inputs = forms[currentFormIndex].inputs;
        let branchInputs = [];
        const entryType = currentBranchRef ? 'branch_entry' : 'entry';

        //is this a branch entries upload?
        if (currentBranchRef !== null) {
            //get all branch inputs
            inputs.forEach((input) => {
                if (input.ref === currentBranchRef) {
                    branchInputs = input.branch;
                    return false;
                }
            });
            //override hierarchy inputs with branch inputs
            inputs = branchInputs;
        }

        if (helpers.isOdd(rowIndex)) {
            //return extra row to hold errors
            return (
                <RowErrorsBootstrap
                    rowIndex={rowIndex}
                    responses={responses}
                    mapping={mapping}
                    expandedErrorRows={expandedErrorRows}
                    inputs={inputs}
                    currentBranchRef={currentBranchRef}
                />);
        }

        return (
            <tr key={rowIndex}>
                {
                    inputs.map((input, inputIndex) => {

                        let currentEntry;
                        let entryUuid;

                        if (inputIndex === 0) {
                            if (currentBranchRef) {
                                if (filterByFailed) {
                                    entryUuid = failedReverseEntries[rowIndex].data[entryType].entry_uuid;
                                    if (generatedUuids.indexOf(entryUuid) > -1) {
                                        entryUuid = '';
                                    }
                                } else {
                                    entryUuid = uploadedRows[rowIndex / 2].ec5_branch_uuid;
                                }
                            } else {
                                if (filterByFailed) {
                                    entryUuid = failedReverseEntries[rowIndex].data[entryType].entry_uuid;
                                    if (generatedUuids.indexOf(entryUuid) > -1) {
                                        entryUuid = '';
                                    }
                                } else {
                                    entryUuid = uploadedRows[rowIndex / 2].ec5_uuid;
                                }
                            }
                            return (
                                <td
                                    key={entryUuid}
                                >
                                    {entryUuid}
                                </td>
                            );
                        }

                        if (!(input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE || input.type === PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE)) {

                            let entryMapping = {};

                            //are we showing a hierarchy or branch entry?
                            if (currentBranchRef) {
                                //branch entry
                                entryMapping = mapping[currentBranchRef].branch[input.ref];
                            } else {
                                //hierarchy entry
                                entryMapping = mapping[input.ref];
                            }

                            // const inputRef = entryMapping.input_ref;
                            let hasError = false;
                            let originalAnswer = '';

                            //a bit of trickery to show only failed rows
                            if (filterByFailed) {
                                //important: failedReverseEntries array matches the responses array (duplicated items)
                                //so index is the same
                                currentEntry = failedReverseEntries[rowIndex];
                            } else {
                                //important: reverseEntries array has the original lenght
                                //so the index must be divided by 2 to find the right entry
                                currentEntry = reverseEntries[rowIndex / 2];
                            }

                            if (responses[rowIndex].errors) {
                                responses[rowIndex].errors.forEach((error) => {
                                    if (error.source === entryMapping.input_ref) {
                                        hasError = true;
                                        return false;
                                    }

                                    //HTML tags?
                                    if (error.source === 'json-contains-html' && error.code === 'ec5_220') {
                                        hasError = true;
                                        return false;
                                    }

                                    //project locked?
                                    if (error.source === 'upload-controller' && error.code === 'ec5_202') {
                                        hasError = true;
                                        return false;
                                    }
                                });
                            }

                            //We get the original answer in a different way if we are showing only
                            //the failed rows (due to array indexes being different)
                            if (filterByFailed) {
                                originalAnswer = bulkUpload.getFailedOriginalAnswer(input, entryMapping, currentEntry, entryType);
                            } else {
                                //get original answer from uploaded rows
                                originalAnswer = uploadedRows[rowIndex / 2][entryMapping.map_to];
                            }

                            //Questions types which are not bulk uploadable default to empty answer
                            if (!PARAMETERS.BULK_UPLOADABLE_TYPES.includes(input.type)) {
                                originalAnswer = '';
                            }

                            //handle group type
                            if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {

                                return input.group

                                    //do not map README types
                                    .filter((groupInput) => {
                                        return groupInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE;
                                    })


                                    .map((groupInput) => {


                                        //check if there is the need to highlight any group input error
                                        const groupEntryMapping = entryMapping.group[groupInput.ref];
                                        hasError = false;

                                        if (responses[rowIndex].errors) {
                                            responses[rowIndex].errors.forEach((error) => {
                                                if (error.source === groupEntryMapping.input_ref) {
                                                    hasError = true;
                                                    return false;
                                                }
                                            });
                                        }

                                        //We get the original answer in a different way if we are showing only
                                        //the failed rows (due to array indexes being different)
                                        if (filterByFailed) {
                                            originalAnswer = bulkUpload.getFailedOriginalAnswer(groupInput, groupEntryMapping, currentEntry, entryType);
                                        } else {
                                            //get original answer from uploaded rows
                                            originalAnswer = uploadedRows[rowIndex / 2][groupEntryMapping.map_to];
                                        }

                                        //Group questions types which are not bulk uploadable default to empty answer
                                        if (!PARAMETERS.BULK_UPLOADABLE_TYPES.includes(groupInput.type)) {
                                            originalAnswer = '';
                                        }

                                        //Is it a location group input?
                                        if (groupEntryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {

                                            const parts = {
                                                latitude: 'lat_',
                                                longitude: 'long_',
                                                accuracy: 'accuracy_'
                                            };

                                            return Object.entries(parts).map((part) => {

                                                if (filterByFailed) {
                                                    //get original answer from current entry
                                                    originalAnswer = currentEntry.data[entryType].answers[groupInput.ref].answer[part[0]];

                                                } else {
                                                    originalAnswer = uploadedRows[rowIndex / 2][part[1] + groupEntryMapping.map_to];
                                                }

                                                if (hasError) {
                                                    return (
                                                        <td key={part[1] + groupEntryMapping.map_to}>
                                                            <div>
                                                                <span
                                                                    className="material-icons answer-error__icon"
                                                                >
                                                                    error_outline
                                                                </span>
                                                                &nbsp;
                                                                <span className="answer-error-label">
                                                                    {originalAnswer}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td
                                                        key={part[1] + groupEntryMapping.map_to}
                                                    >
                                                        <span>{originalAnswer}</span>
                                                    </td>
                                                );
                                            });

                                        }

                                        if (hasError) {
                                            return (
                                                <td key={groupEntryMapping.map_to}>
                                                    <div>
                                                        <span
                                                            className="material-icons answer-error__icon"
                                                        >
                                                            error_outline
                                                        </span>
                                                        &nbsp;
                                                        <span className="answer-error-label">
                                                            {originalAnswer}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td
                                                key={groupEntryMapping.map_to}
                                            >
                                                <span>{originalAnswer}</span>
                                            </td>
                                        );
                                    });
                            }

                            //handle location type
                            if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {

                                const parts = {
                                    latitude: 'lat_',
                                    longitude: 'long_',
                                    accuracy: 'accuracy_'
                                };

                                return Object.entries(parts).map((part) => {

                                    if (filterByFailed) {
                                        //get original answer from current entry
                                        originalAnswer = currentEntry.data[entryType].answers[input.ref].answer[part[0]];

                                    } else {
                                        originalAnswer = uploadedRows[rowIndex / 2][part[1] + entryMapping.map_to];
                                    }

                                    if (hasError) {
                                        return (
                                            <td key={part[1] + entryMapping.map_to}>
                                                <div>
                                                    <span
                                                        className="material-icons answer-error__icon"
                                                    >
                                                        error_outline
                                                    </span>
                                                    &nbsp;
                                                    <span className="answer-error-label">
                                                        {originalAnswer}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td
                                            key={part[1] + entryMapping.map_to}
                                        >
                                            <span>{originalAnswer}</span>
                                        </td>
                                    );
                                });
                            }

                            //branch questions are ignored, they need to be uploaded separately
                            if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE) {
                                return (<td key={entryMapping.map_to}><span /></td>);
                            }

                            if (hasError) {
                                return (
                                    <td key={entryMapping.map_to}>
                                        <div>
                                            <span
                                                className="material-icons answer-error__icon"
                                            >
                                                error_outline
                                            </span>
                                            &nbsp;
                                            <span className="answer-error-label">{originalAnswer}</span>
                                        </div>
                                    </td>
                                );
                            }

                            return (<td key={entryMapping.map_to}><span>{originalAnswer}</span></td>);
                        }

                        return null;
                    })
                }
            </tr>
        );
    }
}

RowAnswerBootstrap.propTypes = {
    rowIndex: React.PropTypes.number,
    responses: React.PropTypes.array,
    hierarchyNavigator: React.PropTypes.array,
    expandedErrorRows: React.PropTypes.array,
    uploadedRows: React.PropTypes.array,
    failedReverseEntries: React.PropTypes.array,
    generatedUuids: React.PropTypes.array,
    reverseEntries: React.PropTypes.array,
    mapping: React.PropTypes.object,
    projectDefinition: React.PropTypes.object,
    filterByFailed: React.PropTypes.bool,
    currentBranchRef: React.PropTypes.string
};

export default RowAnswerBootstrap;

