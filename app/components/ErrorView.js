import React from 'react';
import Navbar from 'react-bootstrap/lib/Navbar';

const getErrors = (errors) => {
    return (
        errors.map((error, index) => {
            return <h1 key={index}>{error.title}</h1>;
        })
    );
};

const ErrorView = ({ errors }) => {

    //check what type of errors response we got
    const isArray = Array.isArray(errors);

    return (
        <div>
            <Navbar collapseOnSelect fixedTop fluid className="primary-navbar">
                <Navbar.Header>
                    <Navbar.Brand>
                        <a href="https://five.epicollect.net">
                            <img src="/app/vendor/images/brand.png" width="180" height="40" alt="Epicollect5 Logo"/>
                        </a>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
            </Navbar>
            <div id="error-view" className="container-fluid">
                {isArray ? getErrors(errors) : errors}
            </div>
        </div>
    );
};

ErrorView.propTypes = {
    errors: React.PropTypes.any
};

export default ErrorView;
