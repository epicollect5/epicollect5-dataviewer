import React from 'react';
import { shallow } from 'enzyme';
import FileUploader from 'components/FileUploader';
import PARAMETERS from 'config/parameters';

describe('(Component) FileUploader', () => {

    const buildFile = (size) => {
        return { size, name: 'a-file.csv' };
    };

    const buildEvent = (file) => {
        return { target: { files: [file], value: 'a-file.csv' } };
    };

    it('renders without exploding', () => {
        const wrapper = shallow(
            <FileUploader handleFileChange={jest.fn()} handleFileError={jest.fn()} />
        );
        expect(wrapper).toHaveLength(1);
    });

    it('+++ should report an error when the file is too big', () => {
        const handleFileChange = jest.fn();
        const handleFileError = jest.fn();
        const wrapper = shallow(
            <FileUploader handleFileChange={handleFileChange} handleFileError={handleFileError} />
        );

        const event = buildEvent(buildFile(PARAMETERS.BULK_MAX_FILE_SIZE_BYTES + 1));
        wrapper.find('input').simulate('change', event);

        expect(handleFileError).toHaveBeenCalledWith(PARAMETERS.LABELS.FILE_SIZE_ERROR);
        expect(handleFileChange).not.toHaveBeenCalled();
    });

    it('+++ should upload a file within the size limit', () => {
        const handleFileChange = jest.fn();
        const handleFileError = jest.fn();
        const wrapper = shallow(
            <FileUploader handleFileChange={handleFileChange} handleFileError={handleFileError} />
        );

        const file = buildFile(PARAMETERS.BULK_MAX_FILE_SIZE_BYTES);
        wrapper.find('input').simulate('change', buildEvent(file));

        expect(handleFileChange).toHaveBeenCalledWith(file);
        expect(handleFileError).not.toHaveBeenCalled();
    });

    it('+++ should reset the input so the same file can be selected again', () => {
        const wrapper = shallow(
            <FileUploader handleFileChange={jest.fn()} handleFileError={jest.fn()} />
        );

        const event = buildEvent(buildFile(100));
        wrapper.find('input').simulate('change', event);

        expect(event.target.value).toBe('');
    });
});
