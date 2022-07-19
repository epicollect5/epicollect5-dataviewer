import React from 'react';

const ButtonImport = () => {
    return (
        <div className="button-import">
            <button
                className="btn btn-default btn-action-inverse-bright btn-icon-medium"
                onClick={() => {
                    this.handleImport();
                }}
            >
                <i className="material-icons">publish</i>
            </button>
        </div>
    );
};


export default ButtonImport;
