import React from 'react';
import { Cell, Column } from 'fixed-data-table-2';
import PARAMETERS from 'config/parameters';

class ColumnsQuestions extends React.Component {

    render() {

        const { mapping, reverseEntries } = this.props;

        return (Object.values(mapping).map((entryMapping) => {

                console.log(entryMapping);

                if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {

                    const parts = {
                        latitude: 'lat_',
                        longitude: 'long_',
                        accuracy: 'accuracy_'
                    };

                    return Object.entries(parts).map((part) => {
                        return (
                            <Column
                                key={part[1] + entryMapping.map_to}
                                header={<Cell>{part[1] + entryMapping.map_to}</Cell>}
                                cell={(props) => {
                                    return (
                                        <Cell {...props}>
                                            reverseEntries[props.rowIndex].data.entry.answers[entryMapping.input_ref].answer[part[0]])
                                        </Cell>
                                    );
                                }}
                                width={200}
                            />

                        );
                    });
                }

                return (<Column
                        key={entryMapping.map_to}
                        header={<Cell>{entryMapping.map_to}</Cell>}
                        cell={(props) => {
                            return (
                                <Cell {...props}>
                                    {reverseEntries[props.rowIndex].data.entry.answers[entryMapping.input_ref].answer}
                                </Cell>
                            );
                        }}
                        width={200}
                        />
                );
            })
        );


    }
}

ColumnsQuestions.propTypes = {
    mapping: React.PropTypes.object,
    reverseEntries: React.PropTypes.array
};

export default ColumnsQuestions;

