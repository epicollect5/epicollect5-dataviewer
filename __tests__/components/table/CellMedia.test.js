import React from 'react';
import { shallow, mount, render } from 'enzyme';
import CellMedia from 'components/table/CellMedia';
import PARAMETERS from 'config/parameters';
import { StyleSheetTestUtils } from 'aphrodite';

describe('(Component) CellMedia', () => {

    beforeEach(() => {

        StyleSheetTestUtils.suppressStyleInjection();
    });
    afterEach(() => {
        StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
    });


    it('renders photo thumbnail without exploding', () => {

        const props = {
            content: {
                inputType: PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE,
                cellType: PARAMETERS.CEll_TYPES.MEDIA,
                answer: {
                    entry_full: 'https://path-to-file.ext',
                    entry_thumb: 'https://path-to-thumb.ext'
                }
            }
        };
        const wrapper = mount(<CellMedia {...props} />);
        expect(wrapper).toHaveLength(1);

        //check href is set properly
        expect(wrapper.find('div.thumb-wrapper a').getDOMNode().attributes.getNamedItem('href').value)
            .toEqual(props.content.answer.entry_full);

        //check thumb url is set properly
        expect(wrapper.find('div.thumb-wrapper img').getDOMNode().attributes.getNamedItem('src').value)
            .toEqual(props.content.answer.entry_thumb);

        const lightbox = wrapper.find('Lightbox');
        expect(lightbox).toHaveLength(1);

        const mediaPopup = wrapper.find('MediaPopup');
        expect(mediaPopup).toHaveLength(0);
    });

    it('renders audio button without exploding', () => {

        const props = {
            content: {
                inputType: PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE,
                cellType: PARAMETERS.CEll_TYPES.MEDIA,
                answer: {
                    entry_full: 'https://path-to-file.ext'
                }
            }
        };
        const wrapper = mount(<CellMedia {...props} />);
        expect(wrapper).toHaveLength(1);

        const lightbox = wrapper.find('Lightbox');
        expect(lightbox).toHaveLength(0);

        const mediaPopup = wrapper.find('MediaPopup');
        expect(mediaPopup).toHaveLength(1);
    });

    it('renders video button without exploding', () => {

        const props = {
            content: {
                inputType: PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE,
                cellType: PARAMETERS.CEll_TYPES.MEDIA,
                answer: {
                    entry_full: 'https://path-to-file.ext'
                }
            }
        };
        const wrapper = mount(<CellMedia {...props} />);
        expect(wrapper).toHaveLength(1);

        const lightbox = wrapper.find('Lightbox');
        expect(lightbox).toHaveLength(0);

        const mediaPopup = wrapper.find('MediaPopup');
        expect(mediaPopup).toHaveLength(1);
    });

    it('open and close image popup on click', () => {

        const props = {
            content: {
                inputType: PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE,
                cellType: PARAMETERS.CEll_TYPES.MEDIA,
                answer: {
                    entry_full: 'https://path-to-file.ext'
                }
            }
        };

        const wrapper = mount(<CellMedia {...props} />);
        let lightbox = wrapper.find('Lightbox');
        expect(lightbox).toHaveLength(1);

        const mediaPopup = wrapper.find('MediaPopup');
        expect(mediaPopup).toHaveLength(0);

        //check lightbox state
        expect(lightbox.props().isOpen).toBe(false);
        wrapper.find('div.thumb-wrapper a').simulate('click');
        wrapper.find('div.thumb-wrapper a').simulate('click');
        wrapper.update();
        lightbox = wrapper.find('Lightbox');
        expect(lightbox.props().isOpen).toBe(true);
    });
});
