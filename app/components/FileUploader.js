import React from 'react';
import PARAMETERS from 'config/parameters';

const FileUploader = (props) => {

    const handleClick = () => {
        document.getElementById('hiddenFileInput').click();
    };

    const handleChange = (e) => {

        const fileUploaded = e.target.files[0];

        //we do this to allow the user to select the same fie, otherwise onChange does not get triggered
        e.target.value = '';

        //if size (in bytes) too big, bail out
        if (fileUploaded.size > PARAMETERS.BULK_MAX_FILE_SIZE_BYTES) {
            props.handleFileError(PARAMETERS.LABELS.FILE_SIZE_ERROR);
            return false;
        }

        console.log(fileUploaded);

        props.handleFileChange(fileUploaded);
    };

    return (
        <div className="file-uploader text-center">
            <button onClick={handleClick} className="btn btn-action">
                <span className="material-icons">
                folder_open
                </span>
                &nbsp; Choose
            </button>
            <input
                type="file"
                id="hiddenFileInput"
                onChange={handleChange}
                style={{ display: 'none' }}
            />
        </div>
    );
};

FileUploader.propTypes = {
    handleFileChange: React.PropTypes.func,
    handleFileError: React.PropTypes.func
};

export default FileUploader;
