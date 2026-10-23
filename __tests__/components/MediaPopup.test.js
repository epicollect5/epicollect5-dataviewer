jest.mock('axios');

import React from 'react';
import { shallow, mount, render } from 'enzyme';
import axios from 'axios';
import MediaPopup from 'components/MediaPopup';
import Loader from 'components/Loader';
import PARAMETERS from 'config/parameters';


describe('(Component) MediaPopup', () => {
    it('renders AUDIO without exploding', () => {
        const content = {
            answer: {
                entry_default: 'file.mp4'
            }
        };
        const type = PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE;
        const wrapper = shallow(<MediaPopup content={content} type={type} />);
        //media is only rendered inside the modal once it is open and the file check passed
        wrapper.setState({ showModal: true, showLoader: false, fileNotFound: false });
        expect(wrapper).toHaveLength(1);
        expect(wrapper.find('audio')).toHaveLength(1);
        expect(wrapper.find('video')).toHaveLength(0);
    });

    it('renders VIDEO without exploding', () => {
        const content = {
            answer: {
                entry_default: 'file.mp4'
            }
        };
        const type = PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE;
        const wrapper = shallow(<MediaPopup content={content} type={type} />);
        //media is only rendered inside the modal once it is open and the file check passed
        wrapper.setState({ showModal: true, showLoader: false, fileNotFound: false });
        expect(wrapper).toHaveLength(1);
        expect(wrapper.find('video')).toHaveLength(1);
        expect(wrapper.find('audio')).toHaveLength(0);
    });

    it('+++ should show the loader while the file is being checked', () => {
        const content = { answer: { entry_default: 'file.mp4' } };
        const wrapper = shallow(<MediaPopup content={content} type={PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE} />);

        expect(wrapper.state('showLoader')).toBe(true);
        expect(wrapper.state('fileNotFound')).toBe(true);
        expect(wrapper.instance().getMediaMarkup('a-url').type).toBe(Loader);
    });

    it('+++ should show a warning when the file was not uploaded', () => {
        const content = { answer: { entry_default: 'file.mp4' } };
        const wrapper = shallow(<MediaPopup content={content} type={PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE} />);
        wrapper.setState({ showLoader: false, fileNotFound: true });

        const markup = wrapper.instance().getMediaMarkup('a-url');
        expect(markup.props.className).toBe('text-center');
    });

    it('+++ should open the modal and load the file', () => {
        axios.mockReturnValue(Promise.resolve());

        const content = { answer: { entry_default: 'file.mp4' } };
        const wrapper = shallow(<MediaPopup content={content} type={PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE} />);

        wrapper.instance().open();
        expect(wrapper.state('showModal')).toBe(true);

        return Promise.resolve().then(() => {
            expect(wrapper.state('showLoader')).toBe(false);
            expect(wrapper.state('fileNotFound')).toBe(false);
        });
    });

    it('+++ should keep the file not found flag when the check fails', () => {
        axios.mockReturnValue(Promise.reject(new Error('the file was not found')));

        const content = { answer: { entry_default: 'file.mp4' } };
        const wrapper = shallow(<MediaPopup content={content} type={PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE} />);

        wrapper.instance().open();

        //a macrotask lets every pending microtask drain
        return new Promise((resolve) => setTimeout(resolve, 0)).then(() => {
            expect(wrapper.state('showLoader')).toBe(false);
            expect(wrapper.state('fileNotFound')).toBe(true);
        });
    });

    it('+++ should close the modal', () => {
        const content = { answer: { entry_default: 'file.mp4' } };
        const wrapper = shallow(<MediaPopup content={content} type={PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE} />);

        wrapper.setState({ showModal: true });
        wrapper.instance().close();

        expect(wrapper.state('showModal')).toBe(false);
    });

});
