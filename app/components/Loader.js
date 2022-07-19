import React from 'react';

const Loader = ({ elementClass }) => {
    const loaderClass = 'loader ' + (elementClass || '');
    return (
        <div className={loaderClass}>Loading...</div>
    );
};

Loader.propTypes = {
    elementClass: React.PropTypes.string
};

export default Loader;
