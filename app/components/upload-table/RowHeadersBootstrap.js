import React from 'react';
import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';

class RowHeadersBootstrap extends React.Component {

    render() {

        const { projectDefinition, hierarchyNavigator, currentBranchRef, mapping } = this.props;
        const currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const forms = projectDefinition.project.forms;
        let branchInputs = [];
        const currentFormIndex = helpers.getFormIndexFromRef(forms, currentFormRef);
        let inputs = forms[currentFormIndex].inputs;

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

        /**
         * Super hack! Add an extra element to have the ec5_uuid column
         * when we loop the inputs
         */
        if (!(inputs[0].type === 'ec5_uuid' || inputs[0].type === 'ec5_branch_uuid')) {

            inputs.unshift({
                max: null,
                min: null,
                ref: null,
                type: currentBranchRef === null ? 'ec5_uuid' : 'ec5_branch_uuid',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: null,
                default: null,
                is_title: null,
                question: null,
                uniqueness: null,
                is_required: null,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: null
            });
        }

        return (<tr>
            {inputs
                .filter((input) => {
                    //skip README and BRANCH types from mapping
                    return !(input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE || input.type === PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE);
                })

                .map((input, inputIndex) => {

                    if (inputIndex === 0) {
                        return (<th key={0}>{input.type}</th>);
                    }

                    let entryMapping = {};

                    //are we showing a hierarchy or branch entry?
                    if (currentBranchRef) {
                        //hierarchy entry
                        entryMapping = mapping[currentBranchRef].branch[input.ref];
                    } else {
                        //hierarchy entry
                        entryMapping = mapping[input.ref];
                    }

                    //group headers do not appear in csv
                    if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {

                        return input.group

                            //do not map README types
                            .filter((groupInput) => {
                                return groupInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE;
                            })
                            .map((groupInput) => {

                                const groupEntryMapping = entryMapping.group[groupInput.ref];

                                //Is it a location group input?
                                if (groupEntryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {

                                    const parts = {
                                        latitude: 'lat_',
                                        longitude: 'long_',
                                        accuracy: 'accuracy_'
                                    };

                                    return Object.entries(parts).map((part) => {
                                        const header = part[1] + groupEntryMapping.map_to;
                                        return (<th key={header}>{header}</th>);
                                    });
                                }
                                //default header
                                return (<th key={groupEntryMapping.map_to}>{groupEntryMapping.map_to}</th>);
                            });
                    }

                    //location header is split in three parts
                    if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {

                        const parts = {
                            latitude: 'lat_',
                            longitude: 'long_',
                            accuracy: 'accuracy_'
                        };

                        return Object.entries(parts).map((part) => {
                            const header = part[1] + entryMapping.map_to;
                            return (<th key={header}>{header}</th>);
                        });
                    }
                    //default header
                    return (<th key={entryMapping.map_to}>{entryMapping.map_to}</th>);
                })}
        </tr>);
    }
}

RowHeadersBootstrap.propTypes = {
    hierarchyNavigator: React.PropTypes.array,
    mapping: React.PropTypes.object,
    projectDefinition: React.PropTypes.object,
    currentBranchRef: React.PropTypes.string
};

export default RowHeadersBootstrap;

