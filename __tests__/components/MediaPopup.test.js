import React from 'react';
import { shallow, mount, render } from 'enzyme';
import MediaPopup from 'components/MediaPopup';
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
        expect(wrapper).toHaveLength(1);
        expect(wrapper.find('video')).toHaveLength(1);
        expect(wrapper.find('audio')).toHaveLength(0);
    });
});
