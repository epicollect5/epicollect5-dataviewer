import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import DayPicker from 'react-day-picker';

class ModalStartDate extends React.Component {

    constructor(props) {
        super(props);

        this.handleCloseStartDateModal = this.handleCloseStartDateModal.bind(this);
    }

    render() {
        return (
            <Modal
                dialogClassName="start-date-modal"
                show={this.props.showStartDateModal}
                onHide={this.handleCloseStartDateModal}
                bsSize="small"
            >
                <Modal.Header closeButton>
                    <span className="start-date__entry-title text-center">Pick start date</span>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <DayPicker
                            selectedDays={this.state.selectedStartDate}
                            onDayClick={this.handleStartDateClick}
                            initialMonth={this.state.selectedStartDate}

                            disabledDays={[
                                {
                                    after: endDateInJS,
                                    before: startDateInJS
                                }
                            ]}
                        />
                    </div>
                    {this.state.isInvalidStartDate
                        ? <p
                            className="text-danger text-center"
                        >Cannot select this day
                        </p>
                        : <p />
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle="primary" onClick={this.onStartDateApplyClick}>Apply</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

ModalStartDate.propTypes = {
    showStartDateModal: React.PropTypes.bool
};

export default ModalStartDate;
