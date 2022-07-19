import React from 'react';
import { connect } from 'react-redux';
import pieChart from 'utils/pie-chart';

class DistributionChart extends React.Component {

    constructor(props) {
        super(props);
        this.donutSize = 100;
    }

    componentDidUpdate() {
        console.log('DistributionChart updated');
    }

    getPieChartLegend(pieChartLegend, distribution) {
        return (
            <div className="legend-wrapper">
                <table className="table">
                    <tbody>
                    {pieChartLegend.map((item, index) => {

                        const tdStyle = {
                            background: item.color,
                            width: '24px',
                            height: '24px'
                        };

                        return (
                            <tr key={index}>
                                <td className="legend-color" style={tdStyle} />
                                <td className="legend-answer text-left"><span>&nbsp;{item.answer}</span></td>
                                <td className="legend-percentage">{distribution[item.answerRef]}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        );
    }

    render() {

        console.log('rendering distribution chart');

        const { filteredEntries, entriesLocations } = this.props;
        const { pieChartParams, pieChartLegend } = this.props;
        const distribution = {};
        let answersTotal = 0;
        const entries = filteredEntries.length > 0 ? filteredEntries : entriesLocations;

        //do not show anything if no question gets selected
        if (pieChartParams === null || pieChartLegend === null) {
            return null;
        }

        //per each answerRef, calculate distribution
        Object.keys(pieChartParams.possibleAnswersHashMap).forEach((answerRef) => {

            distribution[answerRef] = 0;

            entries.forEach((entry) => {
                if (entry.properties.possible_answers[answerRef]) {
                    distribution[answerRef]++;
                    answersTotal++;
                }
            });
        });

        const sectors = pieChart.calculateSectors(distribution, answersTotal, this.donutSize, pieChartLegend);
        const chart = pieChart.getSimplePieChartSVG(this.donutSize, sectors);

        return (
            <div className="distribution-chart animated fadeIn">
                <span className="filtered-total">Filtered total: {answersTotal}</span>
                <div dangerouslySetInnerHTML={{ __html: chart }} />
                {this.getPieChartLegend(pieChartLegend, distribution, answersTotal)}
            </div>
        );
    }
}

DistributionChart.propTypes = {
    pieChartParams: React.PropTypes.object,
    filteredEntries: React.PropTypes.array,
    entriesLocations: React.PropTypes.array,
    pieChartLegend: React.PropTypes.array
};

const mapStateToProps = (state) => {
    return {
        pieChartParams: state.mapReducer.pieChartParams,
        filteredEntries: state.mapReducer.filteredEntries,
        entriesLocations: state.mapReducer.entriesLocations,
        pieChartLegend: state.mapReducer.pieChartLegend
    };
};

export default connect(mapStateToProps)(DistributionChart);
