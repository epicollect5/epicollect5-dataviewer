import React from 'react';
import PARAMETERS from 'config/parameters';

class RowErrorsBootstrap extends React.Component {

    render() {

        const { mapping, responses, rowIndex, expandedErrorRows, inputs, currentBranchRef } = this.props;
        const baseClassName = 'upload-entries__error-row';
        const dynamicClassName = expandedErrorRows[rowIndex] ? baseClassName : baseClassName + ' hidden';

        return (<tr className={dynamicClassName} key={rowIndex}>
            {inputs
                .filter((input) => {
                    //skip README and BRANCH types from mapping
                    return !(input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE || input.type === PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE);
                })
                .map((input, inputIndex) => {

                    let entryMapping = {};
                    //error for uuid, as it does not have a mapping, make a fake one
                    if (inputIndex === 0) {
                        entryMapping = {
                            hide: false,
                            group: [],
                            branch: [],
                            map_to: currentBranchRef === null ? 'ec5_uuid' : 'ec5_branch_uuid',
                            possible_answers: [],
                            input_ref: null,
                            type: null,
                            is_title: false,
                            datetime_format: null,
                            reverse_possible_answers: {},
                            reverse_jumps: []
                        };
                    } else {
                        //are we showing a hierarchy or branch entry?
                        if (currentBranchRef) {
                            //hierarchy entry
                            entryMapping = mapping[currentBranchRef].branch[input.ref];
                        } else {
                            //hierarchy entry
                            entryMapping = mapping[input.ref];
                        }
                    }

                    let errorTitle = '';

                    if (responses[rowIndex].errors) {

                        responses[rowIndex].errors.forEach((error) => {
                            if (error.source === entryMapping.input_ref) {
                                //get only the first error message, it is enough ;)
                                if (errorTitle === '') {
                                    errorTitle = error.title;
                                }
                                return false;
                            }

                            //todo put these errors in constants
                            //is the project version out of date?
                            if (error.source === 'upload-controller' && error.code === 'ec5_201') {
                                errorTitle = error.title;
                                return false;
                            }

                            //HTML tags?
                            if (error.source === 'json-contains-html' && error.code === 'ec5_220') {
                                errorTitle = error.title;
                                return false;
                            }

                            //project trashed?
                            if (error.source === 'upload-controller' && error.code === 'ec5_202') {
                                errorTitle = error.title;
                                return false;
                            }
                            //show following errors only on ec5_uuid column
                            if (inputIndex === 0) {
                                //update not allowed?
                                if (error.source === 'upload' && error.code === 'ec5_54') {
                                    errorTitle = error.title;
                                    return false;
                                }

                                //invalid uuid?
                                if (error.source === 'entry.entry_uuid' && error.code === 'ec5_28') {
                                    errorTitle = error.title;
                                    return false;
                                }
                                //invalid uuid?
                                if (error.source === 'id' && error.code === 'ec5_28') {
                                    errorTitle = error.title;
                                    return false;
                                }
                                //not matching uuid <> owner_uuid? (for branch upload)
                                if (error.source === 'upload' && error.code === 'ec5_358') {
                                    errorTitle = error.title;
                                    return false;
                                }
                                //not matching uuid <> parent_uuid? (for child entries upload)
                                if (error.source === 'upload' && error.code === 'ec5_359') {
                                    errorTitle = error.title;
                                    return false;
                                }
                                //Bulk uploads not allowed?
                                if (error.source === 'bulk-upload' && error.code === 'ec5_363') {
                                    errorTitle = error.title;
                                    return false;
                                }
                                //Bulk uploads disabled?
                                if (error.source === 'middleware' && error.code === 'ec5_360') {
                                    errorTitle = error.title;
                                    return false;
                                }
                                //Permissions to access the project?
                                if (error.source === 'upload-controller' && error.code === 'ec5_71') {
                                    errorTitle = error.title;
                                    return false;
                                }
                               //too many requests?
                               if (error.source === 'rate-limiter' && error.code === 'ec5_255') {
                                 errorTitle = error.title;
                                 return false;
                               }
                            }
                        });
                    }

                    if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {

                        const parts = {
                            latitude: 'lat_',
                            longitude: 'long_',
                            accuracy: 'accuracy_'
                        };

                        return Object.entries(parts).map((part) => {
                            return (
                                <td key={part[1] + entryMapping.map_to}>
                                    <span
                                        className="answer-error-label"
                                    >
                                        {errorTitle}
                                    </span>
                                </td>
                            );
                        });
                    }

                    if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {

                        return input.group
                            //do not map README types
                            .filter((groupInput) => {
                                return groupInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE;
                            })
                            .map((groupInput) => {

                                const groupEntryMapping = entryMapping.group[groupInput.ref];
                                errorTitle = '';

                                if (responses[rowIndex].errors) {

                                    responses[rowIndex].errors.forEach((error) => {

                                        if (error.source === groupEntryMapping.input_ref) {
                                            //get only the first error message, it is enough ;)
                                            if (errorTitle === '') {
                                                errorTitle = error.title;
                                            }
                                            return false;
                                        }

                                        //todo put these errors in constants
                                        //is the project version out of date?
                                        if (error.source === 'upload-controller' && error.code === 'ec5_201') {
                                            errorTitle = error.title;
                                            return false;
                                        }

                                        //HTML tags?
                                        if (error.source === 'json-contains-html' && error.code === 'ec5_220') {
                                            errorTitle = error.title;
                                            return false;
                                        }

                                        //project trashed?
                                        if (error.source === 'upload-controller' && error.code === 'ec5_202') {
                                            errorTitle = error.title;
                                            return false;
                                        }
                                    });
                                }

                                //Is it a location group input?
                                if (groupEntryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {

                                    const parts = {
                                        latitude: 'lat_',
                                        longitude: 'long_',
                                        accuracy: 'accuracy_'
                                    };


                                    return Object.entries(parts).map((part) => {
                                        return (
                                            <td key={part[1] + groupEntryMapping.map_to}>
                                                <span
                                                    className="answer-error-label"
                                                >
                                                    {errorTitle}
                                                </span>
                                            </td>
                                        );
                                    });
                                }

                                return (
                                    <td key={groupEntryMapping.map_to}>
                                        <span
                                            className="answer-error-label"
                                        >
                                            {errorTitle}
                                        </span>
                                    </td>
                                );
                            });
                    }

                    //errors for all inputs with a mapping
                    return (
                        <td key={entryMapping.map_to}>
                            <span
                                className="answer-error-label"
                            >
                                {errorTitle}
                            </span>
                        </td>
                    );
                })
            }
        </tr>);
    }
}

RowErrorsBootstrap.propTypes = {
    rowIndex: React.PropTypes.number,
    responses: React.PropTypes.array,
    mapping: React.PropTypes.object,
    expandedErrorRows: React.PropTypes.array,
    inputs: React.PropTypes.array,
    currentBranchRef: React.PropTypes.string
};

export default RowErrorsBootstrap;

